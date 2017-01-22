"use strict";

function Main() {
	var state = {},
			canvas,
			context,
			socket,
			timeStart = 0; // ms - reset from server

		function setup() {
			canvas = document.createElement("canvas"),
			canvas.width = 500;
			canvas.height = 500;
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
			socket.on('state', function (_state) {
				// complete state update
				state = _state;
			});
			socket.on('patch', function (patch) {
				// granular state update
				jsonpatch.apply(state, patch);
			});

			canvas.addEventListener("click", function (e) {
				var observer = jsonpatch.observe(state);
				state.units["0"].moveCommand.direction += Math.PI / 10;
				var patch = jsonpatch.generate(observer);
				socket.emit('patch', patch);
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
			for (var unit in state.units) {
				var unit = state.units[unit];
				var pos = getPositionAtTime(unit.moveCommand.position, unit.moveCommand.velocity, unit.moveCommand.direction, time - unit.moveCommand.time);
				context.fillRect(Math.floor(canvas.width / 2 + pos[0]), Math.floor(canvas.height / 2 + pos[1]), 10, 10);
			}

			requestAnimationFrame(gameLoop)
		}

		setup();
}

window.addEventListener('load', Main);
