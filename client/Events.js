function Events(eventList) {
    this.eventList = eventList;
}

Events.prototype.run = function (eventName) {
    var event = this.eventList[eventName];
    switch (event.action) {
        case "openModal":
            if (event.type == "text") {
                 game.createModalPanel(event.text)
            } else {
                // TODO: Create pre-made modal panels and use them
            }
            break;
        case "teleport":
                game.socket.emit("teleport", {room: event.room, x: event.x, y: event.y});
            break;
    }
};
