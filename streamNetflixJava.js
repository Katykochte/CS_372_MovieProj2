// Katy Kochte, Cleary Bettisworth, Sabian Cavazos
// CS 372 Movie Streaming Site (JavaScript)
// Holds all login and password functionalities 
// Works with streamNetflixServer.js + streamNetflixWeb.html

// Top tab control
function openLoginTab() {
    // Hide all possible pages
    document.getElementById("loginPage").style.display = "block";
    document.getElementById("galleryPage").style.display = "none";
    document.getElementById("marketingPage").style.display = "none";
    document.getElementById("editorPage").style.display = "none";
}

function openFavoritesTab() {
    // Hide all possible pages
    document.getElementById("favoritesPage").style.display = "block";
    document.getElementById("galleryPage").style.display = "none";
    document.getElementById("marketingPage").style.display = "none";
    document.getElementById("editorPage").style.display = "none";
    showFavorites();
}

function openGalleryTab() {
    // Hide all possible pages
    document.getElementById("favoritesPage").style.display = "none";
    document.getElementById("galleryPage").style.display = "block";
    document.getElementById("marketingPage").style.display = "none";
    document.getElementById("editorPage").style.display = "none";
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

    try {
        const endpoint = action === 'login' ? "checkLogin" : "checkNewUser";
        const response = await fetch(`http://localhost:6543/${endpoint}`, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, password }) 
        });

        const result = await response.json();
        console.log(result);

        if (result.status === "newUser" || result.status === "goodLogin") {
            alert(result.message);
            document.getElementById("loginPage").style.display = "none";
            
            // Show different pages based on role
            if (result.role === "marketing manager") {
                document.getElementById("marketingPage").style.display = "block";
            } else if (result.role === "content editor") {
                document.getElementById("editorPage").style.display = "block";
            } else {
                // Default to viewer gallery
                document.getElementById("galleryPage").style.display = "block";
            }

            localStorage.setItem("userID", result.userID);
            console.log("userID stored in local storage: ", result.userID);
            localStorage.setItem("role", result.role);
            
        } else if (result.status === "badLogin" || result.status == "userDeleted") {
            alert(result.message);
        } else {
            console.error("Unknown status:", result.status);
        }

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

///////////////////////////////////
// Movie Gallery Functions
///////////////////////////////////

let currentUserRole = 'viewer'; // This will be set during login

async function loadMovies(searchTerm = '') {
    try {
        const url = searchTerm 
            ? `/api/movies?search=${encodeURIComponent(searchTerm)}`
            : '/api/movies';
            
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load movies');
        
        const movies = await response.json();
        renderMovies(movies, searchTerm);
        
        if (currentUserRole === 'content editor') {
            addEditorControls();
        }
    } catch (error) {
        console.error("Error loading movies:", error);
        alert("Failed to load movies. Please try again later.");
    }
}

// Update searchMovies to use server-side search
function searchMovies() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    loadMovies(searchTerm);
}

function renderMovies(movies, searchTerm = '') {
    const pages = ['galleryPage', 'marketingPage', 'editorPage']
        .map(id => document.getElementById(id))
        .filter(page => page !== null);
    
    pages.forEach(page => {
        const header = page.querySelector('h1');
        const searchContainer = page.querySelector('.search-container');
        page.innerHTML = '';
        if (header) page.appendChild(header);
        if (searchContainer) page.appendChild(searchContainer);
        
        const container = document.createElement('div');
        container.className = 'movies-container';
        page.appendChild(container);
        
        const filteredMovies = searchTerm 
            ? movies.filter(movie => 
                movie.title.toLowerCase().includes(searchTerm.toLowerCase()))
            : movies;
        
        for (let i = 0; i < filteredMovies.length; i += 4) {
            const rowMovies = filteredMovies.slice(i, i + 4);
            container.innerHTML += createMovieRow(rowMovies);
        }
    });
    addLikeDislikeListeners();
}

function renderFavorites(movies) {
    const favoritesPage = document.getElementById("favoritesPage");
    if (!favoritesPage) return;

    const container = favoritesPage.querySelector('.movies-container');
    if (!container) return;

    container.innerHTML = ''; 

    if (movies.length === 0) {
        container.innerHTML = '<p>No favorite movies found. Start liking some!</p>';
        return;
    }

    for (let i = 0; i < movies.length; i += 4) {
        const rowMovies = movies.slice(i, i + 4);
        container.innerHTML += createMovieRow(rowMovies);
    }

    addLikeDislikeListeners();
}

function createMovieRow(movies) {
    let rowHtml = '<div class="row">';
    
    movies.forEach(movie => {
        rowHtml += `
        <div class="column">
            <div class="tooltip" id="${movie._id}" data-movie-id="${movie._id}">
                <span class="tooltiptext">
                    <strong>${movie.title}</strong><br>
                    Genre: ${movie.genre}
                </span>
                <iframe width="100%" height="200" 
                    src="https://www.youtube.com/embed/${movie.youtubeId}" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
                <div class="like-dislike-buttons">
                    <img src="/public/assets/thumbs-up.svg" alt="Like" class="like-btn" data-movie-id="${movie._id}">
                    <img src="/public/assets/thumbs-down.svg" alt="Dislike" class="dislike-btn" data-movie-id="${movie._id}">
                </div>
            </div>
        </div>
    `;
    });
    
    rowHtml += '</div>';
    return rowHtml;
}

function addEditorControls() {
    const editorPage = document.getElementById('editorPage');
    if (!editorPage) return;
    
    // Add movie form
    const formHtml = `
        <div class="editor-controls">
            <h3>Movie Management</h3>

            <div class="add-movie-form">
            <input type="text" id="newMovieTitle" placeholder="Movie Title" required>
            <input type="text" id="newMovieGenre" placeholder="Genre (e.g., Action, Comedy)" required>
            <input type="url" id="newMovieYoutubeUrl" 
                placeholder="Paste YouTube URL"
                pattern="^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+" 
                required>
            <button onclick="handleAddMovie()">Add Movie</button>
            <small class="url-hint">Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ</small>
            </div>

        </div>
    `;
    editorPage.insertAdjacentHTML('afterbegin', formHtml);
    
    // Add delete buttons to each movie
    document.querySelectorAll('.tooltip').forEach(tooltip => {
        const movieId = tooltip.dataset.movieId;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-movie';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = () => handleDeleteMovie(movieId);
        tooltip.appendChild(deleteBtn);
    });
}

// Replace handleAddMovie with this new version
async function handleAddMovie() {
    const title = document.getElementById('newMovieTitle').value.trim();
    const genre = document.getElementById('newMovieGenre').value.trim();
    const youtubeUrl = document.getElementById('newMovieYoutubeUrl').value.trim();
    
    if (!title || !genre || !youtubeUrl) {
        alert('Please fill all fields');
        return;
    }

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
        alert('Invalid YouTube URL. Please use a valid YouTube link.');
        return;
    }

    try {
        const response = await fetch('/api/movies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, genre, youtubeId })
        });
        
        if (!response.ok) throw new Error('Failed to add movie');
        
        loadMovies(); // Refresh the list
        // Clear form
        document.getElementById('newMovieTitle').value = '';
        document.getElementById('newMovieGenre').value = '';
        document.getElementById('newMovieYoutubeUrl').value = '';
    } catch (error) {
        console.error("Error adding movie:", error);
        alert("Failed to add movie. Please try again.");
    }
}

async function handleDeleteMovie(movieId) {
    if (!confirm('Are you sure you want to delete this movie?')) return;
    
    try {
        const response = await fetch(`/api/movies/${movieId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete movie');
        
        // Refresh the movie list
        loadMovies();
    } catch (error) {
        console.error("Error deleting movie:", error);
        alert("Failed to delete movie. Please try again.");
    }
}

// Update your submitForm function to set the user role
async function submitForm(event, action) {
    event.preventDefault();
    
    const user = document.getElementById("user").value;
    const password = document.getElementById("password").value;

    if (!validatePw(password, user)) return;

    try {
        const endpoint = action === 'login' ? "checkLogin" : "checkNewUser";
        const response = await fetch(`http://localhost:6543/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, password })
        });

        const result = await response.json();

        if (result.status === "newUser" || result.status === "goodLogin") {
            localStorage.setItem('userID', result.userID);
            currentUserRole = result.role || 'viewer'; // Store user role
            alert(result.message);
            document.getElementById("loginPage").style.display = "none";
            
            // Show appropriate page based on role
            if (currentUserRole === "marketing manager") {
                document.getElementById("marketingPage").style.display = "block";
            } else if (currentUserRole === "content editor") {
                document.getElementById("editorPage").style.display = "block";
            } else {
                document.getElementById("galleryPage").style.display = "block";
            }

            // Load movies after successful login
            loadMovies();
        } else {
            alert(result.message);
        }

        document.getElementById("user").value = "";
        document.getElementById("password").value = "";
    } catch (error) {
        alert("Error submitting form");
    }
}

function extractYouTubeId(url) {
    // Handle various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Initialize movies when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only load movies if we're already logged in (page refresh)
    if (document.getElementById('galleryPage').style.display === 'block' ||
        document.getElementById('marketingPage').style.display === 'block' ||
        document.getElementById('editorPage').style.display === 'block') {
        loadMovies();
    }
});

///////////////////////////////////
// Search Functions
///////////////////////////////////


// Add event listener for Enter key
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchMovies();
            }
        });
    }
});

function addLikeDislikeListeners() {
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', function() {
            const movieID = this.getAttribute('data-movie-id');
            handleLikeDislike(movieID, 'like');
        });
    });

    document.querySelectorAll('.dislike-btn').forEach(button => {
        button.addEventListener('click', function() {
            const movieID = this.getAttribute('data-movie-id');
            handleLikeDislike(movieID, 'dislike');
        });
    });
}


function handleLikeDislike(movieID, action) {
    const userID = localStorage.getItem("userID");

    if(!userID) {
        console.error("User is not logged in.", userID);
        return;
    }

    fetch('/updateLikeDislike', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ movieID, action, userID })  
    })
    .then(response => response.json())
    .then(data => {
        
        console.log(data);
    })
    .catch(error => console.error('Error:', error));
}

// Fetch Favorites 
function showFavorites() {
    //Retrieve currently logged in user from local storage
    const userID = localStorage.getItem("userID");
    if (!userID) {
      console.error("User not logged in");
      return;
    }
    
    // Fetch info about liked movies from user document
    fetch(`/user/${userID}`)
      .then(response => response.json())
      .then(user => {
        const likedMovieIDs = user.likedMovies || [];
        
        if (likedMovieIDs.length === 0) {
          console.log("No favorites found");
          return []; 
        }
  
        // Use the liked movie ID's to get full movie objects
        return fetch(`/movies?ids=${likedMovieIDs.join(',')}`);
      })
      .then(response => response.json())
      .then(fullMovies => {

        console.log("Full movie data:", fullMovies);
        renderFavorites(fullMovies);
      })
      .catch(error => console.error("Error:", error));
    }