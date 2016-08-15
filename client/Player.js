function Player(pos, name, id, lobbyId, roomId) {
    this.pos = pos;
    this.name = name;
    this.id = id;
    this.lobbyId = lobbyId;
    this.message = "";
    this.messageCountdown = 0;
    this.state = 0;
    this.roomId = roomId;
    this.self = false;
}

Player.prototype.update = function (playerData) {
    this.pos = playerData.pos;
    this.state = playerData.state;
    this.roomId = playerData.roomId;
};

Player.prototype.draw = function (ctx, time) {
    var color = "black";
    switch (this.state) {
        case 0:
            // Standing
            break;
        case 1:
            // Walking
            color = "blue";
            break;
    }
    ctx.fillStyle = color;
    ctx.fillRect(this.pos.x - 5, this.pos.y - 5, 10, 10);
    
    if (this.messageCountdown > 0 && this.message != "") {
        ctx.font = "16px monospace";        
        
        var matches = this.message.match(/([^\s]+\s?){1,4}/g);
        var segments = matches.length;
        for (var i = 0; i < segments; i++) {
            var str = matches[i].trim();
            var msgSize = ctx.measureText(str).width;
            var msgPos = {
                x: Math.min(Math.max(this.pos.x - msgSize / 2, 0), ctx.canvas.width - msgSize),
                y: this.pos.y - 13
            }
            
            var margin = 5;
            
            ctx.fillStyle = "hsl(0, 0%, 90%)";
            ctx.fillRect(msgPos.x - margin, msgPos.y - 11 - margin - (segments - i) * 16, msgSize + margin * 2, 11 + margin * 2);
            
            ctx.fillStyle = "black";
            ctx.fillText(str, msgPos.x, msgPos.y - (segments - i) * 16);
        }
        
    }
    
    ctx.font = "12px monospace";
    if (this.self) {
        ctx.fillStyle = "red";
    } else {
        ctx.fillStyle = "black";
    }
    ctx.fillText(this.name, this.pos.x - ctx.measureText(this.name).width / 2, this.pos.y + 20);
    this.messageCountdown -= time;
};
