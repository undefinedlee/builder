var fs = require("fs");
var pathMod = require("path");
var sep = pathMod.sep;
var config = require("../../config/config")();
// 系统名
var system = config.system;
var mkdirs = require("../../lib/mkdirs");
var readfiles = require("../../lib/readfiles");
var combo = require("./combo");
var transCssUrl = require("./trans-css-url");
var removeExt = require("./remove-ext");
var lazylist = require("../../lib/lazylist");
var stylus = require("../../lib/stylus");
var console = require("../../lib/console");

// UTF-8 BOM头
//var BOMHeader = new Buffer("\xef\xbb\xbf", "binary").toString("utf8");
//var BOMHeaderRegex = new RegExp(BOMHeader.replace(/\\/g, "\\\\"), "g");

// 发布到指定目录
function publish(file, dir, mod, callback){
	// 文件类型
	var ext = pathMod.extname(file);
	// 文件发布相对路径
	var relativePath = pathMod.join(mod, file.replace(dir, ""));
	// 转换后缀
	if(ext && ext !== ".css" && ext !== ".styl"){
		relativePath = removeExt(relativePath);
		if(!pathMod.extname(relativePath)){
			relativePath += ".js";
			ext = ".js";
		}
	}

	// 把处理后的code写入文件
	function write(relativePath, code){
		var filename = pathMod.normalize(pathMod.join(config.publish.path, system, relativePath));

		mkdirs(pathMod.dirname(filename), function(){
			//if(typeof code === "string"){
			//	code = BOMHeader + code.replace(BOMHeaderRegex, "");
			//}

			fs.writeFile(filename, code, function(err, data){
				if(err){
					throw err;
				}

				console.success(filename + " success!");

				callback();
			});
		});
	}

	// 
	function readWrite(file, relativePath, ext){
		fs.readFile(file, function(err, code){
			if(err){
				throw err;
			}

			if(ext === ".styl"){
				stylus(file, code.toString("utf8"), function(css){
					css = transCssUrl(pathMod.join(system, mod, pathMod.dirname(file).replace(dir, "")), css);
					write(relativePath, css);
				});
			}else{
				if(ext === ".css"){
					code = transCssUrl(pathMod.join(system, mod, pathMod.dirname(file).replace(dir, "")), code.toString("utf8"));
				}else if(ext === ".njs"){
					code = code.toString("utf8");
				}

				write(relativePath, code);
			}
		});
	}

	if(ext === ".js"){
		combo(file, relativePath, function(code){
			write(relativePath, code);
		});
	} else if(ext === ".njs") {
		readWrite(file.replace(/\.njs$/, ".js"), relativePath.replace(/\.njs$/, ".js"), ext);
	} else if(ext === ".styl") {
		readWrite(file, relativePath.replace(/\.styl$/, ".css"), ext);
	} else {
		readWrite(file, relativePath, ext);
	}
}

// 文件匹配模式
var entriesType = {
	// 单个文件
	file: /^[^*]+$/,
	// 单目录下所有文件
	dir: /\*$/,
	// 单目录下所有目录所有文件
	dirDeep: /\*\/\*\*$/,
	// 单目录下某类文件
	files: /\*(\.[a-z]+)$/,
	// 单目录下所有目录某类文件
	filesDeep: /\*\/\*\*(\.[a-z]+)$/
};

// 开始构建
module.exports = function(mod, dir, entries, callback){
	lazylist(entries.map(function(file){
		return function(callback){
			var ext;

			file = dir + sep + file;

			if(entriesType.file.test(file)){
				// 单个文件
				publish(file, dir, mod, callback);
			}else if(entriesType.dirDeep.test(file)){
				// 目录下所有文件
				//console.log(file);
				readfiles(file.replace(entriesType.dirDeep, ""), "", true, function(files){
					//console.log(file);
					lazylist(files.map(function(file){
						return function(callback){
							publish(file, dir, mod, callback);
						}
					}), callback);
				});
			}else if(entriesType.dir.test(file)){
				// 当级目录下所有文件
				readfiles(file.replace(entriesType.dir, ""), "", false, function(files){
					lazylist(files.map(function(file){
						return function(callback){
							publish(file, dir, mod, callback);
						}
					}), callback);
				});
			}else if(entriesType.filesDeep.test(file)){
				// 目录下所有某类文件
				ext = file.match(entriesType.filesDeep)[1];
				readfiles(file.replace(entriesType.filesDeep, ""), ext, true, function(files){
					lazylist(files.map(function(file){
						return function(callback){
							publish(file, dir, mod, callback);
						}
					}), callback);
				});
			}else if(entriesType.files.test(file)){
				// 当级目录下某类文件
				ext = file.match(entriesType.files)[1];
				readfiles(file.replace(entriesType.files, ""), ext, false, function(files){
					lazylist(files.map(function(file){
						return function(callback){
							publish(file, dir, mod, callback);
						}
					}), callback);
				});
			}
		};
	}), callback);
}