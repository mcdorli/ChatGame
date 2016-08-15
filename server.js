const express = require("express");
const socket = require("socket.io");
const http = require("http");
const os = require('os');
const fs = require('fs');

const Player = require("./Player")();
const Lobby = require("./Lobby")();

var server = (function() {
    
    var rooms = JSON.parse(fs.readFileSync("rooms.json")).rooms;
    var events = JSON.parse(fs.readFileSync("events.json")).events;
    
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var i in interfaces) {
        for (var j in interfaces[i]) {
            var address = interfaces[i][j];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }

    var users = [];
    var lobbies = [new Lobby(0, "TestLobby"), new Lobby(2, "TestLobby2")];

    var app = express();
    app.use(express.static("client"));
    app.listen(80);

    var server = http.createServer(app);
    var io = socket(server);
    server.listen(80, addresses[0], function() {
        console.log("Started server on address " + server.address().address + ":"  + server.address().port);
    });

    io.on("connection", function(socket) {
        // Message listeners
        console.log("A new user connected to the server");
        
        socket.on("getLobbies", function () {
            var data = [];
            for (var i = 0; i < lobbies.length; i++) {
                data.push({
                    id: lobbies[i].id,
                    name: lobbies[i].name,
                    userAmount: lobbies[i].users.length
                });
            }
            socket.emit("lobbies", data);
        });
        
        socket.on("register", function(data) {
            var startRoomId = 0;
            var walkArea = rooms[startRoomId].walkArea;
            var lobbyId = -1;
            for (var i = 0; i < lobbies.length; i++) {
                if (lobbies[i].id == data.lobby) {
                    lobbyId = i;
                }
            }
            
            if (lobbyId == -1)
                return;
            
            var player = new Player({
                    x: 512,
                    y: 383
                },
                data.name,
                socket.id,
                lobbyId,
                startRoomId
            );
            
            var playerData = {
                pos: player.pos, 
                name: player.name, 
                id: player.id, 
                lobbyId: player.lobbyId, 
                roomId: player.roomId,
                rooms: rooms,
                events: events
            };

            this.emit("init", playerData);

            for (var i = 0; i < users.length; i++) {
                if (users[i].player.lobbyId == lobbyId) {
                    users[i].socket.emit("createPlayer", playerData);
                    this.emit("createPlayer", users[i].player);
                }
            }

            var user = {
                player: player,
                socket: this
            };

            users.push(user);
            lobbies[lobbyId].addUser(user);
            console.log("A new character was created with the name " + data.name);
        });

        socket.on("click", function(newPos) {
            var user = getUser(this.id);
            
            if (user) {
                var isEvent = false;
                var room = rooms[user.player.roomId];
                for (var i = 0; i < room.events.length; i++) {
                    if (user.player.AABB(newPos, room.events[i]))
                        isEvent = true;
                }
                
                if (!isEvent)
                    user.player.target = newPos;
            }
        });

        socket.on("disconnect", function() {
            for (var i = 0; i < users.length; i++) {
                if (users[i].socket.id == this.id) {
                    console.log(users[i].player.name + " disconnected from the server");
                    for (var j = 0; j < users.length; j++) {
                        users[j].socket.emit("removePlayer", users[i].player.id);
                    }
                    lobbies[users[i].player.lobbyId].removeUser(users[i].player.id);
                    users.splice(i, 1);
                    break;
                }
            }
        });

        socket.on("chatMessage", function(msg) {
            var user = getUser(this.id);
            lobbies[user.player.lobbyId].broadCastMessage({
                playerId: user.player.id,
                message: msg
            });
        });
        
        socket.on("teleport", function (teleportData) {
            var user = getUser(this.id);
            user.player.roomId = teleportData.room;
            user.player.pos = {x: teleportData.x, y: teleportData.y};
            user.player.changed = true;
        });
    });

    function loop() {
        for (var i = 0; i < lobbies.length; i++) {
            lobbies[i].updateLobby(20, rooms);
        }
        var str = "";
        for (var i = 0; i < users.length; i++) {
            str += " " + users[i].socket.id;
        }
        setTimeout(loop, 20);
    }

    function getUser(socketId) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id == socketId)
                return users[i];
        }
    }

    loop();

})();
