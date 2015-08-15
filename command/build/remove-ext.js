module.exports = function(path){
	return path.replace(/\.tpl$/, "-tpl")
				.replace(/\.css$/, "-css")
				.replace(/\.styl$/, "-styl")
				.replace(/\.txt$/, "-txt")
				.replace(/\.json$/, "-json")
				.replace(/\.js$/, "");
};