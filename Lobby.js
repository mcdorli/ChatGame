module.exports = function() {
    
    class Lobby {
        constructor(id, name) {
            this.id = id;
            this.name = name;
            this.users = [];
        }
        
        addUser(user) {
            this.users.push(user);
        }
        
        removeUser(id) {
            for (var i = 0; i < this.users.length; i++) {
                if(this.users[i].player.id == id) {
                    this.users.splice(i, 1);
                    break;
                }
            }
        }
        
        getUsers() {
            return this.users;
        }
        
        updateLobby(time, rooms) {
            for (var i = 0; i < this.users.length; i++) {
                this.users[i].player.update(time, this.users, rooms);
            }
        }
        
        broadCastMessage(msg) {
            for (var i = 0; i < this.users.length; i++) {
                this.users[i].socket.emit("chat", msg);
            }
        }
    }
    
    return Lobby;
}
