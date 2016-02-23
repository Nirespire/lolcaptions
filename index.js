/* jshint node:true */

var express = require('express');
var logger = require('morgan');
var expressStatic = require('express-static');
var path = require('path');

var app = express();

var server = app.listen(process.env.PORT || 8080, function(){
	console.log('server is running at %s', server.address().port);
});

var io = require('socket.io').listen(server);
var _ = require('underscore');
var fs = require('fs');
var https = require('https');
var lol = require('./lolcaptions');

var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
    app.use(logger('dev'));
    app.use(expressStatic(__dirname + '/client'));
}

// Initialize the global game state
lol.initGame(io);

// Listen for Socket.IO Connections.
io.on('connection', function (socket) {
    //console.log('client connected');
	// Bind event handling for that socket
    lol.initSocket(socket);
});
