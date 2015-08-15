var fs = require("fs");
var pathMod = require("path");
var transJs = require("./trans-js");
var transTpl = require("./trans-tpl");
var transCss = require("./trans-css");
var transStylus = require("./trans-stylus");
var transTxt = require("./trans-txt");
var transJson = require("./trans-json");
var queue = require("../../lib/queue");
var transCssUrl = require("./trans-css-url");
var config = require("../../config/config")();
var console = require("../../lib/console");
// 系统名
var system = config.system;

var sep = pathMod.sep;

module.exports = function(file, modPath, callback){
	var seed = 1;
	var level = {};
	var cache = {};

	function read(file, modPath, callback){
		var ext = pathMod.extname(file);

		if(level[file]){
			level[file] = seed ++;
			callback();
			return;
		}

		fs.readFile(file, function(err, data){
			if(err){
				throw err;
			}

			data = data.toString("utf8");

			function next(deps, code){
				level[file] = seed ++;
				cache[file] = code;

				deps = (function(_deps){
					var deps = [];
					_deps.forEach(function(item){
						var name = item.name;
						if(item.type === "relative"){
							name = name + (pathMod.extname(name) ? "" : ".js");
							deps.push({
								file: pathMod.join(pathMod.dirname(file), name),
								modPath: pathMod.join(pathMod.dirname(modPath), name)
							});
						}
					});
					return deps;
				})(deps);

				//var codeList = [];

				queue(deps, function(dep, next){
					read(dep.file, dep.modPath, function(code){
						//codeList.push(code);
						next();
					});
				}, function(){
					//codeList.push(code);
					//callback(codeList.join("\n"));
					callback();
				});
			}

			if(ext === ".js"){
				transJs(modPath, data, function(temp){
					next(temp.deps, temp.code);
				});
			}else if(ext === ".tpl"){
				transTpl(modPath, data, function(temp){
					next(temp.deps, temp.code);
				});
			}else if(ext === ".css"){
				transCss(modPath, data, function(temp){
					var code = transCssUrl(pathMod.dirname(pathMod.join(system, modPath)), temp.code);
					next(temp.deps, code);
				});
			}else if(ext === ".styl"){
				transStylus(file, modPath, data, function(temp){
					var code = transCssUrl(pathMod.dirname(pathMod.join(system, modPath)), temp.code);
					next(temp.deps, code);
				});
			}else if(ext === ".txt"){
				transTxt(modPath, data, function(temp){
					next(temp.deps, temp.code);
				});
			}else if(ext === ".json"){
				transJson(modPath, data, function(temp){
					next(temp.deps, temp.code);
				});
			}
		});
	};

	read(file, modPath, function(){
		var code = [],
			sort = [];
		for(var key in level){
			sort.push([key, level[key]]);
		}
		sort.sort(function(a, b){
			return b[1] - a[1];
		});
		sort.forEach(function(item){
			code.push(cache[item[0]]);
		});

		//console.log(file + "================");
		//console.log(sort);

		callback(code.join("\n"));
	});
};