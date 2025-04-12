// Used for generating salts and hashed passwords for backend 
// added MM and CE accounts
// Remember passwords have to be 8 chars with 1 special, cap, lower, and number
// Otherwise add whichever usersnames you want to test with
// roles can be "marketing manager" or "content editor" only those or it won't work when login checking

// Updated admin user generator for Movie Streaming Site
// Remember passwords must be 8+ chars with: 1 special, 1 capital, 1 lowercase, and 1 number

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

// Configuration (Change these values as needed)
const userConfig = {
    username: "contente2@movie.com",  // Must be email format
    password: "CoEd123!",                  // 8+ chars with special, upper, lower, number
    role: "content editor",             // "marketing manager" or "content editor"
    likedMovies: [],                       // Will be populated with ObjectIds later
    dislikedMovies: []                     // Will be populated with ObjectIds later
};

// Validate role
if (!["marketing manager", "content editor"].includes(userConfig.role)) {
    console.error("Error: Role must be either 'marketing manager' or 'content editor'");
    process.exit(1);
}

// Generate salt and hash
const salt = generateSalt();
const hashedPassword = hashPassword(userConfig.password, salt);

console.log("=== User Generation Complete ===");
console.log("Username:", userConfig.username);
console.log("Role:", userConfig.role);
console.log("Salt:", salt);
console.log("Hashed Password:", hashedPassword);

console.log("\n=== MongoDB Insert Command ===");
console.log(`db.streamMovieCollection.insertOne({
    user: "${userConfig.username}",
    password: "${hashedPassword}",
    salt: "${salt}",
    failedAttempts: 0,
    role: "${userConfig.role}",
    likedMovies: [],
    dislikedMovies: []
})`);
