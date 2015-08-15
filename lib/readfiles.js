var fs = require("fs");
var path = require("path");
var lazylist = require("./lazylist");

var sep = path.sep;

var ignore = [".git", ".DS_Store"];

var readfile = module.exports = function(dir, ext, isDeep, callback){
	var files = [];

	if(/node_modules/.test(dir)){
		callback(files);
		return;
	}

	dir = dir.replace(/(\/|\\)$/, "");

	fs.readdir(dir, function(err, _files){
		if(err){
			throw err;
		}

		var dirs = [],
			readStatList = [];
		_files.forEach(function(filename){
			// if(/^\./.test(filename)){
			// 	return;
			// }
			if(ignore.indexOf(filename) !== -1){
				return;
			}

			var file = dir + sep + filename;

			readStatList.push(function(callback){
				fs.stat(file, function(err, stats){
					if(err){
						throw err;
					}

					var _ext = path.extname(filename);

					if(stats.isDirectory()){
						dirs.push(function(callback){
							readfile(file, ext, isDeep, function(_files){
								files = files.concat(_files);
								callback();
							});
						});
						if(ext === "/"){
							files.push(file);
						}
					}else{
						if(ext){
							if(_ext === ext){
								files.push(file);
							}
						}else{
							files.push(file);
						}
					}
					callback();
				});
			});
		});

		lazylist(readStatList, function(){
			if(isDeep && dirs.length){
				lazylist(dirs, function(){
					callback(files);
				});
			}else{
				callback(files);
			}
		});
	});
};