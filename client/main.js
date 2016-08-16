var game = (function () {

    var c, ctx;
    var socket;

    var lastFrame = Date.now();
    var waiting = true;

    var player;
    var players = [];
    var rooms;
    var images = [];
    var events;

    var name;

    var addressField = document.getElementById("address")
    var nameField = document.getElementById("name");
    var chat = document.getElementById("chat");
    var curtain = document.getElementById("curtain");
    var lobbies = document.getElementById("lobbies");

    function main() {
        c = document.getElementById("canvas");
        c.width = 1024;
        c.height = 768;
        ctx = c.getContext("2d");
        ctx.font = "16px monospace";

        var chatCallback = function () {
            var msg = chat.value;
            chat.value = "";
            socket.emit("chatMessage", msg);
        };

        var nameCallback = function () {
            socket = io(addressField.value);
            game.socket = socket;

            name = nameField.value;
            addressField.style.visibility = "hidden";
            nameField.style.visibility = "hidden";
            document.getElementById("name_send").style.visibility = "hidden";

            lobbies.style.visibility = "visible";

            socket.emit("getLobbies");
            socket.on("lobbies", function (lobbyList) {
                for (var i = 0; i < lobbyList.length; i++) {
                    var lobby = document.createElement("div");
                    lobby.className = "lobby";
                    var name = document.createElement("h1");
                    name.innerHTML = lobbyList[i].name;
                    var userAmount = document.createElement("h3");
                    userAmount.innerHTML = "Total users: " + lobbyList[i].userAmount;

                    lobby.appendChild(name);
                    lobby.appendChild(userAmount);

                    lobby.id = lobbyList[i].id;
                    lobby.onclick = lobbyCallback;

                    lobbies.appendChild(lobby);
                }
            });
        };

        var lobbyCallback = function () {
            lobbies.style.visibility = "hidden";

            c.style.visibility = "visible";
            document.getElementById("chat_send").style.visibility = "visible";
            chat.style.visibility = "visible";

            socket.emit("register", {
                name: name,
                lobby: this.id
            });

            c.addEventListener("click", function (e) {
                var clickPos = {
                    x: e.clientX - this.offsetLeft,
                    y: e.clientY - this.offsetTop
                };
                socket.emit("click", clickPos);
                var room = rooms[player.roomId];
                for (var i = 0; i < room.events.length; i++) {
                    var evt = room.events[i];
                    if (clickPos.x > evt.x && clickPos.x < evt.x + evt.width && clickPos.y > evt.y && clickPos.y < evt.y + evt.height) {
                        events.run(evt.name);
                        break;
                    }

                }
            });

            waiting = false;
            createCallbacks();
        }

        document.getElementById("chat_send").onclick = chatCallback;
        document.getElementById("name_send").onclick = nameCallback;

        document.addEventListener("keydown", function (e) {
            if (e.keyCode == 13) {

                if (!waiting)
                    chatCallback();
            }
        });

        wait();
    }

    function wait() {
        if (!player) {
            setTimeout(wait, 50);
        } else {
            loop();
        }
    }

    function createCallbacks() {
        socket.on("init", function (playerData) {
            player = new Player(playerData.pos, playerData.name, playerData.id, playerData.lobbyId, playerData.roomId);
            player.self = true;
            rooms = playerData.rooms;
            for (var i = 0; i < rooms.length; i++) {
                var img = new Image();
                img.src = "images/" + rooms[i].image;
                images[rooms[i].image] = img;
            }
            events = new Events(playerData.events);
        });

        socket.on("createPlayer", function (playerData) {
            players.push(new Player(playerData.pos, playerData.name, playerData.id, playerData.lobbyId, playerData.roomId));
        });

        socket.on("removePlayer", function (playerId) {
            for (var i = 0; i < players.length; i++) {
                if (players[i].id == playerId) {
                    players.splice(i, 1);
                    break;
                }
            }
        });

        socket.on("update", function (playerData) {
            var p;
            if (playerData.id == player.id) {
                p = player;
            } else {
                for (var i = 0; i < players.length; i++) {
                    if (players[i].id == playerData.id) {
                        p = players[i];
                        break;
                    }
                }
            }
            if (p)
                p.update(playerData);
        });

        socket.on("chat", function (data) {
            var p;
            if (data.playerId == player.id) {
                p = player;

            } else {
                for (var i = 0; i < players.length; i++) {
                    if (players[i].id == data.playerId) {
                        p = players[i];
                    }
                }
            }
            if (p) {
                p.message = data.message.replace(/\s{2,}/g, " ");
                p.messageCountdown = 6000;
            }
        });

        socket.on("stopping", function (type) {
            var text = {
                title: "The server stopped",
                content: ""
            };
            switch (type) {
                case "stop":
                    text.content = "Due to maintenance the server is closed! Come back in an hour!";
                    break;
                case "restart":
                    text.content = "The server is restarting! Come back in a minute!";
                    break;
            }
        });
    }

    function loop() {
        update();
        render();
        lastFrame = Date.now();
        requestAnimationFrame(loop);
    }

    function update() {

    }

    function render() {
        ctx.clearRect(0, 0, c.width, c.height);
        drawRoom(rooms[player.roomId]);
        ctx.fillStyle = "black";
        if (player)
            player.draw(ctx, Date.now() - lastFrame);
        ctx.fillStyle = "red";
        for (var i = 0; i < players.length; i++) {
            if (player.roomId == players[i].roomId)
                players[i].draw(ctx, Date.now() - lastFrame);
        }
    }

    function drawRoom(room) {
        ctx.drawImage(images[room.image], 0, 0, c.width, c.height);
        /*ctx.strokeStyle = "green";
        ctx.strokeRect(room.walkArea.x, room.walkArea.y, room.walkArea.width, room.walkArea.height);
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        for (var i = 0; i < room.obstacles.length; i++) {
            var obst = room.obstacles[i];
            ctx.fillRect(obst.x, obst.y, obst.width, obst.height);
        }
        ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        for (var i = 0; i < room.teleports.length; i++) {
            var tele = room.teleports[i];
            ctx.fillRect(tele.x, tele.y, tele.width, tele.height);
        }
        
        ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
        for (var i = 0; i < room.events.length; i++) {
            var evt = room.events[i];
            ctx.fillRect(evt.x, evt.y, evt.width, evt.height);
        }*/
    }

    main();

    return {
        createModalPanel: function (text) {
            var div = document.createElement("div");
            div.className = "modal-panel";
            var close = document.createElement("span");
            close.className = "close-icon";
            close.innerHTML = "x";

            var h1 = document.createElement("h1");
            h1.innerHTML = text.title;
            var p = document.createElement("p");
            p.className = "modal-content";
            p.innerHTML = text.content;

            div.appendChild(close);
            div.appendChild(h1);
            div.appendChild(p);
            curtain.style.visibility = "visible";
            document.body.appendChild(div);

            close.panel = div;

            close.onclick = function () {
                document.body.removeChild(this.panel);
                curtain.style.visibility = "hidden";
            };
        },
        socket: null
    }
})();
