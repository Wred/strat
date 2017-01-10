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
  socket.emit('time', getTime());
  socket.emit('state', state);
  // console.log(io.sockets.connected);

  socket.on('disconnect', function(){
    // to do
  });
});

function getTime() {
  var timeTupple = process.hrtime(startTime);
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

var startTime = process.hrtime();
var state = {
  units: {
    "0": {
      moveCommand: {
        direction: 0, // rads
        velocity: 0.1,
        position: [0,0],
        timeStamp: 0
      }
    } // this should be uuencoded
  }
};

function gameLoop() {
  var timeStamp = getTime();
  if (timeStamp - state.units["0"].moveCommand.timeStamp > turnEvery) {
    var observer = jsonpatch.observe(state);
    state.units["0"].moveCommand.position = getPositionAtTime(state.units["0"].moveCommand, timeStamp - state.units["0"].moveCommand.timeStamp);
    // change direction and take a new timestamp
    state.units["0"].moveCommand.direction += Math.PI / 2;
    state.units["0"].moveCommand.timeStamp = timeStamp;
    io.emit('patch', jsonpatch.generate(observer));
  }
  setImmediate(gameLoop);
}
// start
gameLoop();
