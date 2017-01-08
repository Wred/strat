"use strict";

function Main() {
	var units = {},
			canvas,
			context,
			socket,
			timeStart = 0; // ms - reset from server

		function setup() {
			canvas = document.createElement("canvas"),
			canvas.width = 1000;
			canvas.height = 1000;
			document.body.appendChild(canvas);
			context = canvas.getContext("2d");
			context.fillStyle = "white";

			socket = io();
			socket.on('time', function (data) {
				// current time server side (without counting latency)
				timeStart = data - performance.now();
				// start
				gameLoop();
			});
			socket.on('command', function (data) {
				units = data;
			});
		}

		function getPositionAtTime(position, velocity, direction, time) {
		  return [
		    position[0] + velocity * Math.cos(direction) * time,
		    position[1] + velocity * Math.sin(direction) * time
		  ];
		}


		function gameLoop() {
			// clear canvas
			context.clearRect(0, 0, canvas.width, canvas.height);

			var time = performance.now() + timeStart;

			// loop through elements
			for (var unit in units) {
				var unit = units[unit];
				var pos = getPositionAtTime(unit.moveCommand.position, unit.moveCommand.velocity, unit.moveCommand.direction, time - unit.moveCommand.timeStamp);
				context.fillRect(Math.floor(canvas.width / 2 + pos[0]), Math.floor(canvas.height / 2 + pos[1]), 2, 2);
			}

			requestAnimationFrame(gameLoop)
		}

		setup();
}

window.addEventListener('load', Main);
