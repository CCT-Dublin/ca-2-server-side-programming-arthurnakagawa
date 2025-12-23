//leads the Express framework, which simplifies building web servers.
const express = require('express');
//import my database connection
const db = require('./database.js');
//creates an Express application instance - it becomes my server
const app = express();
//The TCP port number where my app will listen for HTTP request
const port = 8080;
//Import the File System module 
//used to read files on the server, such as the CSV file
const fs = require('fs');
//Import the Path module
//it helps create file path that work correctly on all operating systems
const path = require('path');
//Import the csv-parser package
//this library converts CSV file rows into JavaScript objects, so each row can be validate and processed individually 
const csvParser = require('csv-parser');

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
    const { first_name, last_name, email, phone_number, eircode } = req.body;//req.body is the object containing the data the user sent
    //regular expressions (regex)
    const namePattern = /^[A-Za-z0-9]{1,20}$/;//letter or numbers, between 1-20 characters
    const phonePattern = /^[0-9]{10}$/;//exactly 10 digits
    const eircodePattern = /^[0-9][A-Za-z0-9]{5}$/;//6 alphanumeric characters
    //validation block ensures every field exists and matches its pattern
    //.test() checks if the string follows the regex rules
    //if any test fails, the server returns HTTP status 400("Bad request") or a JSON object {error: 'Invalid input data'}
    if (
        !first_name || !last_name || !email || !phone_number || !eircode ||
        !namePattern.test(first_name) ||
        !namePattern.test(last_name) ||
        !phonePattern.test(phone_number) ||
        !eircodePattern.test(eircode) 
    ) {
        //the return statement stops further execution, protecting the database from bad data
        return res.status(400).json({ error: 'Invalid input data' }); 
    }
    //SQL insert query
    //use the paramater placeholders (?) to prevent SQL injection
    const sql = `INSERT INTO mysql_table (first_name, last_name, email, phone_number, eircode) VALUES (?, ?, ?, ?, ?)`;
    //execute the query
    db.query(sql, [first_name, last_name, email, phone_number, eircode], (err, result) => {
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
//route to import and process the CSV file
app.get('/import-csv', (req, res) => {
    //it builds the full file path to the CSV file
    const csvPath = path.join(__dirname, 'person_info.csv');
    //creates a readable stream to read the CSV file
    const readableStream = fs.createReadStream(csvPath);
    //pipe the file stream into the CSV-parser so each row is converted into an object
    const stream = readableStream.pipe(csvParser());
    //count the row 
    let rowNumber = 1;
    //count to track how many records were inserted or rejected
    let inserted = 0, rejected = 0;
    //event to run once for every row in the CSV file
    stream.on('data', (row) => {
        //increment row number so the first data row is row 2
        rowNumber++
        //expressions for validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const namePattern = /^[A-Za-z0-9]{1,20}$/;
        //extract and clean values from the CSV row
        //using ?? '' to avoid errors if the value is missing
        const first = (row.first_name ?? '').trim();
        const last = (row.last_name ?? '').trim();
        const email = (row.email ?? '').trim();
        const ageRaw = (row.age ?? '').trim();
        const age = Number(ageRaw);

        //array to store validation error messages
        const reasons = [];
        //validate email format
        if (!emailPattern.test(email)) {
            reasons.push('email format invalid');
        }
        //validate first name
        if (!namePattern.test(first)) {
            reasons.push('first name invalid')
        }
        //validate last name 
        if (!namePattern.test(last)) {
            reasons.push('last name invalid')
        }
        //validate age
        if (!Number.isInteger(age) || age < 0 || age > 120) {
            reasons.push('Age invalid')
        }
        //if there are validation errors, reject the row
        if (reasons.length > 0) {
            rejected++
            console.error(`Row ${rowNumber} invalid: ${reasons.join('; ')}`);
            return;
        }
        //SQL query using placeholders to prevent SQL injection
        const sql = `INSERT INTO mysql_table (first_name, last_name, email, age) VALUES (?, ?, ?, ?)`;
        //pause the stream while the database insert is running 
        //it prevents the stream from finishing before inserts complete
        stream.pause();
        //insert the valid row into the database 
        db.query(sql, [first, last, email, age], (err) => {
            if (err) {
                //if a database error occurs, count the row as rejected
                rejected++
                console.error(`Row ${rowNumber} DB error: ${err.code || err.message}`)        
            } else {
                //if insert is successful, increase inserted counter
                inserted++
            }
            //resume the stream so the next row can be processed
            stream.resume();
        });
    });
    //this event runs once when the entire CSV file has been processed
    stream.on('end', () => {
        //send a summary of the import back to the browser
        res.json({ inserted, rejected })
    });
    //this event runs if there is a problem reading the CSV file
    stream.on('error', (err) => {
        console.error("CSV read error: ", err.message)
        return res.status(500).json({ error: 'Error reading file'})
    });
});

//app.listen() starts the web server
//when its running, the callback prints a confirmation message so you know which address to open in the browser
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
    //automatically open the browser with the right url and port
    const { exec } = require('child_process');
    exec(`start http://localhost:${port}`);
});