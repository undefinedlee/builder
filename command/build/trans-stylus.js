var stylus = require("../../lib/stylus");
var transCss = require("./trans-css");
var path = require("path");

module.exports = function(file, mod, code, callback){
	stylus(file, code.toString("utf8"), function(css){
		transCss(mod, css, callback);
	});
};