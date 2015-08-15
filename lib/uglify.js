var uglify = require("uglify-js");
	
module.exports = function(code){
    return uglify.minify(code, {
    	fromString: true
    }).code;
};