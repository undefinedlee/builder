var transJs = require("./trans-js");
var template = require("fs").readFileSync(__dirname + "/txt-template.tpl", "utf8");

module.exports = function(mod, code, callback){
	var css = template.replace("{{content}}", code.replace(/\n+/g, "").replace(/\\/g, "\\\\").replace(/'/g, "\\\'"));

	transJs(mod, css, callback);
};