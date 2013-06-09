var socket = null;
var canvas = null;
var ctx = null;
var gamePlay = "wait"; // wait, design, reply
var user = "";
var artist = "";
var word = "";
var guess  = [];
var guess_len = 0;
var typed  = [];

var checkMode = function ()
{
	console.log("user="+user);
	console.log("artist="+artist);
	if (artist == user)
	{
		startMode("design");
	}
	else
	{
		startMode("reply");
	}
}

var socketConnect = function() {
	socket = io.connect(__CONFIG__.socketIOHost);

	socket.on("handshake", function (data)
	{
		user   = data.id;
		artist = data.artist;
		if (data.status == "waiting")
			startMode("wait");
		else
			checkMode();
	});

	socket.on("newUser", function (data)
	{
		if (gamePlay == "wait")
			startMode("design");
	});

	socket.on("waitForUser", function (data)
	{
		gamePlay = "wait";
		startMode("wait");
	});

	socket.on("wordGuessed", function (data)
	{
		artist = data.newArtist;
		word   = data.letters;
		console.log("wordGuessed!");
		console.log("user="+user);
		console.log("artist="+artist);
		console.log("word="+word);
		if (artist!=user)
		{
			startMode("reply");
			guess = word;
			guess_len = data.wordLength;
			startTypeButtons();
		}
		else
		{
			startMode("reply");
		}

	});

	socket.on("artistWord", function (data)
	{
		console.log("user="+user);
		console.log("artist="+artist);
		console.log("nova palavra: " + data)
		word = data;
		if (gamePlay != "wait")
		{
			startMode("design");
			if (artist == user)
			{
				guess = [];
				document.getElementById("design_box").innerHTML = "Palavra: <b>" + word + "</b>";
			}
			else
			{
				guess = word;
				typed = [];
				startTypeButtons();
			}
		}
	});
};

var createCanvas = function () {
	var canvas = {};
	canvas.node = document.createElement("canvas");
	canvas.context = canvas.node.getContext("2d");
	canvas.node.width = 320;
	canvas.node.height = 290;
	document.getElementById(gamePlay + "_map").innerHTML = "";
	document.getElementById(gamePlay + "_map").appendChild(canvas.node);

	return canvas;
};


var startModeWait = function ()
{

};

var startModeDesign = function ()
{
	if (word.length > 0)
		document.getElementById("design_box").innerHTML = "Palavra: <b>" + word + "</b>";
	init();
};

var startTypeButtons = function ()
{
	document.getElementById("reply_box").innerHTML = "";
	for (var q=0;q<guess.length;q++)
	{
		bt = document.createElement("a");
		bt.id = q;
		bt.onclick = function ()
		{
			doType(this.id);
		};
		bt.innerHTML = guess[q];
		bt.className = "guessButton";
		document.getElementById("reply_box").appendChild(bt);
	}
};

var startTypedButtons = function ()
{
	document.getElementById("reply_typed").innerHTML = "";
	for (var q=0;q<typed.length;q++)
	{
		bt = document.createElement("a");
		bt.id = q;
		bt.onclick = function ()
		{
			doUntype(this.id);
		};
		bt.innerHTML = typed[q];
		bt.className = "guessButton";
		document.getElementById("reply_typed").appendChild(bt);
	}
};

var doUntype = function (charTyped)
{
	console.log("untyped="+charTyped);
	guess.push(typed[charTyped]);
	typed.splice(charTyped,1);

	startTypedButtons();
	startTypeButtons();
};

var doType = function (charTyped)
{
	console.log("typed="+charTyped+", "+guess[charTyped]);
	typed.push(guess[charTyped]);
	guess.splice(charTyped,1);

	startTypedButtons();
	startTypeButtons();

	var astr = typed.join("");
	if (astr.length == guess_len)
		socket.emit("checkWord", astr);
};

var startModeReply = function ()
{
	typed = [];
	document.getElementById("reply_typed").innerHTML = "";
	document.getElementById("reply_box").innerHTML = "";
	init();
};


var startMode = function (selectGamePlay)
{
	console.log("mode="+selectGamePlay);

	document.getElementById("wait").style.display   = "none";
	document.getElementById("design").style.display = "none";
	document.getElementById("reply").style.display  = "none";

	gamePlay = selectGamePlay;

	document.getElementById(selectGamePlay).style.display  = "";

	switch (selectGamePlay)
	{
		case "design":
			startModeDesign();
			break;
		case "reply":
			startModeReply();
			break;
		default:
			startModeWait();
			break;
	}
}

var init = function() {
	canvas = createCanvas();
	ctx    = canvas.context;

	ctx.fillCircle = function(x, y) {
		this.fillStyle = '#000000';
		this.beginPath();
		this.moveTo(x,y);
		this.arc(x,y,6,0,Math.PI*2,false);
		this.fill();
	}

	var doDraw = function (obj)
	{
		ctx.fillCircle(obj.posX, obj.posY);
	}

	var startDraw = function(e) {
		if(canvas.isDrawing && socket) {
			var x = null;
			var y = null;
			if(e.targetTouches) {
				x = e.targetTouches[0].pageX - this.offsetLeft;
				y = e.targetTouches[0].pageY - this.offsetTop;
			} else {
				x = e.pageX - this.offsetLeft;
				y = e.pageY - this.offsetTop;
			}
			var pos = {posX: x, posY: y};
			socket.emit("setClick", pos);
			doDraw(pos);
		}
	}

	canvas.node.onmousemove = startDraw;

	if (gamePlay == "design")
		canvas.node.addEventListener('touchmove', startDraw, false);

	var drawing = function(e) {
		canvas.isDrawing = true;
	};

	var notDrawing = function(e) {
		canvas.isDrawing = false;
	};

	if (gamePlay == "design")
	{
		canvas.node.onmousedown = drawing;
		canvas.node.onmouseup = notDrawing;
		canvas.node.addEventListener('touchstart', drawing, false);
		canvas.node.addEventListener('touchend', notDrawing, false);
	}

	socket.on('pushClick', function (data) {
		if (gamePlay == "reply")
			doDraw(data);
	});
};