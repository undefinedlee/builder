var transJs = require("./trans-js");

module.exports = function(mod, template, callback){
	try {
		template = template.replace(/(<\$<\$)+/g, function(prefix){
			return new Array(prefix.length / 4 + 1).join("___prefix___");
		}).replace(/\$>\$>/g, function(suffix){
			return new Array(suffix.length / 4 + 1).join("___suffix___");
		});

		template = "$>" + template.replace(/<!\-\-[\s\S]*?\-\->/g, "").replace(/\n+/g, "") + "<$";
		var deps = [];
		template = template.replace(/<\$# ([\s\S]*?) \$>/g, function(a, b){
			b = b.split(/\s*=\s*/);
			deps.push("var " + b[0] + " = require('" + b[1] + "');\n");
			return "";
		});
		template = deps.join("") + "module.exports = function(Model){var _$_ = [];" + template.replace(/<\$= ([\s\S]*?) \$>/g, function (a, b) {
			//return "<$ _$_.push(" + b.replace(/\\"/g, "\"").replace(/\\\\/g, "\\") + "); $>";
			return "<$ _$_.push(" + b + "); $>";
		}).replace(/<\$\- ([\s\S]*?) \$>/g, function (a, b) {
			return "<$ _$_.push(" + b + "); $>";
		}).replace(/\$>([\s\S]*?)<\$/g, function (a, b) {
			if (/^\s*$/.test(b))
				return "";
			else
				return "_$_.push(\"" + b.replace(/^\s+|\s+$/g, " ").replace(/\s+/g, " ").replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\");";
		}) + "return _$_.join('');}";

		template = template.replace(/(___prefix___)+/g, function(prefix){
			return new Array(prefix.length / 12 + 1).join("<$");
		}).replace(/(___suffix___)+/g, function(suffix){
			return new Array(suffix.length / 12 + 1).join("$>");
		});
	} catch (e) {
		template = "module.exports = function(){}";
	}

	transJs(mod, template, callback);
};