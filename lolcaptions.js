var io;
var gameSocket;
var fs = require('fs');
var logger = require('morgan');

var numUsers = 0;

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    gameSocket.on('newMessage', newMessage);

}

function newMessage(data) {
    console.log(data);
    gameSocket.broadcast.emit('newMessage', {
      username: data.username,
      content: data.content
    });
}




/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */

var NUM_RANDOM_IMAGES = 5;
var API_KEY = JSON.parse(fs.readFileSync('client/js/auth.json', 'utf8')).IMGUR_API_KEY;
var loadRandomImages = function (API_KEY) {
   var result;

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
           result =
               _.map(
                   _.first(JSON.parse(body).data, NUM_RANDOM_IMAGES),
                   function(item){
                       return _.pick(item,'link');
                   }
               );

           console.log(result);

       });
   });
   return result;

   req.end();
}
