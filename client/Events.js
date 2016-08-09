function Events(eventList) {
    this.events = eventList;
}

Events.prototype.run = function (eventName) {
    var event = eventList[eventName];;
    switch (event.action) {
        case "openModal":
            if (event.type == "text") {
                 game.createModalPanel(event.text)
            } else {
                // TODO: Create pre-made modal panels and use them
            }
            break;
        case "teleport":
                //TODO: Create teleport functionality for events
            break;
    }
};
