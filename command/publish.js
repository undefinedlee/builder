var Ftp = require("ftp");
var fs = require("fs");
var pathMod = require("path");
var config = require("../config/config")();
var publishPath = config.publish.path;
var ftpConfig = config.publish.ftp;
// 系统名
var system = config.system;
var readfiles = require("../lib/readfiles");
var readJson = require("../lib/read-config");
var queue = require("../lib/queue");
var readConfig = require("./common/read-config");
var Version = require("./common/version");
var md5 = require("../lib/md5");

var build = require("./build");
var console = require("../lib/console");

var sep = pathMod.sep;

// 服务器路径分割符
//var serverSep = "/";
var serverSep = ftpConfig.sep || "/";
//var ftpDir = "files";
// 服务器发布根目录
var ftpDir = ftpConfig.root;
// 转换为服务器路径分隔符
function transServerSep(path){
	return path.replace(new RegExp("\\" + sep, "g"), serverSep);
}

// 在服务器上创建目录
function mkdirs(ftp, dir, callback){
	var _dir;

	if(!dir){
		callback();
	}else if(dir.indexOf(serverSep) === -1){
		ftp.mkdir(dir, callback);
	}else{
		_dir = dir.split(serverSep);
		_dir.pop();
		mkdirs(ftp, _dir.join(serverSep), function(){
			ftp.mkdir(dir, callback);
		});
	}
}

// 获取本地发布路径
function getLocalPath(group, mod, version){
	return pathMod.join(publishPath, system, group, mod, version);
}

// 获取发布md5文件路径
function getMd5Path(group, mod, version){
	return pathMod.join(getLocalPath(group, mod, version), ".publish-md5.json");
}

// 读取发布md5文件
function readMd5(group, mod, version){
	var filePath = getMd5Path(group, mod, version);

	return readJson(filePath);
}

// 更新发布md5文件
function updateMd5(group, mod, version, data){
	fs.writeFile(getMd5Path(group, mod, version), JSON.stringify(data), function(err){
		if(err){
			throw err;
		}
	});
}

function checkChange(group, mod, version, callback){
	// 项目发布md5值
	var md5Config = readMd5(group, mod, version);

	/*
		此处有个BUG
		如果publish之前，修改了项目，但是没有build，那么md5判断时不是最新的
		并且真正发布出去的文件会与md5文件不匹配
	*/

	// 读取发布目录所有文件
	var rootPath = getLocalPath(group, mod, version);
	readfiles(rootPath, "", true, function(files){
		var hasChange = files.some(function(file){
			var data;
			var md5code;

			if(!/\.publish-md5\.json$/.test(file)){
				data = fs.readFileSync(file);
				file = file.replace(rootPath + sep, "");
				md5code = md5(data);
				if(md5Config[file] !== md5code){
					return true;
				}
			}
		});

		callback(hasChange);
	});
}

// 发布模块
function publishModule(ftp, dir, pConfig, mConfig, callback){
	// 组名
	var group = mConfig["group"];
	// 项目名
	var modName = mConfig["name"];
	// 版本号
	var version = mConfig["version"];

	checkChange(group, modName, version, function(hasChange){
		if(!hasChange){
			callback();
			return;
		}

		// 更新版本号
		Version.update(group, modName);
		version = Version.get(group, modName);

		build(dir, function(){
			// 读取发布目录所有文件
			var rootPath = getLocalPath(group, modName, version);
			readfiles(rootPath, "", true, function(files){
				// 更新md5文件
				var md5Config = {};
				files.forEach(function(file){
					var data;
					var md5code;

					if(!/\.publish-md5\.json$/.test(file)){
						data = fs.readFileSync(file);
						file = file.replace(rootPath + sep, "");
						md5code = md5(data);
						md5Config[file] = md5code;
					}
				});

				console.info("\n---------- publish ----------");
				console.info("version: " + version);
				// 发布
				queue(files, function(file, next){
					if(/\.publish-md5\.json$/.test(file)){
						next();
						return;
					}

					var publistFile = file.replace(publishPath, ftpDir).replace(new RegExp("^\\" + sep), "");

					mkdirs(ftp, transServerSep(pathMod.dirname(publistFile)), function(){
						// 上传文件
						ftp.put(file, transServerSep(publistFile), function(err){
							if(err){
								throw err;
							}
							console.success(publistFile.replace(ftpDir + serverSep, "") + " put success!");

							next();
						});
					});
				}, function(){
					// 发布完成后更新MD5文件
					updateMd5(group, modName, version, md5Config);

					callback();
				});
			});
		});
	});
}

var publishFn = module.exports = function(dir, ftp, callback){
	readConfig(dir, function(pConfig, mConfig){
		if(mConfig["module-type"] === "group"){
			// 如果是模块组， 则发布下面的模块列表
			readfiles(dir, "/", false, function(dirs){
				queue(dirs, function(dir, next){
					publishFn(dir, ftp, next);
				}, function(){
					callback(mConfig["group"]);
				});
			});
		}else{
			// 如果是模块，则直接发布
			publishModule(ftp, dir, pConfig, mConfig, function(){
				callback(mConfig["group"]);
			});
		}
	});
};

module.exports = function(dir){
	// 当前路径
	dir = dir || fs.realpathSync(".");
	
	var ftp = new Ftp();

	ftp.on('ready', function() {
		publishFn(dir, ftp, function(group){
			var localPath = pathMod.join(publishPath, system, group, "version.js");
			//var serverPath = [ftpDir, system, group, "version.js"].join(serverSep);
			var dateNo = (new Date()).toJSON().split(".")[0].replace(/\D/g, "");
			// 上传版本文件
			ftp.put(localPath, [ftpDir, system, group, "version" + dateNo + ".js"].join(serverSep), function(err){
				if(err){
					console.log(localPath);
					console.log([ftpDir, system, group, "version" + dateNo + ".js"].join(serverSep));
					throw err;
				}

				console.success([system, group].join("/") + " version " + dateNo + " file put success!");

				ftp.put(localPath, [ftpDir, system, group, "version.js"].join(serverSep), function(err){
					if(err){
						throw err;
					}

					console.success([system, group].join("/") + " version file put success!");
					console.log("publish finish");

					ftp.end();
				});
			});
		});
	});

	ftp.connect({
		host: ftpConfig.host,
		port: ftpConfig.port,
		user: ftpConfig.user,
		password: ftpConfig.password
	});
};
