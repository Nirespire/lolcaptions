# LOLCaptions

[![ghit.me](https://ghit.me/badge.svg?repo=Nirespire/lolcaptions)](https://ghit.me/repo/Nirespire/lolcaptions)
[![Build Status](https://travis-ci.org/Nirespire/lolcaptions.svg?branch=master)](https://travis-ci.org/Nirespire/lolcaptions)

## Overview
This personal project was undertaken to remake the flash game of a similar name.
The last place I could find the game was [here](http://www.kongregate.com/games/gyre_o_guile/lolcaptions), but it has
since stopped functioning. The purpose of this project is to remake that same game using Node and adding fun features
that I would have liked to see when playing it with my friends.

The basic idea is you have a room of at least 2 players, and they each get to submit a caption to a random picture. Everyone anonymously votes for the caption they like the best, and the winner gets some points. Repeat each round.

## How to run
- ```npm install```
- ```node index.js```
- Client can connect to port 8080 by default

## Current Feaures
- Multiplayer lobby and chat run by [SocketIO](http://socket.io/)
- Multiplayer chat
- Support for Twitch emotes thanks to [code](https://github.com/popcorncolonel/Chrome-Extensions/tree/master/Kappa%20Everywhere) form [popcorncolonel](https://github.com/popcorncolonel)
- Game is playable but still looking rough on general looks

## TODO
- ~~Get chat working again~~
- ~~Build username register screen~~
- ~~Configure Imgur API to retreive random, captionable images~~
- ~~Fix display of random images (size and position)~~
- ~~Build image voting system~~
- ~~Build caption submitting system~~
- ~~Build caption voting system~~
- Build scoring system
- Build players, scores and images display
- ~~Build winner screen~~ sort of
- Reorganize UI into 3 columns (caption submitting/voting, image display, chat)
