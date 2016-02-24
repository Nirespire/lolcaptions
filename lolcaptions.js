var io;
var fs = require('fs');
var logger = require('morgan');
var rest = require('restler');
var _ = require('underscore');

var numUsers = 0;
var userSockets = [];
var gameInterval;

var voteTimer = 0;

var GAME_STATES = {
    WAIT: "WAIT",
    LOAD_IMAGES: "LOAD IMAGES",
    VOTE_IMAGES: "VOTE IMAGES",
    SUBMIT_CAPTIONS: "SUBMIT CAPTIONS",
    VOTE_CAPTIONS: "VOTE CAPTIONS",
    DISPLAY_WINNER: "DISPLAY WINNER"
};

var GAME_STATE = GAME_STATES.WAIT;
var PREV_GAME_STATE = null;

var NUM_RANDOM_IMAGES = 9;
var IMAGE_VOTE_DURATION = 30;
var CAPTION_DURATION = 30;
var CAPTION_VOTE_DURATION = 30;
var DISPLAY_WINNER_DURATION = 10;
var API_KEY;

var currentImageSet = [];

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 */
exports.initGame = function(sio) {
    io = sio;
    var gameInterval = setInterval(gameStep, 1000);
    API_KEY = process.env.IMGUR_API_KEY;
};

exports.initSocket = function(gameSocket) {
    gameSocket.emit('connected');

    switch (GAME_STATE) {
        case GAME_STATES.WAIT:
            break;
        case GAME_STATES.LOAD_IMAGES:
            break;
        case GAME_STATES.VOTE_IMAGES:
            gameSocket.emit('images', currentImageSet);
            break;
    }

    var clientSocketId = gameSocket.id.substring(2);
    userSockets[clientSocketId] = {};
    userSockets[clientSocketId].socket = gameSocket;
    userSockets[clientSocketId].username = "Anonymous User";

    bindEvents(gameSocket);
}

function gameStep() {
    //console.log(GAME_STATE);
    switch (GAME_STATE) {
        case GAME_STATES.WAIT:
            if (numUsers < 2) {
                GAME_STATE = GAME_STATES.WAIT;
                break;
            }

            GAME_STATE = GAME_STATES.LOAD_IMAGES;

            break;
        case GAME_STATES.LOAD_IMAGES:
            loadRandomImages()
                .on('complete', function(data, response) {
                    if (response.statusCode != 200) {
                        console.error("Failed to get random images");
                        GAME_STATE = GAME_STATES.WAIT;
                    }

                    currentImageSet = parseImageResults(data.data);
                    console.log(currentImageSet);
                    io.emit('images', currentImageSet);
                    GAME_STATE = GAME_STATES.VOTE_IMAGES;
                });
            break;
        case GAME_STATES.VOTE_IMAGES:
            if (numUsers < 2) {
                GAME_STATE = GAME_STATES.WAIT;
                voteTimer = 0;
            }

            io.emit('updateTimer', IMAGE_VOTE_DURATION - voteTimer++);

            if (voteTimer > IMAGE_VOTE_DURATION) {
                GAME_STATE = GAME_STATES.SUBMIT_CAPTIONS;
                voteTimer = 0;
            }
            break;

        case GAME_STATES.SUBMIT_CAPTIONS:
            if (numUsers < 2) {
                GAME_STATE = GAME_STATES.WAIT;
                voteTimer = 0;
            }

            io.emit('updateTimer', CAPTION_DURATION - voteTimer++);

            if (voteTimer > CAPTION_DURATION) {
                GAME_STATE = GAME_STATES.VOTE_CAPTIONS;
                voteTimer = 0;
            }
            break;

        case GAME_STATES.VOTE_CAPTIONS:
            if (numUsers < 2) {
                GAME_STATE = GAME_STATES.WAIT;
                voteTimer = 0;
            }

            io.emit('updateTimer', CAPTION_VOTE_DURATION - voteTimer++);

            if (voteTimer > CAPTION_VOTE_DURATION) {
                GAME_STATE = GAME_STATES.DISPLAY_WINNER;
                voteTimer = 0;
            }
            break;

        case GAME_STATES.DISPLAY_WINNER:

            io.emit('updateTimer', DISPLAY_WINNER_DURATION - voteTimer++);

            if (voteTimer > DISPLAY_WINNER_DURATION) {
                GAME_STATE = GAME_STATES.WAIT;

                voteTimer = 0;
            }
            break;
    }

    if (PREV_GAME_STATE !== GAME_STATE) {
        io.emit("gameState", GAME_STATE);
    }

    PREV_GAME_STATE = GAME_STATE;
}

// gameSocket = SocketIO socket
function bindEvents(gameSocket) {
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

var gameState = function() {
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
            "Accept": "application/json",
            "Authorization": "Client-ID " + API_KEY
        }
    }

    return rest.get('https://api.imgur.com/3/gallery/random/random/', options);
}

function parseImageResults(imageJSON) {
    var output = [];
    for (i in imageJSON) {
        var current = imageJSON[i];
        var imageRatio = current.height / current.width;

        if (current.nsfw === false && current.is_album === false && (imageRatio && imageRatio < 2 && imageRatio > 0.5) && current.animated === false) {

            output.push(imageJSON[i].link);
        }
    }
    return _.sample(output, NUM_RANDOM_IMAGES);
}


/**********************
 *   UTILITY FUNCTIONS
 ***********************/
