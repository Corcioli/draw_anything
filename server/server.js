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
var first = true;
var socketsList = [];
var artist = null;
var words = ['david', 'corci', 'jackes'];
var alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','x','z'];
var currentWord = 0;

var pickNextArtist = function() {
	var ret = null;

	if(socketsList.length > 1) {
		while(ret === null) {
			if((artistIndex+1) >= socketsList.length) {
				artistIndex = -1;
			}
			if(socketsList[artistIndex+1]) {
				if(io.sockets.manager.connected[socketsList[artistIndex+1]]) {
					artistIndex++;
					ret = socketsList[artistIndex];
				} else {
					socketsList.splice(artistIndex+1, 1);
				}
			} else {
				ret = 'empty';
			}
		}
	} else {
		ret = 'waiting';
	}

	return ret;
}

var pickWord = function() {
	currentWord++;
	if(currentWord >= words.length) {
		currentWord = 0;
	}

	return words[currentWord];
}

var mixLetters = function(word) {
	var lettersArr = [];
	for(var idx = 0; idx < word.length; idx++) {
		lettersArr.push(word.substr(idx, 1));
	}
	lettersArr = addChar(lettersArr);
	var mixed = shuffle(lettersArr);
	return mixed;
};

var addChar = function(mixed) {
	var numToAdd = 10 - mixed.length;
	var alphabetLen = alphabet.length;
	for(var idx = 0; idx < numToAdd; idx++) {
		var rad = parseInt(Math.random() * alphabetLen);
		mixed.push(alphabet[rad]);
	}
	return mixed;
}

function shuffle(o){ //v1.0
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

var checkWord = function(word) {
	return (word == words[currentWord]);
}

io.sockets.on("connection", function(socket){
	socketsList.push(socket.id);
	var word = words[currentWord];
	if(first) {
		first = false;
		artist = socket.id;
		artistIndex = 0;
	} else {
		word = mixLetters(word);
	}

	socket.emit('handshake', {
		id: socket.id,
		artist: artist,
		status: (socketsList.length == 1) ? 'waiting' : 'ready',
		word: word
	});

	if(socketsList.length > 1) {
		io.sockets.emit('newUser', 'ready');
	}
	socket.on('setNewArtist', function(){
		var id = pickNextArtist();
		io.sockets.emit('newArtist', id);
	});

	socket.on("setClick", function(data){
		io.sockets.emit("pushClick", data);
	});

	socket.on("setGameInfo", function(data){
		io.sockets.emit("pushGameInfo", data);
	});

	socket.on("checkWord", function(data){
		var done = checkWord(data);
		if(done) {
			var newWord = pickWord();
			var mixed = mixLetters(newWord);
			io.sockets.emit("wordGuessed", {newArtist: socket.id, letters: mixed});
			socket.emit('artistWord', newWord);
			artist = socket.id;
		} else {
			io.sockets.emit("wordGuessed", false);
		}
	});

	socket.on('disconnect', function () {
		if(artist == socket.id && socketsList.length > 1) {
			artist = pickNextArtist();
			var newWord = pickWord();
			var mixed = mixLetters(newWord);
			io.sockets.emit("wordGuessed", {newArtist: artist, letters: mixed});
			if(io.sockets.manager.connected[artist]) {
				io.sockets.sockets[artist].emit('artistWord', newWord);
			}
		}
		var idx = socketsList.indexOf(socket.id);
		if(idx >= 0) {
			socketsList.splice(idx, 1);
		}
		if(socketsList.length <= 0) {
			first = true;
			socketsList = [];
			artist = null;
			currentWord = 0;
		}
	});
});