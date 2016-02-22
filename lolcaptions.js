var io;
var gameSocket;
var fs = require('fs');
var logger = require('morgan');
var rest = require('restler');

var numUsers = 0;
var users = [];
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
var API_KEY = JSON.parse(fs.readFileSync('auth.json', 'utf8')).IMGUR_API_KEY;

var gameInterval = setInterval(gameStep, 1000);

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket) {
    io = sio;
    gameSocket = socket;
    io.emit('connected');

    // Host Events
    bindEvents();
};

function gameStep() {
    console.log(GAME_STATE);
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

function bindEvents(){
    gameSocket.on('login', login);
    gameSocket.on('newMessage', newMessage);
    gameSocket.on('disconnect', disconnect);
    gameSocket.on('gameState', gameState);
}

function login(data) {
    users[data.socketId] = data;
    numUsers++;
    io.emit('numUsers', numUsers);
}

function newMessage(data) {
    console.log(data);
    io.emit('newMessage', {
        username: data.username,
        content: data.content
    });
}

function disconnect(data) {
    delete users[data.socketId];
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
