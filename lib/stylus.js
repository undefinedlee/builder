var stylus = require("stylus");
var nib = require("nib");
var path = require("path");

module.exports = function(file, code, callback){
	stylus(code)
		.set("paths", [path.dirname(file)])
		.use(nib())
		.render(function(err, css){
			if(err){
				throw err;
			}

			callback(css);
		});
};