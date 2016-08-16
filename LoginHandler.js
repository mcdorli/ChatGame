module.exports = function () {
    
    class LoginHandler {
        constructor(app, database) {
            app.get("signup", function (req, res) {
                console.log(req.params);
            });
            app.get("login", function (req, res) {
                console.log(req.params);
            });
        }
    }
    
    return LoginHandler;
    
};
