var cleanCSS = require("clean-css");
var transJs = require("./trans-js");
var template = require("fs").readFileSync(__dirname + "/css-template.tpl", "utf8");

module.exports = function(mod, code, callback){
	var css = template.replace("{{style}}", new cleanCSS().minify(code).replace(/[\r\n\t]/g, " ").replace(/\\/g, "\\\\").replace(/'/g, "\\\'"));

	transJs(mod, css, callback);
};