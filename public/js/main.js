import * as THREE from '/js/three.module.min.js';

function Main() {
	var state = {},
			scene,
			camera,
			renderer,
			socket,
			timeStart = 0, // ms - reset from server
			unitMeshes = {} // store mesh references for each unit

	function setup() {
		// Create scene
		scene = new THREE.Scene()
		scene.background = new THREE.Color(0x000000)

		// Create camera
		camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		)
		camera.position.z = 500
		camera.position.y = 200

		// Create renderer
		renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setSize(window.innerWidth, window.innerHeight)
		document.body.appendChild(renderer.domElement)

		// Add lights
		const ambientLight = new THREE.AmbientLight(0x404040, 1)
		scene.add(ambientLight)

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
		directionalLight.position.set(5, 10, 7.5)
		scene.add(directionalLight)

		// Add a grid helper for reference
		const gridHelper = new THREE.GridHelper(1000, 20, 0x444444, 0x222222)
		scene.add(gridHelper)

		// Handle window resize
		window.addEventListener('resize', function() {
			camera.aspect = window.innerWidth / window.innerHeight
			camera.updateProjectionMatrix()
			renderer.setSize(window.innerWidth, window.innerHeight)
		})

		// Socket.io setup
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
			// Create meshes for any new units
			updateUnitMeshes()
		})
		socket.on('patch', function (patch) {
			// granular state update
			jsonpatch.applyPatch(state, patch)
		})

		// Click to change direction
		renderer.domElement.addEventListener("click", function (e) {
			var observer = jsonpatch.observe(state)
			state.units["0"].direction += Math.PI / 10
			var patch = jsonpatch.generate(observer)
			socket.emit('patch', patch)
		})
	}

	function updateUnitMeshes() {
		// Create meshes for units that don't have them
		for (var unitId in state.units) {
			if (!unitMeshes[unitId]) {
				// Create sphere geometry for the unit
				const geometry = new THREE.SphereGeometry(10, 32, 32)
				const material = new THREE.MeshPhongMaterial({
					color: 0xffffff,
					emissive: 0x333333,
					shininess: 30
				})
				const sphere = new THREE.Mesh(geometry, material)
				scene.add(sphere)
				unitMeshes[unitId] = sphere
			}
		}

		// Remove meshes for units that no longer exist
		for (var meshId in unitMeshes) {
			if (!state.units[meshId]) {
				scene.remove(unitMeshes[meshId])
				delete unitMeshes[meshId]
			}
		}
	}

	function getPositionAtTime(position, velocity, direction, time) {
		return [
			position[0] + velocity * Math.cos(direction) * time,
			position[1] + velocity * Math.sin(direction) * time
		]
	}

	function gameLoop() {
		var time = performance.now() + timeStart

		// Update unit positions
		for (var unitId in state.units) {
			var unit = state.units[unitId]
			var pos = getPositionAtTime(
				unit.commands[0].positionStart,
				unit.velocity,
				unit.direction,
				time - unit.commands[0].time
			)

			// Update mesh position if it exists
			if (unitMeshes[unitId]) {
				unitMeshes[unitId].position.x = pos[0]
				unitMeshes[unitId].position.z = pos[1] // Use z for the second coordinate in 3D
				unitMeshes[unitId].position.y = 0 // Keep at ground level
			}
		}

		renderer.render(scene, camera)
		requestAnimationFrame(gameLoop)
	}

	setup()
}

window.addEventListener('load', Main)
