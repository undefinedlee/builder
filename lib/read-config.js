var fs = require("fs");

module.exports = function(file, callback){
	var data;

	if(fs.existsSync(file)){
		if(callback){
			fs.readFile(file, function(err, data){
				if(err){
					throw err;
				}
				data = data.toString("utf8").replace(/\/\/.*?\n/g, "");
				callback(JSON.parse(data));
			});
		}else{
			data = fs.readFileSync(file, {
				encoding: "utf8"
			});
			data = data.replace(/\/\/.*?\n/g, "");
			return JSON.parse(data);
		}
	}else{
		if(callback){
			callback({});
		}else{
			return {};
		}
	}
};