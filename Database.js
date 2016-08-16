const mysql = require('mysql');

module.exports = function () {
    
    class Database {
        constructor(data) {
            this.connection = mysql.createConnection(data);
            
            this.connection.connect(function (err) {
                if (err)
                    throw err;
                    
                console.log("Connected to MySQL database with the host: " + data.host + "!");
            });
        }
        
        query(query, data, callback) {
            this.connection.query(query, data, function (err, result) {
                if (err)
                    throw err;
                
                callback(result);
            });
        }
        
        close() {
            this.connection.end(function (err) {
                if (err)
                    throw err;
                
                console.log("Succesfully closed MySQL connection!");
            });
        }
    }
    
    return Database;
    
};
