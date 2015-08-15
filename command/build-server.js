var http = require("http");

var port = 9999;


//module.exports = function(_port){
	//if(runing){
	//	console.log("had runing at port " + port)
	//	return;
	//}

	//if(_port){
	//	port = _port;
	//}

	var app = http.createServer(function(req, res){
		console.log(arguments);
		res.end();
	});

	app.listen(port);
	console.log("run at port " + port);
	//runing = true;
//};
