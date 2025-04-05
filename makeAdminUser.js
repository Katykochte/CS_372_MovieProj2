// Used for generating salts and hashed passwords for backend 
// added MM and CE accounts
// Remember passwords have to be 8 chars with 1 special, cap, lower, and number
// Otherwise add whichever usersnames you want to test with
// roles can be "marketing manager" or "content editor" only those or it won't work when login checking

const crypto = require('crypto');

// Function to generate random salt
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

// Function to hash password with salt
function hashPassword(password, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(password + salt);
    return hash.digest('hex');
}

// User credentials (Change these to whatever you want for testing !!!)
const username = "martketingm@movie.com";
const password = "MaMa123!"; // The plain text password

// Generate salt and hash
const salt = generateSalt();
const hashedPassword = hashPassword(password, salt);

console.log("User:", username);
console.log("Salt:", salt);
console.log("Hashed Password:", hashedPassword);
console.log("\nMongoDB insert command:");
console.log(`db.streamMovieCollection.insertOne({
    user: "${username}",
    password: "${hashedPassword}",
    salt: "${salt}",
    failedAttempts: 0,
    role: "marketing manager"
})`);