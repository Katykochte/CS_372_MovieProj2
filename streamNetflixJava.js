// Katy Kochte, Cleary Bettisworth, Sabian Cavazos
// CS 372 Movie Streaming Site (JavaScript)
// Holds all login and password functionalities 
// Works with streamNetflixServer.js + streamNetflixWeb.html

// Top tab control
function openTab() {
    document.getElementById("loginPage").style.display = "block";
    document.getElementById("galleryPage").style.display = "none"
}

///////////////////////////////////
// Login Functions
///////////////////////////////////

// Check Password for right chars
function validatePw(password, user) {
    // one lower, upper, number, special char and 8 long
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z]).+$/; 
    const pwRegex2 = /^(?=.*\d)(?=.*[\W_]).{8}$/;

    if (!pwRegex.test(password)) {
        alert("Password must have at least one upper and lowercase");
        return false;
    }
    if (!pwRegex2.test(password)) {
        alert("Password must be 8 chars long with a # and special char");
        return false;
    }
    if (password == user) {
        alert("Password and Username cannot be the same.")
        return false;
    }
    if (!password || !user) {
        alert("Please enter both user and password.");
        return false;
    }
    return true;
}

// Check Username for right requirements
function validateUser(user) {
    // chars + @ + chars + .com
    const passwordRegex = /^[a-zA-Z0-9]+@[a-zA-Z]+\.com$/; 
    
    if (!passwordRegex.test(user)) {
        alert("User must be a valid email with @ and .com");
        return false;
    }
    return true;
}

// Submit User and Password
async function submitForm(event, action) {
    event.preventDefault(); 

    const user = document.getElementById("user").value;
    const password = document.getElementById("password").value;

    if (!validatePw(password, user) || !validateUser(user)) { return; }

    // check if new user or existing one and send to
    // corresponding endpoint 
    try {
        const endpoint = action === 'login' ? "checkLogin" : "checkNewUser";
        const response = await fetch(`http://localhost:6543/${endpoint}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, password }) });

        const result = await response.json();

        // good login, send to gallery / bad login, send message
        if (result.status === "newUser" || result.status === "goodLogin") {
            alert(result.message);
            document.getElementById("loginPage").style.display = "none";
            document.getElementById("galleryPage").style.display = "block";
        } else if (result.status === "badLogin"  
                    || result.status == "userDeleted") {
            alert(result.message);
        } else {
            console.error("Unknown status:", result.status);
        }

        // clear the input fields
        document.getElementById("user").value = "";
        document.getElementById("password").value = "";
    } catch (error) {
        alert("Error submitting form");
    }
}

///////////////////////////////////
// Password Reset Functions
///////////////////////////////////

// Shows the password reset form when pressed
document
  .getElementById("forgotPwBT")
  .addEventListener("click", function() {

    document.getElementById("resetPwForm").style.display = "block";
});

// Text entry box for email
document
  .getElementById("resetPwForm")
  .addEventListener("submit", async function (event) {

    event.preventDefault();
    const email = document.getElementById("email").value;

    const response = await fetch("/requestPwReset", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email})
    });

    const data = await response.json();
    alert(data.message);
    
});