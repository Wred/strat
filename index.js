var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var jsonpatch = require('fast-json-patch');

app.use(express.static('public'))

http.listen(80, function(){
  console.log('listening on *:80');
});

io.on('connection', function(socket){
  // send current time to client to sync up
  socket.emit('time', getTime());
  // send current game state
  socket.emit('state', state);
  // console.log(io.sockets.connected);

  socket.on('disconnect', function(){
    // to do
  });

  socket.on('patch', function (patch) {
    // user sent a command
    var time = getTime();
    jsonpatch.apply(state, patch);
    addEvent(time, patch);
    io.emit('patch', patch);
  });
});

function getTime() {
  var timeTupple = process.hrtime(state.startTime);
  return timeTupple[0] * 1e3 + timeTupple[1] / 1e6;
}

function getPositionAtTime(moveCommand, time) {
  return [
    moveCommand.position[0] + moveCommand.velocity * Math.cos(moveCommand.direction) * time,
    moveCommand.position[1] + moveCommand.velocity * Math.sin(moveCommand.direction) * time
  ];
}

var tickCount = 0,
    turnEvery = 2000; // ms

var state = {
  startTime: process.hrtime(),
  units: {
    "0": {
      moveCommand: {
        direction: 0, // rads
        velocity: 0.1,
        position: [0,0],
        time: 0
      }
    } // this should be uuencoded
  }
};

// event stream (for playback etc)
var events = [];
function addEvent(time, patch) {
  console.log(time, patch);
  events.push({time: time, patch:patch});
}


function gameLoop() {
  var time = getTime();
  if (time - state.units["0"].moveCommand.time > turnEvery) {
    var observer = jsonpatch.observe(state);
    state.units["0"].moveCommand.position = getPositionAtTime(state.units["0"].moveCommand, time - state.units["0"].moveCommand.time);
    // change direction and take a new timestamp
    state.units["0"].moveCommand.direction += Math.PI / 2;
    state.units["0"].moveCommand.time = time;
    var patch = jsonpatch.generate(observer);
    addEvent(time, patch);
    io.emit('patch', patch);
  }
  setImmediate(gameLoop);
}
// start
gameLoop();
