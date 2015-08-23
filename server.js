/* jshint node:true */

var cloak = require('cloak');
var _ = require('underscore');
var connect = require('connect');
//var $ = require('jQuery');
var fs = require('fs');

var clientPort = 8080;
var serverPort = 8090;

var API_KEY;

fs.readFile('client/js/auth.json', 'utf8', function (err, data) {
    if (err) {
        throw err;
    }
    API_KEY = JSON.parse(data).IMGUR_API_KEY;
});

var userJoins = function (arg) {
    this.messageMembers('userCount', this.getMembers().length);
    _.last(this.getMembers()).name = "User" + this.getMembers().length;
}

var userLeaves = function (arg) {
    this.messageMembers('userCount', this.getMembers().length);
}

cloak.configure({
    port: serverPort,
    messages: {
        chat: function (msg, user) {
            user.getRoom().messageMembers('chat', {
                user: user.name,
                msg: msg
            });
        }
    },
    lobby: {
        newMember: userJoins,
        memberLeaves: userLeaves
    }
});

cloak.run();

connect()
    .use(connect.static('./client'))
    .listen(clientPort);

console.log('client running on on ' + clientPort);