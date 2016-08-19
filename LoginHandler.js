module.exports = function () {
    
    class LoginHandler {
        constructor(app, database) {
            app.get("/loginCheck", function (req, res) {
                database.query("SELECT * FROM users WHERE username='" + req.query.username + "'", [], function (rows) {
                    var found = false;
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].hash === req.query.hash) { 
                            res.send("true");
                            found = true;
                            break;
                        }
                    }
                    if (!found)
                        res.send("false");
                });
            });
            
            app.get("/signup", function (req, res) {
                var user = {
                    username: req.query.username,
                    password: req.query.password,
                    email: req.query.email,
                    hash: Date.now()
                }
                database.query("SELECT * FROM users WHERE username='" + user.username + "'", [], function (rows) {
                    if (rows.length == 0) {
                        database.query("INSERT INTO users SET ?", [user], function () {
                            res.send(user.hash + "");
                        });
                    } else {
                        res.send("exists");
                    }
                });
            });
            
            app.get("/login", function (req, res) {
                database.query("SELECT * FROM users WHERE username='" + req.query.username + "'", [], function (rows) {
                    var found = false;
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].username == req.query.username && rows[i].password == req.query.password) {
                            found = true;
                            res.send(JSON.stringify({
                                email: rows[i].email,
                                hash: rows[i].hash
                            }));
                        }
                    }
                    if (!found)
                        res.send("none");
                });
            });
        }
    }
    
    return LoginHandler;
    
};
