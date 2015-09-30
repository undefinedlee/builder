var express = require('express');
var app = express();
var baseConfig = require("../config/config");
var config = baseConfig();
var backConfig = baseConfig(config.publish["back-env"]);
var constConfig = require("../config/const");
var fs = require("fs");
var pathMod = require("path");
var compress = require('compression')();
var http = require("http");
var Mime = require("mime");
var sep = pathMod.sep;

var runing = false;
var port = 80;
var root = config.publish.path;

// 是否是开发环境
var isDev = config.env === "dev";

function getMime(path){
	return Mime.lookup(pathMod.extname(path).replace(/^\./, "")) ||  "text/panel";
}

// 请求一个文件
// 如果本地有，读取本地的
// 如果本地没有，读取测试环境
function read(path, callback){
	path = path.split("?")[0];
	
	var localPath;
	var request;
	var _callback;

	if(isDev){
		localPath = pathMod.join(root, path.replace(constConfig.versionCheck, "/" + constConfig.devVersion + "/").replace(/\//g, sep));
		if(fs.existsSync(localPath)){
			// 如果本地有，则读取本地文件
			fs.readFile(localPath, function(err, data){
				callback(err, {
					contentType: getMime(path),
					data: data
				});
			});
		}else{
			// 如果没有则请求测试服务器文件
			localPath = "http://" + [backConfig.publish.host, path].join("/").replace(/\/+/g, "/");
			//console.log(localPath);
			//localPath = "http://www.baidu.com";
			_callback = function(e, data){
			    request.destroy();
			    callback(e, data);
			};
			request = http.get(localPath, function(res){
				if(res.statusCode != 200){
					_callback({
						msg: "请求错误"
					}, null);
					return;
				}
				var chunks = [];
				var size = 0;
				res.on('data', function(chunk){
					size += chunk.length;
					chunks.push(chunk);
				});
				res.on('end', function(){
					var data = Buffer.concat(chunks, size);
					_callback(null, {
						contentType: res.headers['content-type'],
						data: data
					});
				});
			}).on('error', function(e) {
				_callback(e, null);
			});
		}
	}else{
		// 如果不是开发环境，则直接从本地读取
		fs.readFile(pathMod.join(root, path.replace(/\//g, sep)), function(err, data){
			callback(err, {
				contentType: getMime(path),
				data: data
			});
		});
	}
}

// 读取一个combo文件
function combo(path, files, callback){
        files.forEach(function(file, index){
                files[index] = [path, file].join("/").replace(/\/+/g, "/");
        });
        var code = [];

        (function _read(){
                var file = files.shift();
                if(file){
                		read(file, function(err, res){
                            if(err){
                                code.push("/* " + file + " read fail! */");
                                console.error(file + " read fail!");
                            }else{
                                code.push("/* " + file + " */");
                                code.push(res.data);
                            }

                            _read();
                        });
                }else{
                        callback(code.join("\n"));
                }
        })();
}

var comboRemark = "!!",
	splitRemark = ",";

module.exports = function(_port){
	if(runing){
		console.log("had runing at port " + port)
		return;
	}

	if(_port){
		port = _port;
	}

	app.use(compress);
	app.use(function(req, res, next){
	        var path = req.originalUrl;
	        if(path.indexOf(comboRemark) !== -1){
	        	// combo请求
        		path = path.replace(comboRemark, "___comboRemark___").split("?")[0].replace("___comboRemark___", comboRemark);
                res.set("Content-Type", getMime(path));
                path = path.split(comboRemark);
                combo(path[0].replace(/^(\\|\/)/, ""), path[1].split(splitRemark), function(code){
                        res.send(code);
                });
            } else {
            	// 单文件请求
            	res.set("Access-Control-Allow-Origin", "*");
	        	read(path, function(err, data){
	        		if(err){
	        			console.log(path);
	        			console.log(err);
	        		}else{
		        		res.set("Content-Type", data.contentType);
		        		res.send(data.data);
		        	}
	        	});
            }
	});

	app.listen(port);
	console.log("run at port " + port);
	runing = true;
};
