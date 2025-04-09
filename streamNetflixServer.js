// Katy Kochte, Cleary Bettisworth, Sabian Cavazos
// CS 372 Movie Streaming Site (Server)
// Holds all ther server side functions

const { MongoClient, ObjectId } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); 

const port = 6543;
const uri = "mongodb://localhost:27017"; // MongoDB URI
const client = new MongoClient(uri);

// Set up multer to handle form data
const upload = multer(); 

// Connect to MongoDB when the server starts
async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
    }
}
connectDB();

// Serve HTML page on "/"
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "streamNetflixWeb.html"));
});

app.use(express.json());

///////////////////////////////////
// Login Functions
///////////////////////////////////

// Handle failed login attempts by keeping track of consecutive
// login attempts, if number of attempts at 3, delete account
async function handleFailedLogin(collection, user) {
    // Find the user in the database
    const existUser = await collection.findOne({ user });

    // Increment failedAttempts on failed login
    const newTrys = (existUser.failedAttempts || 0) + 1;

    if (newTrys >= 3) {
        // Delete the user after 3 consecutive failed attempts
        await collection.deleteOne({ user });
        return { 
            status: "userDeleted", 
            message: `User ${existUser.user} deleted due to 3 failed logins.` };
    } else {
        // Update failedAttempts in the database
        await collection.updateOne(
            { user },
            { $set: { failedAttempts: newTrys } }
        );
        return { 
            status: "badLogin", 
            message: `${existUser.user} failed login. Attempts: ${newTrys}` };
    }
}

// Check if new user info already exist, if not then adds one
app.post("/checkNewUser", upload.none(), async (req, res) => {
    const { user, password } = req.body;

    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieCollection");

        // Check if the user already exists
        const existUser = await collection.findOne({ user });

        if (existUser) {
            return res.json({ status: "badLogin", 
                              message: "User already exists. Please login instead." });
        }

        // User does not exist, add new user
        const salt = generateSalt();
        const hashedPassword = hashPassword(password, salt);
        const result = await collection.insertOne({ 
            user, 
            password: hashedPassword, 
            salt, 
            failedAttempts: 0,
            role: "viewer", // Default role for new users
            likedMovies: [],
            dislikedMovies: []
        });

        console.log(`New user added with _id: ${result.insertedId}`);
        return res.json({ status: "newUser", message: `New user created: ${user}` });

    } catch (error) {
        console.error("Error creating new user:", error);
        return res.status(500).json({ status: "error", message: "Error creating new user" });
    }
});

// Checks login info for matching info, if no match sends 
// message to make a new account instead, otherwise checks login as normal
app.post("/checkLogin", upload.none(), async (req, res) => {
    const { user, password } = req.body;

    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieCollection");

        // Check if the user exists
        const existUser = await collection.findOne({ user });

        // User does not exist
        if (!existUser) {
            return res.json({ status: "badLogin", 
                              message: "User not found. Please create an account." });
        }

        // Hash password w/ the salt associated w/ account to confirm right
        const hashedPassword = hashPassword(password, existUser.salt);
        
        // User exists, check password
        if (hashedPassword === existUser.password) {
            await collection.updateOne({ user }, { $set: { failedAttempts: 0 } });
            return res.json({ 
                status: "goodLogin", 
                message: `Hi ${user}!`,
                userID: existUser._id,
                role: existUser.role // Include role in response
            });
        } else {
            // Handle failed login
            const result = await handleFailedLogin(collection, user);
            return res.json(result);
        }
    } catch (error) {
        console.error("Error checking login:", error);
        return res.status(500).json({ status: "error", message: "Error processing login" });
    }
});

// Password hashing function
function hashPassword(password, salt) {
    const hash = crypto.createHash("sha256");
    hash.update(password + salt);
    return hash.digest("hex");
}

// Function to generate random salt for hashing
function generateSalt () {
    return crypto.randomBytes(16).toString("hex");
}

///////////////////////////////////
// Password Reset Functions
///////////////////////////////////

// Nodemailer and Password Reset functions
// This just sets up the email system defaults
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "CinemaStreamingCorner@gmail.com",
        pass: "tjtv ipxx hwgh faae"
    }
});

// Actual email sending function
app.post("/requestPwReset", async (req, res) => {
    const {email} = req.body;

    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieCollection");
        //Check if they have an account
        const user = await collection.findOne({ user: email});
        if (!user) {
            return res.json({ status: "error", message: "User not found"});
        }
        // Send email
        await transporter.sendMail({
            from: "CinemaStreamingCorner@gmail.com",
            to: email,
            subject: "Password Reset Request",
            text: "Click this link to reset your password : LINK"
        });

        res.json({status: "good", message: "Password reset email sent"});

    } catch (error) {
        console.error("Error sending email", error);
        res.status(500).json({error: "Error processing request."});
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


///////////////////////////////////
// Movie Gallery API Endpoints
///////////////////////////////////

// Get all movies sorted alphabetically
app.get('/api/movies', async (req, res) => {
    try {
        const { search } = req.query;
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieGallery");
        
        let query = {};
        if (search) {
            query = { 
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { genre: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        const movies = await collection.find(query)
            .sort({ sortTitle: 1 })
            .toArray();
            
        res.json(movies);
    } catch (error) {
        console.error("Error fetching movies:", error);
        res.status(500).json({ error: "Failed to fetch movies" });
    }
});

// Add a new movie (editor only)
app.post('/api/movies', upload.none(), async (req, res) => {
    try {
        const { title, genre, youtubeId } = req.body;
        
        if (!title || !genre || !youtubeId) {
            return res.status(400).json({ error: "Title, genre and YouTube ID are required" });
        }
        
        if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
            return res.status(400).json({ error: "Invalid YouTube ID format" });
        }
        
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieGallery");
        
        const newMovie = {
            title,
            sortTitle: title.toLowerCase().replace(/^the /, ''),
            genre,
            youtubeId,
            createdAt: new Date(),
            totalLikes: 0,
            totalDislikes: 0
        };
        
        const result = await collection.insertOne(newMovie);
        res.status(201).json({ ...newMovie, _id: result.insertedId });
        
    } catch (error) {
        console.error("Error adding movie:", error);
        res.status(500).json({ error: "Failed to add movie" });
    }
});

// Delete a movie (editor only)
app.delete('/api/movies/:id', async (req, res) => {
    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieGallery");
        
        const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Movie not found" });
        }
        
        res.status(204).end();
    } catch (error) {
        console.error("Error deleting movie:", error);
        res.status(500).json({ error: "Failed to delete movie" });
    }
});

app.post('/updateLikeDislike', async (req, res) => {
    const {movieID, action, userID} = req.body;

    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieGallery");
        const userCollection = database.collection("streamMovieCollection");

        const movie = await collection.findOne({ _id: new ObjectId(movieID) });
        if(!movie) {
            return res.status(404).send('Movie not found');
        }

        const user = await userCollection.findOne({ _id: new ObjectId(userID) });
        if (!user) {
            return res.status(404).send("User not found");
        }

        if (action == 'like') {
            if (await userCollection.findOne({
                _id: new ObjectId(userID),
                likedMovies: new ObjectId(movieID)
            })){

            } else if (await userCollection.findOne({
                _id: new ObjectId(userID),
                dislikedMovies: new ObjectId(movieID)
            })) {
                await collection.updateOne(
                    { _id: new ObjectId(movieID) },
                    { 
                        $inc: { 
                            totalLikes: 1,
                            totalDislikes: -1 
                        } 
                    }
                );
                await userCollection.updateOne(
                    { _id: new ObjectId(userID) },
                    {
                        $pull: { dislikedMovies: new ObjectId(movieID) } ,
                        $addToSet: { likedMovies: new ObjectId(movieID) } 
                    }
                );
            }else {
                await collection.updateOne(
                    { _id: new ObjectId(movieID) },
                    { $inc: { totalLikes: 1 } }
                );
                await userCollection.updateOne(
                    { _id: new ObjectId(userID) },
                    { $addToSet: { likedMovies: new ObjectId(movieID) } }
                );
            }
        } else if (action == 'dislike') {
            if (await userCollection.findOne({
                _id: new ObjectId(userID),
                dislikedMovies: new ObjectId(movieID)
            })){

            } else if (await userCollection.findOne({
                _id: new ObjectId(userID),
                likedMovies: new ObjectId(movieID)
            })) {
                await collection.updateOne(
                    { _id: new ObjectId(movieID) },
                    { 
                        $inc: { 
                            totalLikes: -1,
                            totalDislikes: 1 
                        } 
                    }
                );
                await userCollection.updateOne(
                    { _id: new ObjectId(userID) },
                    {
                        $pull: { likedMovies: new ObjectId(movieID) } ,
                        $addToSet: { dislikedMovies: new ObjectId(movieID) } 
                    }
                );
            }else {
                await collection.updateOne(
                    { _id: new ObjectId(movieID) },
                    { $inc: { totalDislikes: 1 } }
                );
                await userCollection.updateOne(
                    { _id: new ObjectId(userID) },
                    { $addToSet: { dislikedMovies: new ObjectId(movieID) } }
                );
            }
        }

        const updateUser = {};
        if (action === 'like') {
            updateUser.$addToSet = { likedMovies: new ObjectId(movieID) }; // Add to likedMovies if not already present
        } else if (action === 'dislike') {
            updateUser.$addToSet = { dislikedMovies: new ObjectId(movieID) }; // Add to dislikedMovies if not already present
        }

        await userCollection.updateOne({ _id: new ObjectId(userID) }, updateUser);


        res.status(200).json({ message: `Movie ${action}d succesfully!`});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating like/dislike');
    }

});