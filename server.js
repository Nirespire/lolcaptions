/* jshint node:true */

var cloak = require('cloak');
var _ = require('underscore');
var connect = require('connect');
//var $ = require('jQuery');
var fs = require('fs');
var https = require('https');


var clientPort = 8080;
var serverPort = 8090;

var NUM_RANDOM_IMAGES = 5;

var API_KEY = JSON.parse(fs.readFileSync('client/js/auth.json', 'utf8')).IMGUR_API_KEY;

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

var loadRandomImages = function (API_KEY) {
    var options = {
        hostname: 'api.imgur.com',
        path: '/3/gallery/random/random/1',
        method: 'GET',
        headers: {
            'Authorization': "Client-ID " + API_KEY
        }
    };
    
    var req = https.request(options, function (res) {
        console.log("retrieving random images...");
        console.log('STATUS: ' + res.statusCode);
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        
        res.on('end', function(){
            console.log(
                _.map(
                    _.first(JSON.parse(body).data, NUM_RANDOM_IMAGES),
                    function(item){
                        return _.pick(item,'link');
                    }
                )
            );
        });
    });
    
    req.end();
}

loadRandomImages(API_KEY);