var express = require('express');
var logger = require('morgan');
var path = require('path');

var app = express();
var PORT = process.env.PORT || 8080;
var env = process.env.NODE_ENV || 'development';

process.env.PWD = process.cwd();


var server = app.listen(PORT, function(){
	console.log('server is running at %s', server.address().port);
});

var io = require('socket.io').listen(server);
var _ = require('underscore');
var fs = require('fs');
var https = require('https');
var lol = require('./lolcaptions');

if (env === "development") {
    app.use(logger('dev'));
	require('dotenv').config();
}

app.use(express.static(process.env.PWD + '/client'));


// Initialize the global game state
lol.initGame(io);

// Listen for Socket.IO Connections.
io.on('connection', function (socket) {
    //console.log('client connected');
	// Bind event handling for that socket
    lol.initSocket(socket);
});
