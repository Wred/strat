var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var game = require('./lib/main.js')(io);

app.use(express.static('public'))

http.listen(80, function(){
  console.log('listening on *:80');
});
