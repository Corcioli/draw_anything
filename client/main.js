var socket = null;
var canvas = null;
var ctx = null;

var socketConnect = function() {
	socket = io.connect(__CONFIG__.socketIOHost);
};

var createCanvas = function () {
	var canvas = {};
	canvas.node = document.createElement("canvas");
	canvas.context = canvas.node.getContext("2d");
	canvas.node.width = 320;
	canvas.node.height = 440;
	document.body.appendChild(canvas.node);

	return canvas;
};

var init = function() {
	canvas = createCanvas();
	ctx = canvas.context;

	ctx.fillCircle = function(x, y) {
		this.fillStyle = '#000000';
		this.beginPath();
		this.moveTo(x,y);
		this.arc(x,y,10,0,Math.PI*2,false);
		this.fill();
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
			socket.emit("setClick", {posX: x, posY: y});
			ctx.fillCircle(x, y);
		}
	}

	canvas.node.onmousemove = startDraw;

	canvas.node.addEventListener('touchmove', startDraw, false);

	var drawing = function(e) {
		canvas.isDrawing = true;
	};

	var notDrawing = function(e) {
		canvas.isDrawing = false;
	};

	canvas.node.onmousedown = drawing;
	canvas.node.onmouseup = notDrawing;
	canvas.node.addEventListener('touchstart', drawing, false);
	canvas.node.addEventListener('touchend', notDrawing, false);
};