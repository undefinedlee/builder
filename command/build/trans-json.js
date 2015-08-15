var transJs = require("./trans-js");
var template = require("fs").readFileSync(__dirname + "/json-template.tpl", "utf8");

module.exports = function(mod, code, callback){
	var json = template.replace("{{content}}", code);

	transJs(mod, json, callback);
};