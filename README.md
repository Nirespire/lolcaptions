# LOLCaptions

## Overview
This personal project was undertaken to remake the flash game of a similar name. 
The last place I could find the game was [here](http://www.kongregate.com/games/gyre_o_guile/lolcaptions), but it has
since stopped functioning. The purpose of this project is to remake that same game using Node and adding fun features
that I would have liked to see when playing it with my friends.

## How to run
- Clone the repo and run ```npm install``` to resolve any dependencies.
- Run ```node server.js``` to initialize and start an instance of the game server.
- Navigate to client/index.html in a web browser and the UI should load.

## Current Feaures
- Multiplayer lobby run by [CloakJS](http://incompl.github.io/cloak/) and [SocketIO](http://socket.io/)
- Multipler chat with support for Twitch emotes thanks to [code](https://github.com/popcorncolonel/Chrome-Extensions/tree/master/Kappa%20Everywhere) form [popcorncolonel](https://github.com/popcorncolonel)

## TODO
- Configure Imgur API to retreive random, captionable images
- Configure scoring system and display
- Build UI to display players, scores and images
- Build UI to submit and vote on captions
- Build score screen
