var fs = require("fs");
var pathMod = require("path");
var mkdirs = require("../lib/mkdirs");
var readfiles = require("../lib/readfiles");

var sep = pathMod.sep;

function create(path){
	// 当前路径
	path = path || fs.realpathSync(".");

	var templatePath = __dirname + sep + "project-template";

	readfiles(templatePath, "", true, function(files){
		files.forEach(function(file){
			fs.readFile(file, function(err, data){
				if(err){
					throw err;
				}
				file = path + file.replace(templatePath, "");
				mkdirs(pathMod.dirname(file), function(){
					fs.writeFile(file, data, function(err){
						if(err){
							throw err;
						}
						console.log(file + " create success!");
					});
				});
			});
		});
	}, true);
}

module.exports = function(path){
	process.stdout.write("确定要初始化项目？将会覆盖目录下原有文件！(y/N)\n");

	process.stdin.setEncoding('utf8');

	process.stdin.on('readable', function() {
	  var chunk = process.stdin.read();
	  if (chunk !== null) {
	  	process.stdin.pause();
	  	if(chunk.trim().toUpperCase() === "Y"){
	  		create(path);
	  	}
	  }
	});
};