(function() {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();

var oneDegree = Math.PI / 180;
var oneTwentyDegrees = 2 * Math.PI / 3;
var twoFortyDegrees = Math.PI / 3 * 4;

var G = 6.67 * Math.pow(10, -11);

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var canvasWidth = 1000;
var canvasHeight = 700;
var canvasCenter = {
	x: canvasWidth / 2,
	y: canvasHeight / 2
};

canvas.width = canvasWidth;		// set html canvas width in pixels
canvas.height = canvasHeight;	// set html canvas height in pixels

var view = 0;
/*
VIEW LIST:
0 - menu
1 - single player
2 - multiplayer
3 - options
*/

var keys = [];
var clickPos = {
	x: 0,
	y: 0
};

/*
 *  MENU VARIABLES
 */
var menuOptions = Array(
	//"Single Player",
	"Multiplayer",
	"Options"
);
var menuOptionAttribs = {
  width: 200,
  height: 75,
  x: (canvasWidth / 2)
};

var menuOptionPositions = [];

/*
 *  GAME VARIABLES
 */
var SHOOTING_WAIT = 50;

var player1 = {
	color: "blue",
	x: 0,
	y: 0,
	width: 20,
	height: 20,
	mass: 20, // kg
	r: 0,
	R: 0,
	angle: 0,
	thrust: 0.005, // Newtons
	terminalVel: 5,
	velX: 0,
	velY: 0,
	shot: false,
	shootWait: SHOOTING_WAIT
};

var player2 = {
	color: "green",
	x: canvasWidth,
	y: canvasHeight,
	width: 20,
	height: 20,
	mass: 20, // kg
	r: 0,
	R: 0,
	angle: 0,
	thrust: 0.005, // Newtons
	terminalVel: 5,
	velX: 0,
	velY: 0,
	shot: false,
	shootWait: SHOOTING_WAIT
};

var attractor = {
	x: canvasCenter.x,
	y: canvasCenter.y,
	r: 20,
	width: 20,
	height: 20,
	mass: 19999999999999
};

var bullets = [];
var BULLET_VEL = 10;
var BULLET_R = 2;

player1.r = Math.sqrt(Math.pow(player1.width / 2, 2) + Math.pow(player1.height / 2, 2));
player2.r = Math.sqrt(Math.pow(player1.width / 2, 2) + Math.pow(player1.height / 2, 2));

function renderMenu() {
	var fontSize = 20;

	ctx.font = fontSize + "px Georgia";
	ctx.beginPath();
	ctx.lineWidth = "4";
	ctx.strokeStyle = "black";
	for (var i = 0; i < menuOptions.length; i++) {
		menuOptionPositions.push({
			x: menuOptionAttribs.x - (menuOptionAttribs.width / 2),
			y: (i + 1) * menuOptionAttribs.height
		});
		ctx.rect(menuOptionPositions[i].x, menuOptionPositions[i].y, menuOptionAttribs.width, menuOptionAttribs.height);
		ctx.fillText(menuOptions[i], menuOptionAttribs.x - (ctx.measureText(menuOptions[i]).width / 2), menuOptionPositions[i].y + (menuOptionAttribs.height / 2) + (fontSize / 3));
	}
	ctx.stroke();
}

function menuHandler() {
	for (var i = 0; i < menuOptionPositions.length; i++) {
		if (clickPos.x > menuOptionPositions[i].x && clickPos.x < menuOptionPositions[i].x + menuOptionAttribs.width) {
			if (clickPos.y > menuOptionPositions[i].y && clickPos.y < menuOptionPositions[i].y + menuOptionAttribs.height) {
				view = i + 1;
				console.log("view = " + view);
				break;
			}
		}
	}
}

function keyInputHandler2P() {
  // PLAYER 1 CONTROLS
	if (keys[87]) { // w
		shipThrust(player1);
	}
	if (keys[68]) { // d
		if (player1.angle - oneDegree * 5 < 0)
			player1.angle = 2 * Math.PI - (oneDegree * 5 - player1.angle);
		else
			player1.angle -= oneDegree * 5;
	}
	if (keys[65]) { // a
		if (player1.angle + oneDegree * 5 > 2 * Math.PI)
			player1.angle = (player1.angle + oneDegree * 5) % (2 * Math.PI);
		else
			player1.angle += oneDegree * 5;
	}
	if (!player1.shot && keys[83]) { // s
		shoot(player1);
		player1.shot = true;
	}

	// PLAYER 2 CONTROLS
	if (keys[38]) { // up
		shipThrust(player2);
	}
	if (keys[39]) { // right
		if (player2.angle - oneDegree * 5 < 0)
			player2.angle = 2 * Math.PI - (oneDegree * 5 - player2.angle);
		else
			player2.angle -= oneDegree * 5;
	}
	if (keys[37]) { // left
		if (player2.angle + oneDegree * 5 > 2 * Math.PI)
			player2.angle = (player2.angle + oneDegree * 5) % (2 * Math.PI);
		else
			player2.angle += oneDegree * 5;
	}
	if (!player2.shot && keys[40]) { // down
		shoot(player2);
		player2.shot = true;
	}
}

function physics2P() {
	var cx = canvasCenter.x, cy = canvasCenter.y;
	var g;

	// accelerate player1 toward attractor
	g = G * attractor.mass / (Math.pow(Math.abs(player1.x - attractor.x), 2) + Math.pow(Math.abs(player1.y - attractor.y), 2));
	if (player1.x > cx && player1.velX - g > -player1.terminalVel) player1.velX -= g;
	if (player1.x < cx && player1.velX + g < player1.terminalVel) player1.velX += g;
	if (player1.y > cy && player1.velY - g > -player1.terminalVel) player1.velY -= g;
	if (player1.y < cy && player1.velY + g < player1.terminalVel) player1.velY += g;

	// accelerate player2 toward attractor
	g = G * attractor.mass / (Math.pow(Math.abs(player2.x - attractor.x), 2) + Math.pow(Math.abs(player2.y - attractor.y), 2));
	if (player2.x > cx && player2.velX - g > -player2.terminalVel) player2.velX -= g;
	if (player2.x < cx && player2.velX + g < player2.terminalVel) player2.velX += g;
	if (player2.y > cy && player2.velY - g > -player2.terminalVel) player2.velY -= g;
	if (player2.y < cy && player2.velY + g < player2.terminalVel) player2.velY += g;

	// handle player1 canvas boundaries
	if (player1.x < 0) player1.x = canvasWidth;
	if (player1.x > canvasWidth) player1.x = 0;
	if (player1.y < 0) player1.y = canvasHeight;
	if (player1.y > canvasHeight) player1.y = 0;

	// handle player2 canvas boundaries
	if (player2.x < 0) player2.x = canvasWidth;
	if (player2.x > canvasWidth) player2.x = 0;
	if (player2.y < 0) player2.y = canvasHeight;
	if (player2.y > canvasHeight) player2.y = 0;

	player1.x += player1.velX;
	player1.y += player1.velY;

	player2.x += player2.velX;
	player2.y += player2.velY;

	// BULLET PHYSICS
	for (var i = 0; i < bullets.length; i++) {
		bullets[i].x = bullets[i].x + BULLET_VEL * Math.cos(2 * Math.PI - bullets[i].angle);
		bullets[i].y = bullets[i].y + BULLET_VEL * Math.sin(2 * Math.PI - bullets[i].angle);
	}

	// SHOOTING WAIT PERIOD
	if (player1.shot) {
		if (player1.shootWait <= 0) {
			player1.shot = false;
			player1.shootWait = SHOOTING_WAIT + 1;
		}
		player1.shootWait--;
	}
	if (player2.shot) {
		if (player2.shootWait <= 0) {
			player2.shot = false;
			player2.shootWait = SHOOTING_WAIT + 1;
		}
		player2.shootWait--;
	}

	// COLLISION HANDLING
	var collision = null;
	for (var b = 0; b < bullets.length; b++) {
		if (collision = colCheck(player1, bullets[b])) {
			GAME_ON = false;
			console.log("player1 collided w/ bullet");
		} else if (collision = colCheck(player2, bullets[b])) {
			GAME_ON = false;
			console.log("player2 collided w/ bullet");
		}
	}
	if (collision = colCheck(player1, attractor)) {
		GAME_ON = false;
		console.log("player1 collided w/ attractor");
	} else if (collision = colCheck(player2, attractor)) {
		GAME_ON = false;
		console.log("player2 collided w/ attractor");
	} else if (collision = colCheck(player1, player2)) {
		// BLOW UP BOTH PLAYERS
		GAME_ON = false;
		console.log("player1 collided w/ player2");
	}
}

function draw2P() {
	ctx.clearRect(0,0,canvasWidth,canvasHeight); // clear whole canvas

	ctx.strokeStyle = "red";
	ctx.beginPath();
	ctx.arc(attractor.x, attractor.y, attractor.r, 0, 2*Math.PI);
	ctx.stroke();

	// RENDER PLAYERS
	drawShip(player1.x, player1.y, player1.angle, player1.r, player1.color);
	drawShip(player2.x, player2.y, player2.angle, player2.r, player2.color);

	// RENDER ANY EXISTING BULLETS
	for (var i = 0; i < bullets.length; i++) {
		ctx.strokeStyle = "orange";
		ctx.beginPath();
		ctx.arc(bullets[i].x, bullets[i].y, BULLET_R, 0, 2*Math.PI);
		ctx.stroke();
	}
}

function multiplayer() {
	keyInputHandler2P();

	physics2P();

	draw2P();
}

function update() {
	switch (view) {
	case 0:
		renderMenu();
		document.body.addEventListener("click", function(e) {
			clickPos.x = e.pageX;
			clickPos.y = e.pageY;
		});
		menuHandler();
		break;
	case 1:
		multiplayer();
		break;
	case 2:
		options();
		break;
	}

	requestAnimationFrame(update);
}

function colCheck(shapeA, shapeB) {
	var vX = (shapeA.x + (shapeA.width / 2)) - (shapeB.x + (shapeB.width / 2));
	var vY = (shapeA.y + (shapeA.height / 2)) - (shapeB.y + (shapeB.height / 2));
	var hWidths = (shapeA.width / 2) + (shapeB.width / 2);
	var hHeights = (shapeA.height / 2) + (shapeB.height / 2);
	var colDir = null;

	if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
		var oX = hWidths - Math.abs(vX);
		var oY = hHeights - Math.abs(vY);

		if (oX >= oY) {
			if (vY > 0) {
				colDir = "t";
				shapeA.y += oY;
			} else {
				colDir = "b";
				shapeA.y -= oY;
			}
		} else {
			if (vX > 0) {
				colDir = "l";
				shapeA.x += oX;
			} else {
				colDir = "r";
				shapeA.x -= oX;
			}
		}
	}

	return colDir;
}

function drawShip(centerX, centerY, shipAngle, r, color) {
	var angle = 2 * Math.PI - shipAngle;

	var a1 = angle;
	var a2 = angle + oneTwentyDegrees;
	var a3 = angle + twoFortyDegrees;
	var x1 = centerX + r * Math.cos(a1);
	var y1 = centerY + r * Math.sin(a1);
	var x2 = centerX + r * Math.cos(a2);
	var y2 = centerY + r * Math.sin(a2);
	var x3 = centerX + r * Math.cos(a3);
	var y3 = centerY + r * Math.sin(a3);

	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.arc(x1, y1, 2, 0, 2 * Math.PI);
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x3, y3);
	ctx.lineTo(x1, y1);
	ctx.lineWidth = 5;
	ctx.stroke();
}

function shipThrust(ship) {
	acc = ship.thrust * ship.mass;
	if (ship.angle > 0 && ship.angle < Math.PI / 2) {
		if (ship.velX + acc < ship.terminalVel) ship.velX += acc;
		if (ship.velY - acc > -ship.terminalVel) ship.velY -= acc;
	} else if (ship.angle > Math.PI / 2 && ship.angle < Math.PI) {
		if (ship.velX - acc > -ship.terminalVel) ship.velX -= acc;
		if (ship.velY - acc > -ship.terminalVel) ship.velY -= acc;
	} else if (ship.angle > Math.PI && ship.angle < 3 * Math.PI / 2) {
		if (ship.velX - acc > -ship.terminalVel) ship.velX -= acc;
		if (ship.velY + acc < ship.terminalVel) ship.velY += acc;
	} else if (ship.angle > 3 * Math.PI / 2) {
		if (ship.velX + acc < ship.terminalVel) ship.velX += acc;
		if (ship.velY + acc < ship.terminalVel) ship.velY += acc;
	} else if (!ship.angle) {
		if (ship.velX + acc < ship.terminalVel) ship.velX += acc;
	} else if (ship.angle == Math.PI / 2) {
		if (ship.velY - acc > -ship.terminalVel) ship.velY -= acc;
	} else if (ship.angle == Math.PI) {
		if (ship.velX - acc > -ship.terminalVel) ship.velX -= acc;
	} else if (ship.angle == 3 * Math.PI / 2) {
		if (ship.velY + acc < ship.terminalVel) ship.velY += acc;
	}
}

function shoot(ship) {
	bullets.push({
		x: ship.x + (20 + ship.velX * 2) * Math.cos(2 * Math.PI - ship.angle),
		y: ship.y + (20 + ship.velY * 2) * Math.sin(2 * Math.PI - ship.angle),
		width: BULLET_R * 2,
		height: BULLET_R * 2,
		angle: ship.angle
	});
}

document.body.addEventListener("keydown", function(e) {
	keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
	keys[e.keyCode] = false;
});

window.addEventListener("load", function() {
	update();
});
