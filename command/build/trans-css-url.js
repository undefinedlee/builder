var pathMod = require("path");
var host = require("../../config/config")().publish.host;
var sep = pathMod.sep;

module.exports = function(dir, code){
	return code.replace(/\burl\s*\(\s*(["']?)(.+?)\1\s*\)/g, function(all, q, url){
		if(/^((http|https):\/\/|data:image)/.test(url)){
			return all;
		}else{
			return all.replace(url, ["http://" + host, dir.split(sep).join("/"), url].join("/"));
		}
	});
};