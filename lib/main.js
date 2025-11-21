var jsonpatch = require('fast-json-patch')

module.exports = Main

function Main(io) {

  function getTime() {
    var timeTupple = process.hrtime(state.startTime)
    return timeTupple[0] * 1e3 + timeTupple[1] / 1e6
  }

  function getPositionAtTime(position, velocity, direction, time) {
    return [
      position[0] + velocity * Math.cos(direction) * time,
      position[1] + velocity * Math.sin(direction) * time
    ]
  }

  var tickCount = 0,
      turnEvery = 2000 // ms

  var state = {
    startTime: process.hrtime(),
    players: {
        "0": {

        }
    },
    units: {
      "0": {
        owner: "0",
        velocity: 0.1,
        direction: 0, // rads
        commands: [
          {
            type: "MOVE",
            time: 0,
            positionStart: [0,0],
            positionTarget: [0,0]
          }
        ]
      }
    }
  }

  // event stream (for playback etc)
  var events = []
  function addEvent(time, patch) {
    // console.log(time, patch)
    events.push({time: time, patch:patch})
  }

  io.on('connection', function connection(socket) {
    // send current time to client to sync up
    socket.emit('time', getTime())
    // send current game state
    socket.emit('state', state)
    // console.log(io.sockets.connected)

    socket.on('disconnect', function(){
      // to do
    })

    socket.on('patch', function (patch) {
      // user sent a command
      var time = getTime()
      jsonpatch.applyPatch(state, patch)
      addEvent(time, patch)
      io.emit('patch', patch)
    })
  })

  function gameLoop() {
    var time = getTime()
    if (time - state.units["0"].commands[0].time > turnEvery) {
      var observer = jsonpatch.observe(state)
      state.units["0"].commands[0].positionStart = getPositionAtTime(
        state.units["0"].commands[0].positionStart,
        state.units["0"].velocity,
        state.units["0"].direction,
        time - state.units["0"].commands[0].time)
      // change direction and take a new timestamp
      state.units["0"].direction += Math.PI / 2
      state.units["0"].commands[0].time = time
      var patch = jsonpatch.generate(observer)
      addEvent(time, patch)
      io.emit('patch', patch)
    }
    setImmediate(gameLoop)
  }


  // start
  gameLoop()

}
