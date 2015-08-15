var pathMod = require("path");
var depsMod = require("./deps");
var removeExt = require("./remove-ext");
var config = require("../../config/config")();
var constConfig = require("../../config/const");
var uglify = require("../../lib/uglify");

var prefix = 'define("{{modName}}", [{{deps}}], function(require, exports, module) {\n"use strict";\n';
var suffix = '\n});';

var sep = pathMod.sep;

function transSep(path){
	if(sep === "\\"){
		return path.replace(/\\/g, "/");
	}
	return path;
}

function removeVersion(mod){
	return mod.replace(constConfig.versionCheck, "/");
}

// 转换JS模块
module.exports = function(mod, code, callback){
	// 获取依赖模块
	var deps = depsMod.get(code);
	// 转换模块名
	mod = transSep(removeExt(mod));

	code = {
		// 模块代码
		code: prefix.replace("{{modName}}", removeVersion(mod)).replace("{{deps}}", (function(){
				var mods = [];
				deps.forEach(function(item){
					var name = item.name;
					// 相对模块转换为绝对模块
					if(item.type === "relative"){
						name = pathMod.normalize([pathMod.dirname(mod), name].join(sep));
					}
					mods.push('"' + removeVersion(transSep(removeExt(name))) + '"');
				});
				return mods.join(",");
			})()) + depsMod.replace(code, deps) + suffix,
		// 模块依赖
		deps: deps
	};

	// 压缩
	if(config.publish.mini){
		code.code = uglify(code.code);
	}

	callback(code);
};

