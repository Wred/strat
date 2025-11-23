var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var game = require('./lib/main.js')(io);

// Set correct MIME type for JavaScript modules
app.use(express.static('public', {
  setHeaders: function(res, path) {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}))

const PORT = process.env.PORT || 3000;
http.listen(PORT, function(){
  console.log('listening on *:' + PORT);
});
