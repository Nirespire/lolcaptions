"use strict"

var io;
var fs = require('fs');
var logger = require('morgan');
var rest = require('restler');
var _ = require('underscore');

var numUsers = 0;
var userSockets = [];
var userVotes = [];
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
var API_KEY;

var NUM_RANDOM_IMAGES = 9;
var IMAGE_VOTE_DURATION = 15;
var CAPTION_DURATION = 15;
var CAPTION_VOTE_DURATION = 15;
var DISPLAY_WINNER_DURATION = 7;


if ((process.env.NODE_ENV || 'development') === "development") {
    NUM_RANDOM_IMAGES = 9;
    IMAGE_VOTE_DURATION = 10;
    CAPTION_DURATION = 10;
    CAPTION_VOTE_DURATION = 10;
    DISPLAY_WINNER_DURATION = 7;
}

var currentImageSet = [];
var currentImageIdx = -1;

var currentCaptionSet = [];
var winningCaptionIdx = -1;
var votes = [];

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 */
exports.initGame = function(sio) {
    io = sio;
    var gameInterval = setInterval(gameStep, 1000);
    API_KEY = process.env.API_KEY;
};

exports.initSocket = function(gameSocket) {
    gameSocket.emit('connected');

    // Send initial info if a round is in progress
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
    userSockets[clientSocketId].socketId = clientSocketId;
    userSockets[clientSocketId].username = "Anonymous User";
    userSockets[clientSocketId].score = 0;

    userVotes[clientSocketId] = {};
    userVotes[clientSocketId].imageVote = -1;
    userVotes[clientSocketId].caption = '';
    userVotes[clientSocketId].captionVote = -1;

    bindEvents(gameSocket);
}

function gameStep() {
    //console.log(GAME_STATE);

    switch (GAME_STATE) {
        case GAME_STATES.WAIT:
            resetUserVotes();
            if (numUsers < 2) {
                GAME_STATE = GAME_STATES.WAIT;
                break;
            }

            GAME_STATE = GAME_STATES.LOAD_IMAGES;

            break;
        case GAME_STATES.LOAD_IMAGES:
            currentImageSet = [];
            loadRandomImages()
                .on('complete', function(data, response) {
                    if (response.statusCode != 200) {
                        console.error(response.statusCode, "Failed to get random images");
                        //GAME_STATE = GAME_STATES.WAIT;
                    }

                    currentImageSet = parseImageResults(data.data);

                    // TODO DEBUG
                    if(currentImageSet.length == 0){
                        for(var i = 0; i < 9; i++){
                            currentImageSet.push("http://i.imgur.com/2xxvBoV.jpg");
                        }
                    }

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
                currentImageIdx = -1;
                countImageVotes();
                io.emit('currentImage', currentImageSet[currentImageIdx]);
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
                currentCaptionSet = [];
                for(var i in userVotes){
                    currentCaptionSet.push({socketId: _.pick(userSockets[i], 'socketId').socketId, caption: _.pick(userVotes[i], 'caption').caption});
                }
                io.emit('captions', currentCaptionSet);
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
                winningCaptionIdx = -1;
                countCaptionVotes();
                io.emit('winningCaption', {socketId: currentCaptionSet[winningCaptionIdx].socketId, caption:currentCaptionSet[winningCaptionIdx].caption, points:votes[winningCaptionIdx]});
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
    // User anonymous function for disconnect to keep gameSocket in scope
    gameSocket.on('disconnect', function() {
        var socketId = gameSocket.id.substring(2);
        var username = userSockets[socketId].username;

        console.log(socketId, username);

        if (numUsers > 0) {
            numUsers--;
        }

        io.emit('userDisconnected', {numUsers: numUsers, username: username, socketId: socketId});

        delete userSockets[gameSocket.id.substring(2)];
        delete userVotes[gameSocket.id.substring(2)];
    });
    gameSocket.on('gameState', gameState);
    gameSocket.on('voteImage', voteImage);
    gameSocket.on('submitCaption', submitCaption);
    gameSocket.on('voteCaption', voteCaption);
}

// data = {socketId, username}
function login(data) {
    userSockets[data.socketId].username = data.username;
    numUsers++;
    io.emit('newUser', {numUsers: numUsers, username: data.username, socketId: data.socketId});
}

// data = {username, socketId}


// data = {username, content}
function newMessage(data) {
    console.log(data);
    io.emit('newMessage', {
        username: data.username,
        content: data.content
    });
}

var gameState = function() {
    console.log(GAME_STATE);
    io.emit('gameState', GAME_STATE);
}

// data = {socketId, content(image id)}
var voteImage = function(data) {
    userVotes[data.socketId].imageVote = parseInt(data.content);
    console.log(userVotes);
}

// data = {socketId, caption}
var submitCaption = function(data) {
    userVotes[data.socketId].caption = data.caption;
    console.log(userVotes);
}

// data = {socketId, content(caption id)}
var voteCaption = function(data) {
    userVotes[data.socketId].captionVote = parseInt(data.content);
    console.log(userVotes);
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


/**********************
 *   UTILITY FUNCTIONS
 ***********************/

function parseImageResults(imageJSON) {
    var output = [];
    for (var i in imageJSON) {
        var current = imageJSON[i];
        var imageRatio = current.height / current.width;

        if (current.nsfw === false && current.is_album === false && (imageRatio && imageRatio < 2 && imageRatio > 0.5) && current.animated === false) {

            output.push(imageJSON[i].link);
        }
    }
    return _.sample(output, NUM_RANDOM_IMAGES);
}

function countImageVotes() {
    votes = [];
    for (var i = 0; i < NUM_RANDOM_IMAGES; i++) {
        votes[i] = 0;
    }

    for (var i in userVotes) {
        var currentVote = userVotes[i].imageVote;

        if (currentVote !== -1) {
            votes[userVotes[i].imageVote]++;
        }
    }

    // Index in currentImageSet of winner
    var winner = votes.indexOf(Math.max.apply(Math, votes));

    console.log(winner);

    currentImageIdx = winner;
}

function countCaptionVotes() {
    var votes = [];
    for (var i = 0; i < currentCaptionSet.length; i++) {
        votes[i] = 0;
    }

    for (var i in userVotes) {
        var currentVote = userVotes[i].captionVote;

        if (currentVote !== -1) {
            votes[userVotes[i].captionVote]++;
        }
    }

    // Index in userSockets / userVotes of winner
    var winner = votes.indexOf(Math.max.apply(Math, votes));

    console.log(winner);
    console.log(votes);

    winningCaptionIdx = winner;
}

function resetUserVotes(){
    for(var i in userVotes){
        userVotes[i].imageVote = -1;
        userVotes[i].caption = '';
        userVotes[i].captionVote = -1;
    }
}
