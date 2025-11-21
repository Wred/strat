var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var game = require('./lib/main.js')(io);

app.use(express.static('public'))

const PORT = process.env.PORT || 3000;
http.listen(PORT, function(){
  console.log('listening on *:' + PORT);
});
