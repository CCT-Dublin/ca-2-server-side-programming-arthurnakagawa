//leads the Express framework, which simplifies building web servers.
const express = require('express');
//import my database connection
const db = require('./database.js');
//creates an Express application instance - it becomes my server
const app = express();
//The TCP port number where my app will listen for HTTP request
const port = 8080;

const fs = require('fs');

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));//Let the server understand form data submitted from traditional HTML forms
//app.get() defines a route for get request
//'/' is the root URL
app.get('/', (req, res) => {
    //res.sendFile sends the actual file located inside the public folder
    //__dirname is a Node.js variable that gives you the current directory path - ensuring the file path works on any computer
    res.sendFile(__dirname + '/form.html');
});
//handle form submission
//app.post('/submit') defines another route, this time for post requests - this is triggered when the form is submitted by my client.js fetch() call 
app.post('/submit', (req, res) => {
    const { first_name, last_name, email, phone_number, eircode, age } = req.body;//req.body is the object containing the data the user sent
    //regular expressions (regex)
    const namePattern = /^[A-Za-z0-9]{1,20}$/;//letter or numbers, between 1-20 characters
    const phonePattern = /^[0-9]{10}$/;//exactly 10 digits
    const eircodePattern = /^[0-9][A-Za-z0-9]{5}$/;//6 alphanumeric characters
    const agePattern = /^[0-9]{2}$/;
    //validation block ensures every field exists and matches its pattern
    //.test() checks if the string follows the regex rules
    //if any test fails, the server returns HTTP status 400("Bad request") or a JSON object {error: 'Invalid input data'}
    if (
        !first_name || !last_name || !email || !phone_number || !eircode || !age ||
        !namePattern.test(first_name) ||
        !namePattern.test(last_name) ||
        !phonePattern.test(phone_number) ||
        !eircodePattern.test(eircode) ||
        !agePattern.test(age)
    ) {
        //the return statement stops further execution, protecting the database from bad data
        return res.status(400).json({ error: 'Invalid input data' }); 
    }
    //SQL insert query
    //use the paramater placeholders (?) to prevent SQL injection
    const sql = `INSERT INTO mysql_table (first_name, last_name, email, phone_number, eircode, age) VALUES (?, ?, ?, ?, ?)`;
    //execute the query
    db.query(sql, [first_name, last_name, email, phone_number, eircode, age], (err, result) => {
        //handle database errors
        if (err) {
            //handle if the error is a duplicate email
            if (err.code === 'ER_DUP_ENTRY'){
                console.warn('Duplicate email attempted:', email);
                return res.status(400).json({ error: 'Email already exists. Please use another email.' })
            }
            //handle with other MySQL errors
            console.error("Database insert error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        //when the the run is succeed
        console.log("Data inserted:", result);
        //send a json response back to the browser
        //only one response per request
        return res.json({ message: "Data saved successfully!" });
    });

});

const readableStream = fs.createReadStream('person_info.csv', 'csv-parser');


//app.listen() starts the web server
//when its running, the callback prints a confirmation message so you know which address to open in the browser
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    //automatically open the browser with the right url and port
    const { exec } = require('child_process');
    exec(`start http://localhost:${port}`);
});