var io;
var fs = require('fs');
var logger = require('morgan');
var rest = require('restler');

var numUsers = 0;
var userSockets = [];
var gameInterval;

var GAME_STATES = {
    WAIT : "WAIT",
    LOAD_IMAGES : "LOAD IMAGES",
    VOTE_IMAGES : "VOTE IMAGES",
    SUBMIT_CAPTIONS : "SUBMIT CAPTIONS",
    VOTE_CAPTIONS : "VOTE CAPTIONS",
    DISPLAY_WINNER : "DISPLAY WINNER"
};

var GAME_STATE = GAME_STATES.WAIT;

var NUM_RANDOM_IMAGES = 5;
var API_KEY;

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 */
exports.initGame = function(sio) {
    io = sio;
    var gameInterval = setInterval(gameStep, 1000);
    API_KEY = JSON.parse(fs.readFileSync('auth.json', 'utf8')).IMGUR_API_KEY;
};

exports.initSocket = function(gameSocket){
    gameSocket.emit('connected');

    var clientSocketId = gameSocket.id.substring(2);
    userSockets[clientSocketId] = {};
    userSockets[clientSocketId].socket = gameSocket;
    userSockets[clientSocketId].username = "Anonymous User";

    bindEvents(gameSocket);
}

function gameStep() {
    //console.log(GAME_STATE);
    switch(GAME_STATE){
        case GAME_STATES.WAIT :
            if(numUsers < 2){
                GAME_STATE = GAME_STATES.WAIT;
            }
            else{
                GAME_STATE = GAME_STATES.LOAD_IMAGES;
            }
            break;
        case GAME_STATES.LOAD_IMAGES :
            loadRandomImages()
                .on('complete', function(data, response) {
                    if(response.statusCode != 200){
                        console.error("Failed to get random images");
                    }
                    console.log(data);
                    io.emit('images', data.data);
                    GAME_STATE = GAME_STATES.VOTE_IMAGES;
                });
            break;
        case GAME_STATES.VOTE_IMAGES :
            if(numUsers < 2){
                GAME_STATE = GAME_STATES.WAIT;
            }
            break;
    }
}

// gameSocket = SocketIO socket
function bindEvents(gameSocket){
    gameSocket.on('login', login);
    gameSocket.on('newMessage', newMessage);
    gameSocket.on('disconnect', disconnect);
    gameSocket.on('gameState', gameState);
}

// data = {socketId, username}
function login(data) {
    userSockets[data.socketId].username = data.username;
    numUsers++;
    io.emit('numUsers', numUsers);
}

// data = {username, content}
function newMessage(data) {
    console.log(data);
    io.emit('newMessage', {
        username: data.username,
        content: data.content
    });
}

// data = {username, socketId}
function disconnect(data) {
    delete userSockets[data.socketId];
    if (numUsers > 0) {
        numUsers--;
    }
    io.emit('numUsers', numUsers);
    console.log("User disconnected");
}

var gameState = function(){
    console.log(GAME_STATE);
    io.emit('gameState', GAME_STATE);
}


/* *************************
 *                       *
 *      GAME LOGIC       *
 *                       *
 ************************* */

function loadRandomImages() {

    var options = {
        headers: {
            "Accept":"application/json",
            "Authorization":"Client-ID " + API_KEY
        }
    }

    return rest.get('https://api.imgur.com/3/gallery/random/random/', options);


}


/**********************
*   UTILITY FUNCTIONS
***********************/
