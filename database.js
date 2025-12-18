//import the MySQL2 library
const mysql = require('mysql2');
//create a connection object with my database credential
const con = mysql.createConnection({
    host: "localhost", //MySQL host
    port: 3306, //MySQL port
    user: "root", //MySQL username
    database: "user_database" //The database created in MySQL
});
//Try to connect to MySQL
con.connect(function(err) { 
    if (err) throw err;
        console.log('Connected!');
});
//export the connection so other files can use it 
module.exports = con;
