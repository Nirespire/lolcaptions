jQuery(function($) {
    'use strict';

    var chatInput = $('#input-box');
    var messages = $('#chat-messages');

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
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newMessage', IO.newMessage);
        },

        /**
         * The client is successfully connected!
         */
        onConnected: function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.id;
            console.log(App.mySocketId);
            // console.log(data.message);
        },

        // data.username
        // data.content
        newMessage: function(data) {
            console.log(data);
            App.createChatMessage(data.username, App.cleanInput(data.content));
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
        mySocketId: '',
        myUsername: '',

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

            //FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function() {
            App.$doc = $(document);

            // Templates
            //App.$gameArea = $('#gameArea');
            //App.$templateIntroScreen = $('#intro-screen-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function() {
            //App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            App.$doc.on('click', '#btnSend', App.sendMessage);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Anagrammatix Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            console.log("show init");
        },


        /* *******************************
         *         PLAYER CODE           *
         ******************************* */

        sendMessage: function() {
            var content = chatInput.val();
            if (content.length > 1) {
                IO.socket.emit('newMessage', {
                    //username: myUsername,
                    username: App.mySocketId,
                    content: content
                });
                //App.createChatMessage("Me", App.cleanInput(content));
            }
            chatInput.val('');
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

            var $messageContent = $('<p class="list-group-item-text">')
                .text(content);
            var $messageInfo = $('<small class="list-group-item-heading text-muted text-primary">')
                .text(username);

            var $message = $('<div>')
                .append($messageInfo, $messageContent);

            var $timestamp = $('<small class="pull-right text-muted">')
                .text(new Date().toString());

            var $item = $('<li class="list-group-item">')
                .append($timestamp, $message);

            App.addMessageElement($item);
        },

        addMessageElement: function(el) {
            var $el = $(el);
            messages.append($el);
            messages.scrollTop = messages[0].scrollHeight;
        },

        cleanInput: function(input) {
            return $('<div/>').text(input).text();
        }

    };

    IO.init();
    App.init();

}($));
