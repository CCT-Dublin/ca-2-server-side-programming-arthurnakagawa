// It finds the form element in my HTML 
const form = document.getElementById("form");
    //Listens fo the submit event when the user clicks "Submit"
    form.addEventListener("submit", function (event) {
    //Stops the browser's default submit behaviou 
    event.preventDefault();
    //Reads the value typed into each input field.
    //.trim() removes accidental spaces before or after the text.
    //form.elements['first_name'] matches by the input's name attribute in my HTML
    const firstName = form.elements['first_name'].value.trim();
    const lastName = form.elements['last_name'].value.trim();
    const email = form.elements['email'].value.trim();
    const phoneNumber = form.elements['phone_number'].value.trim();
    const eircode = form.elements['eircode'].value.trim();
    //These are regular expressions (regex)
    //Define the rules my input must match
    const namePattern = /^[A-Za-z0-9]{1,20}$/; //letters or numbers, 1-20 characters
    const phonePattern = /^[0-9]{10}$/; //exactly 10 digits
    const eircodePattern = /^[0-9][A-Za-z0-9]{5}$/; //6 alphanumeric characters
    //check that none of the fields are empty and if theres any field blank, it shows and stops the function 
    if (!firstName || !lastName || !email || !phoneNumber || !eircode) {
        alert("All fields are required."); 
        return //return exits from the function
    }
    //.test() checks if the value matches the regex
    //if not, shows a specific error message and stops the process
    //enforces all the form rules in the assignment brief
    if (!namePattern.test(firstName)) {
        alert("First name must be alphanumeric and up to 20 characters.");
        return;
    }
    if (!namePattern.test(lastName)) {
        alert("Last name must be alphanumeric and up 20 characters.");
        return;
    }
    if(!phonePattern.test(phoneNumber)) {
        alert("Phone number must be exactly 10 digits.");
        return;
    }
    if (!eircodePattern.test(eircode)) {
        alert("Eircode must be 6 characters.");
        return;
    }
    //sends the data to my server.
    //Express will receive it at /submit
    fetch('/submit', {
        method: 'POST', //means I'm sending new data
        headers: { 'Content-Type': 'application/json' }, //tells the server it's JSON data
        //converts my form into JSON text so the server can parse it
        body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            phone_number: phoneNumber,
            eircode 
        })
    })
    //waits for the server to reply
    .then (response => {
        //is true if the HTTP status code is 200-299
        //if something goes wrong (like 400 or 500), it throws an error
        //.json() parses the server's reply text back into a JavaScript object
        if (!response.ok) throw new Error('Server error');
        return response.json();
    })
    //runs only if the previous .then() succeeds
    //shows success message and clears the form fields with form.reset()
    .then(data => {
        alert('Form submitted successfully!');
        form.reset();
    })
    //If any part of the proccess fails - validation, network, or server error - it will bock runs and display the problem
    .catch(err => {
        alert('There was a problem submitting the form: ' + err.message);
    });
});