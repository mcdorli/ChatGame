module.exports = function() {
    
    class Player {
        
        constructor(pos, name, id, lobbyId, roomId) {
            this.pos = pos;
            this.name = name;
            this.speed = 200;
            this.id = id;
            this.lobbyId = lobbyId;
            this.target = null;
            this.state = 0;
            this.roomId = roomId;
            this.changed = false;
        }
        
        update(time, users, rooms) {
            if (this.target != null) {
                this.state = 1;
                var dif = {
                    x: this.target.x - this.pos.x,
                    y: this.target.y - this.pos.y
                };
                
                var d = Math.sqrt(dif.x * dif.x + dif.y * dif.y); 
                if (d < this.speed * time / 1000) {
                    this.target = null;
                } else {
                    dif.x /= d;
                    dif.y /= d;
                    
                    var room = rooms[this.roomId];
                    var walkArea = room.walkArea;
                    var obstacles = room.obstacles;
                    var teleports = room.teleports;
                    
                    var newX = this.pos.x + dif.x * this.speed * time / 1000;
                    var newY = this.pos.y + dif.y * this.speed * time / 1000;
                    
                    var xMove = true;
                    var yMove = true;
                    if (!this.AABB({x: newX, y: this.pos.y}, walkArea))
                        xMove = false;
                    if (!this.AABB({x: this.pos.x, y: newY}, walkArea))
                        yMove = false;
                    
                    for (var i = 0; i < obstacles.length; i++) {
                        var obst = obstacles[i];
                        if (this.AABB({x: newX, y: this.pos.y}, obst))
                            xMove = false;
                        if (this.AABB({x: this.pos.x, y: newY}, obst))
                            yMove = false;
                    }
                    if (!xMove && !yMove || this.pos.x == newX && this.pos.y == newY)
                        this.target = null;
                    
                    if (xMove)
                        this.pos.x = newX;
                    if (yMove)
                        this.pos.y = newY;
                    
                    for (var i = 0; i < teleports.length; i++) {
                        var tele = teleports[i];
                        if (this.AABB(this.pos, tele)) {
                            this.roomId = tele.to.id;
                            this.pos = {
                                x: tele.to.x, 
                                y: tele.to.y
                            };
                            this.target = null;
                            break;
                        }
                    }
                    this.changed = true;
                }
            } else {
                if (this.state != 0)
                    this.changed = true;
                this.state = 0;
            }
            
            if (this.changed) {
                for (var i = 0; i < users.length; i++) {
                    users[i].socket.emit("update", {id: this.id, pos: this.pos, state: this.state, roomId: this.roomId});
                }
                this.changed = false;
            }
        }
        
        AABB(pos, rect) {
            return (pos.x > rect.x && pos.x < rect.x + rect.width && pos.y > rect.y && pos.y < rect.y + rect.height);
        }
    }
    return Player;
};
