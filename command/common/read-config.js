var fs = require("fs");
var lazylist = require("../../lib/lazylist");
var Version = require("./version");
var pathMod = require("path");
var sep = pathMod.sep;
var readConfig = require("../../lib/read-config");
var console = require("../../lib/console");

var checkName = /^[a-zA-Z\-0-9]+$/;

module.exports = function(dir, callback, onerror){
	// 读取配置文件
	lazylist([function(callback){
		// 项目配置文件
		var file = dir + sep + "package.json";
		readConfig(file, callback);
	}, function(callback){
		// 模块配置文件
		readConfig(dir + sep + "module.json", callback);
	}], function(pConfig, mConfig){
		if(mConfig["module-type"] !== "group"){
			// 项目名检测
			if(!mConfig["name"]){
				console.title("\n========== " + dir + " ==========");
				console.warn("module.json miss name");
				onerror(pConfig, mConfig);
				return;
			}else if(!checkName.test(mConfig["name"])){
				console.title("\n========== " + dir + " ==========");
				console.warn("module name only support a-z A-Z 0-9 and -");
				onerror(pConfig, mConfig);
				return;
			}
			// 组名检测
			if(!mConfig["group"]){
				console.title("\n========== " + dir + " ==========");
				console.warn("module.json miss group");
				onerror(pConfig, mConfig);
				return;
			}else if(!checkName.test(mConfig["group"])){
				console.title("\n========== " + dir + " ==========");
				console.warn("module group only support a-z A-Z 0-9 and -");
				onerror(pConfig, mConfig);
				return;
			}
			// 版本号检测
			if(mConfig["version"]){
				if(/^\d+\.\d+\.\d+$/.test(mConfig["version"])){
					// mConfig["version-native"] = mConfig["version"];
					// mConfig["version"] = Version.get(mConfig["group"], mConfig["name"], mConfig["version"]);
					mConfig["version"] = Version.get(mConfig["group"], mConfig["name"], "");
				}else{
					console.log("version must same xx.xx.xx");
					//return;
				}
			}else{
				console.log("module.json miss version");
				//return;
			}
			// mConfig["version"] = Version.get(mConfig["group"], mConfig["name"], "");
		}

		callback(pConfig, mConfig);
	});
}