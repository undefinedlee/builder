var fs = require("fs");
var pathMod = require("path");
var mkdirs = require("../../lib/mkdirs");
var hex = require("../../lib/hex");
var config = require("../../config/config")();
var constConfig = require("../../config/const");
var publishPath = config.publish.path;
var console = require("../../lib/console");
// 系统名
var system = config.system;
// 是否是开发环境
var isDev = config.env === "dev";

function getVersion(group, isPublish){
	return pathMod.join(publishPath, system, group, isPublish ? "version.json" : ".version.json");
}

function get(group, isPublish){
	var versionPath = getVersion(group, isPublish),
		data;

	if(fs.existsSync(versionPath)){
		data = fs.readFileSync(versionPath, {
			encoding: "utf8"
		});

		try{
			data = JSON.parse(data);
			return data;
		}catch(e){
			console.error("read " + versionPath + " error:");
			console.error(e);
			return {};
		}
	}else{
		return {};
	}
}

function save(group, data){
	var versionPath = getVersion(group);

	if(mkdirs(pathMod.dirname(versionPath))){
		fs.writeFileSync(versionPath, JSON.stringify(data));
	}
}


//var prefix = 'define("{{modName}}", function(require, exports, module) {\n"use strict";\nmodule.exports=';
//var suffix = '});';
var prefix = 'seajs.version("{{group}}", ';
var suffix = ');';

function updatePublishVersion(group, mod, version){
	var data = get(group, true);
	data[mod] = version;

	var versionPath = getVersion(group, true);

	if(mkdirs(pathMod.dirname(versionPath))){
		data = JSON.stringify(data);

		fs.writeFileSync(versionPath, data);

		// fs.writeFileSync(versionPath.replace(/\.json$/, ".js"),
		// 	prefix.replace("{{modName}}", pathMod.join(group, "version")) + data + suffix);

		fs.writeFileSync(versionPath.replace(/\.json$/, ".js"),
			prefix.replace("{{group}}", group) + data + suffix);
	}
}

module.exports = {
	update: function(group, mod){
		if(isDev){
			return 0;
		}

		var versions = get(group),
			version = versions[mod] || 0;

		version++;

		versions[mod] = version;
		save(group, versions);

		return version;
	},
	get: function(group, mod, modVersion){
		if(isDev){
			return constConfig.devVersion;
		}

		//modVersion = modVersion.split(".").slice(0,2).join(".") + ".";
		modVersion = "v.";

		var versions = get(group),
			version = versions[mod];

		if(version){
			version = modVersion + hex(version);
		}else{
			version = modVersion + hex(this.update(group, mod));
		}

		updatePublishVersion(group, mod, version);

		return version;
	}
};