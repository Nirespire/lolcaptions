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


// Listen for Socket.IO Connections. Once connected, start the game logic.
io.on('connection', function (socket) {
    //console.log('client connected');
    lol.initGame(io, socket);
});
