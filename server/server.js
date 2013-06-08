var express = require('express'),
	socket	= require('socket.io'),
	app		= express.createServer(),
	io		= socket.listen(app);

app.listen(8080);

app.configure(function(){
	app.use(function(req, res, next){
		app.removeHeader("X-Powered-By");
		app.header("Access-Control-Allow-Origin", "*");
	});
});

app.get('/', function (req, res) {
	  res.sendfile(__dirname + '/index.html');
});

/** SOCKETS **/

var socketsMap = {};

io.sockets.on("connection", function(socket){
	
	console.log("**********************************");
	console.log("*****     NEW CONNECTION     *****");
	console.log("**********************************");
	console.log(socket);
	console.log("**********************************");
	console.log("**********************************");
	console.log("**********************************");
	
	socket.on("setClick", function(data){
		io.sockets.emit("pushClick", data);
	});
	
	socket.on("setGameInfo", function(data){
		io.sockets.emit("pushGameInfo", data);
	});
});