var fs = require("fs");
var path = require("path");
// 原始配置文件
var configPath = path.join(__dirname, "config.json");
// 用户配置文件
var userConfigPath = path.join(process.env.HOME, ".hyjs", "config.json");
var readConfig = require("../lib/read-config");
var mkdirs = require("../lib/mkdirs");
var mix = require("../lib/mix");

var config = module.exports = function(isNative){
	if(!fs.existsSync(userConfigPath)){
		// 如果没有用户配置文件，则拷贝原始配置文件
		if(mkdirs(path.dirname(userConfigPath))){
			fs.writeFileSync(userConfigPath, fs.readFileSync(configPath));
		}
	}

	var config = readConfig(userConfigPath);
	var baseConfig = readConfig(configPath);

	config = mix(config, baseConfig);

	if(isNative !== true){
		isNative = isNative || config.env;
		config.publish = config.publish[isNative];
		if(!config.publish["path"]){
			switch(isNative){
				case "dev":
					config.publish["path"] = path.join(process.env.HOME, ".hyjs-publish");
					break;
				case "test":
					config.publish["path"] = path.join(process.env.HOME, ".hyjs-publish-test");
					break;
				case "release":
					config.publish["path"] = path.join(process.env.HOME, ".hyjs-publish-release");
					break;
			}
		}
	}

	return config;
};

config.set = function(newConfig){
	var oldConfig = config(true);

	oldConfig.publish[oldConfig.env] = newConfig.publish;
	newConfig.publish = oldConfig.publish;
	
	fs.writeFile(userConfigPath, JSON.stringify(newConfig), function(err){
		if(err){
			throw err;
		}
	});
};