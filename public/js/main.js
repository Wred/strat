"use strict";

function Main() {
	var state = {},
			canvas,
			context,
			socket,
			timeStart = 0 // ms - reset from server

		function setup() {
			canvas = document.createElement("canvas")
			canvas.width = window.outerWidth
			canvas.height = window.outerHeight
			document.body.appendChild(canvas)
			context = canvas.getContext("2d")
			context.fillStyle = "black"

			socket = io()
			socket.on('time', function (data) {
				// current time server side (without counting latency)
				timeStart = data - performance.now()
				// start
				gameLoop()
			})
			socket.on('state', function (_state) {
				// complete state update
				state = _state
			})
			socket.on('patch', function (patch) {
				// granular state update
				jsonpatch.applyPatch(state, patch)
			})

			canvas.addEventListener("click", function (e) {
				var observer = jsonpatch.observe(state)
				state.units["0"].direction += Math.PI / 10
				var patch = jsonpatch.generate(observer)
				socket.emit('patch', patch)
			})
		}

		function getPositionAtTime(position, velocity, direction, time) {
		  return [
		    position[0] + velocity * Math.cos(direction) * time,
		    position[1] + velocity * Math.sin(direction) * time
		  ]
		}


		function gameLoop() {
			// clear canvas
			context.clearRect(0, 0, canvas.width, canvas.height)

			var time = performance.now() + timeStart

			// loop through elements
			for (var unit in state.units) {
				var unit = state.units[unit]
				var pos = getPositionAtTime(
					unit.commands[0].positionStart,
					unit.velocity,
					unit.direction,
					time - unit.commands[0].time
				)
				drawUnit(pos[0], pos[1])
			}

			requestAnimationFrame(gameLoop)
		}

		function drawUnit(x, y) {
			// context.fillRect(Math.floor(canvas.width / 2 + x), Math.floor(canvas.height / 2 + y), 10, 10)

			context.beginPath();
			context.arc(canvas.width / 2 + x, canvas.height / 2 + y, 5, 0, 2 * Math.PI, false);
			context.fillStyle = 'white';
			context.fill();
		}

		setup()
}

window.addEventListener('load', Main)
