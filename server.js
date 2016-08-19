const express = require("express");
const socket = require("socket.io");
const http = require("http");
const os = require('os');
const fs = require('fs');
const readline = require('readline');

const Player = require("./Player.js")();
const Lobby = require("./Lobby.js")();
const Database = require('./Database.js')();
const LoginHandler = require('./LoginHandler.js')();

const roomsJSON = require('./rooms.json');
const eventsJSON = require('./events');


var server = (function serverFunction() {

    const rooms = roomsJSON.rooms;
    const events = eventsJSON.events;
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.on("line", function (input) {
        switch (input) {
            case "stop":
            case "break":
            case "exit":
                running = false;
                break;
            case "restart":
            case "reload":
                running = false;
                restarting = true;
                break;
            case "help":
                var names = [];
                for (var i = 0; i < users.length; i++) {
                    names.push(users[i].player.name);
                }
            
                console.log("----------------------");
                console.log("Commands:");
                console.log("  - stop, break, exit --- Stop the server");
                console.log("  - restart, reload   --- Restart the server");
                console.log("  - help              --- Bring up this help message");
                console.log("");
                console.log("Current user count: " + users.length);
                console.log(names.join());
                break;
        }
    });
    
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
    var lobbies = [new Lobby(0, "TestLobby"), new Lobby(1, "TestLobby2")];

    var app = express();
    app.use(express.static("client"));
    var expressServer = app.listen(80);
    
    var database = new Database({
        host: "localhost",
        user: "root",
        password: "",
        database: "chatgame"
    });
    
    var loginHandler = new LoginHandler(app, database);

    var server = http.createServer(app);
    var io = socket(server);
    var running = true;
    var restarting = false;
    server.listen(80, addresses[0], function () {
        console.log("Started server on address " + server.address().address + ":" + server.address().port);
    });

    io.on("connection", function (socket) {
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

        socket.on("register", function (data) {
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
        });

        socket.on("click", function (newPos) {
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

        socket.on("disconnect", function () {
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

        socket.on("chatMessage", function (msg) {
            var user = getUser(this.id);
            lobbies[user.player.lobbyId].broadCastMessage({
                playerId: user.player.id,
                message: msg
            });
        });

        socket.on("teleport", function (teleportData) {
            var user = getUser(this.id);
            user.player.roomId = teleportData.room;
            user.player.pos = {
                x: teleportData.x,
                y: teleportData.y
            };
            user.player.changed = true;
        });
    });

    function getUser(socketId) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id == socketId)
                return users[i];
        }
    }

    function loop() {
        for (var i = 0; i < lobbies.length; i++) {
            lobbies[i].updateLobby(20, rooms);
        }
        
        if (running) {
            setTimeout(loop, 20);
        } else {
            if (!restarting) {
                console.log("Stopping the server!");
            } else {
                console.log("Restarting the server!");
            }
            cleanup();
        }
    }

    function cleanup() {
        console.log("Disconnecting users!");
        for (var i = 0; i < users.length; i++) {
            users[i].socket.emit("stopping", restarting ? "restart" : "stop");
        }
        database.close();
        rl.close();
        server.close();
        io.close();
        expressServer.close();
        if (!restarting) {
            process.exit();
        } else {
            setTimeout(serverFunction, 30);
        }
    }

    loop();

})();
