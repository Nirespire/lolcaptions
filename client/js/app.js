jQuery(function($) {
    'use strict';

    var chatInput = $('#input-box');
    var messages = $('#chat-messages');

    var MAX_NUM_CHAT_MESSAGES = 25;

    var GAME_STATES = {
        WAIT: "WAIT",
        LOAD_IMAGES: "LOAD IMAGES",
        VOTE_IMAGES: "VOTE IMAGES",
        SUBMIT_CAPTIONS: "SUBMIT CAPTIONS",
        VOTE_CAPTIONS: "VOTE CAPTIONS",
        DISPLAY_WINNER: "DISPLAY WINNER"
    };

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     * @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, onNewWordData: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
     */
    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io();
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents: function() {
            IO.socket.on('connected', IO.onConnected);
            IO.socket.on('newMessage', IO.newMessage);
            IO.socket.on('numUsers', IO.numUsers);
            IO.socket.on('gameState', IO.gameState);
            IO.socket.on('images', IO.images);
            IO.socket.on('updateTimer', IO.updateTimer);
        },

        /**
         * The client is successfully connected!
         */
        onConnected: function(data) {
            // Cache a copy of the client's socket.IO session ID on the App
            App.socketId = IO.socket.id;
            App.username = IO.socket.id;
            console.log(App.socketId);
        },

        // data.username
        // data.content
        newMessage: function(data) {
            console.log(data);
            App.createChatMessage(data.username, App.cleanInput(data.content));
        },

        numUsers: function(numUsers) {
            $('#counter').text(numUsers);
        },

        gameState: function(gameState) {
            console.log("GAME_STATE " + gameState);
            App.setGameState(gameState);
        },

        images: function(images) {
            console.log("Got " + images.length + " Images")
            console.log(images);
            App.currentImageSet = images;

            App.clearVoteImages();
            App.populateVoteImages();
        },

        updateTimer: function(time) {
            $('#seconds').text(time);
        }

    };

    var App = {

        /* *************************************
         *                CONSTANTS            *
         * *********************************** */

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        socketId: '',
        username: '',
        GAME_STATE: null,
        currentImageSet: [],

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function() {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            IO.socket.emit('gameState');

            //FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function() {
            App.$doc = $(document);

            // Templates
            App.$mainContainer = $('#mainContainer');
            App.$gameArea = $('#gameArea');
            App.$loginScreenTemplate = $('#loginTemplate');
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function() {
            //App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            App.$doc.on('submit', '#chat-input', App.sendMessage);

            $("#loginForm").on('click', '#loginOk', App.setUserName);
        },

        /**
         * Show the initial Login Screen
         */

        showInitScreen: function() {
            console.log("show init");

            App.$loginScreenTemplate.dialog({
                modal: 'true',
                resizable: false,
                closeOnEscape: false,
                width: 410
            });
            $(".ui-dialog-titlebar").hide();
        },
        setUserName: function() {
            var value = $('#usernameInput').val();

            if (value.trim()) {
                App.username = value;
            }

            $(this).closest("#loginTemplate").dialog('close');
            // Register with the server
            IO.socket.emit('login', {
                socketId: App.socketId,
                username: App.username
            });
            return false;
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        setGameState(gs) {
            switch (gs) {
                case GAME_STATES.WAIT:
                    $('#winner').fadeOut();
                    $('#loadTitle').fadeOut();
                    $('#voteImages').fadeOut();
                    $('#captionImage').fadeOut();
                    $('#voteCaptions').fadeOut();
                    $('#timer').fadeOut();

                    $('#waitTitle').fadeIn();
                    break;
                case GAME_STATES.LOAD_IMAGES:
                    $('#waitTitle').fadeOut(function(){$('#loadTitle').fadeIn();});
                    break;
                case GAME_STATES.VOTE_IMAGES:
                    $('#loadTitle').fadeOut(function(){$('#voteImages').fadeIn();$('#timer').fadeIn();});
                    break;
                case GAME_STATES.SUBMIT_CAPTIONS:
                    $('#voteImages').fadeOut(function(){$('#captionImage').fadeIn();});
                    break;
                case GAME_STATES.VOTE_CAPTIONS:
                    $('#captionImage').fadeOut(function(){$('#voteCaptions').fadeIn();});
                    break;
                case GAME_STATES.DISPLAY_WINNER:
                    $('#voteCaptions').fadeOut(function(){$('#winner').fadeIn();$('#timer').fadeOut();});
                    break;
            }

            this.GAME_STATE = gs;
        },

        populateVoteImages: function() {
            for (var i in App.currentImageSet) {
                $("#img" + i).attr('src', App.currentImageSet[i]);
            }
        },

        clearVoteImages: function() {
            for (var i in App.currentImageSet) {
                $("#img" + i).attr('src', "");
            }
        },



        /* *******************************
         *         PLAYER CODE           *
         ******************************* */

        sendMessage: function() {
            var content = chatInput.val();
            if (content.length > 0) {
                IO.socket.emit('newMessage', {
                    //username: myUsername,
                    username: App.username,
                    content: content
                });
            }
            chatInput.val('');
            return false;
        },


        /* **************************
                  UTILITY CODE
           ************************** */

        //    <ul id="chat-messages" class="list-group">
        //        <li class="list-group-item">
        //            <small class="pull-right text-muted">10.12.2014 in 12:56</small>
        //            <div>
        //                <small class="list-group-item-heading text-muted text-primary">User1</small>
        //                <p class="list-group-item-text">
        //                    Hi! this message is FOR you.
        //                </p>
        //            </div>
        //        </li>
        //    </ul>
        createChatMessage: function(username, content) {

            var $userIcon = $('<i class="fa fa-user"> </i>');
            var $messageContent = $('<p class="list-group-item-text">')
                .text(content);
            var $messageInfo = $('<small class="list-group-item-heading text-muted text-primary">')
                .text(username);

            var $message = $('<div>')
                .append($userIcon, $messageInfo, $messageContent);

            var $timestamp = $('<small class="pull-right text-muted">')
                .text(App.timestamp());

            var $item = $('<li class="list-group-item">')
                .append($timestamp, $message);

            App.addMessageElement($item);
        },

        addMessageElement: function(el) {
            var $el = $(el);
            messages.append($el);
            console.log(messages.children());
            if (messages.children().length > MAX_NUM_CHAT_MESSAGES) {
                messages.children(":first").remove();
            }
            messages.scrollTop(messages[0].scrollHeight);
        },

        cleanInput: function(input) {
            return $('<div/>').text(input).text();
        },

        timestamp: function() {
            // Create a date object with the current time
            var now = new Date();

            // Create an array with the current month, day and time
            var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];

            // Create an array with the current hour, minute and second
            var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

            // Determine AM or PM suffix based on the hour
            var suffix = (time[0] < 12) ? "AM" : "PM";

            // Convert hour from military time
            time[0] = (time[0] < 12) ? time[0] : time[0] - 12;

            // If hour is 0, set it to 12
            time[0] = time[0] || 12;

            // If seconds and minutes are less than 10, add a zero
            for (var i = 1; i < 3; i++) {
                if (time[i] < 10) {
                    time[i] = "0" + time[i];
                }
            }

            // Return the formatted string
            return date.join("/") + " " + time.join(":") + " " + suffix;
        }

    };

    IO.init();
    App.init();

}($));
