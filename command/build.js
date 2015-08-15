var fs = require("fs");
var pathMod = require("path");
var config = require("../config/config")();
var exec = require('child_process').exec;
var queue = require("../lib/queue");
var build = require("./build/build");
var readfiles = require("../lib/readfiles");
var readConfig = require("./common/read-config");
var console = require("../lib/console");

var sep = pathMod.sep;


// 构建模块
function buildModule(dir, pConfig, mConfig, callback){
	// 组名
	var group = mConfig["group"];
	// 项目名
	var modName = mConfig["name"];
	// 对外暴露文件
	var entries = mConfig["entries"] || ["index.js"];
	// 有依赖模块
	var hasDep = !!pConfig["devDependencies"];
	// 有执行脚本
	var scripts = pConfig["scripts"];
	// 项目版本
	var version = mConfig["version"] || "";

	console.title("\n========== " + [group, modName].join("/") + " ==========");
	console.info("version: " + version);

	// 构建前需执行脚本
	var preScripts = [];

	// 安装依赖的npm模块
	if(hasDep){
		preScripts.push("npm install");
	}

	if(scripts){
		// 执行prebuild脚本
		if(scripts["prebuild"]){
			preScripts = preScripts.concat(scripts["prebuild"]);
		}
	}

	if(preScripts.length){
		console.log("scripts:");
		console.log(preScripts.join("\n"));
	}

	if(preScripts.length){
		queue(preScripts, function(command, callback){
			console.log("start " + command);
			exec(command, {
				cwd: dir
			}, function (error, stdout, stderr) {
				if (error !== null) {
					console.error('exec error: ' + error);
				}
				callback();
			});
		}, function(){
			build(pathMod.join(group, modName, version), dir, entries, callback);
		});
	}else{
		build(pathMod.join(group, modName, version), dir, entries, callback);
	}
}

var buildFn = module.exports = function(dir, callback){
	readConfig(dir, function(pConfig, mConfig){
		if(mConfig["module-type"] === "group"){
			// 如果是模块组， 则构建下面的模块列表
			readfiles(dir, "/", false, function(dirs){
				queue(dirs, function(dir, next){
					buildFn(dir, next);
				}, callback);
			});
		}else{
			// 如果是模块，则直接构建
			buildModule(dir, pConfig, mConfig, callback);
		}
	}, callback);
};

module.exports = function(dir, callback){
	// 当前操作目录
	dir = dir || fs.realpathSync(".");

	buildFn(dir, function(){
		console.log("\nbuild finish");

		callback && callback();
	});
};