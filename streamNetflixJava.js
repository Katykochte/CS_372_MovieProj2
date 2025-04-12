// Katy Kochte, Cleary Bettisworth, Sabian Cavazos
// CS 372 Movie Streaming Site (JavaScript)
// Holds all login and password functionalities 
// Works with streamNetflixServer.js + streamNetflixWeb.html

///////////////////////////////////
// Top tabs controls
///////////////////////////////////

// Update the openLoginTab function
function openLoginTab() {
    // Hide all possible pages
    document.getElementById("loginPage").style.display = "block";
    document.getElementById("galleryPage").style.display = "none";
    document.getElementById("marketingPage").style.display = "none";
    document.getElementById("editorPage").style.display = "none";
    document.getElementById("favoritesPage").style.display = "none";
    
    // Hide gallery and favorites tabs
    document.getElementById("favoritesButton").style.display = "none";
    document.getElementById("galleryButton").style.display = "none";
}

// 
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
    
    // Set the dashboard title based on role
    const dashboardTitle = document.querySelector('#galleryPage .dashboard-title');
    if (currentUserRole === 'content editor') {
        dashboardTitle.textContent = 'Content Editor Dashboard';
        dashboardTitle.style.display = 'block';
        addEditorControls();
    } 
    else if (currentUserRole === 'marketing manager') {
        dashboardTitle.textContent = 'Marketing Manager Dashboard';
        dashboardTitle.style.display = 'block';
    } 
    else {
        dashboardTitle.textContent = 'Browse our gallery collection below:';
        dashboardTitle.style.color = 'rgb(37, 106, 146)'; // Viewer color
    }
    
    loadMovies();
}

// Listener for clicks
document.addEventListener('DOMContentLoaded', () => {
    // First listener's content
    // Hide gallery and favorites tabs initially
    document.getElementById("favoritesButton").style.display = "none";
    document.getElementById("galleryButton").style.display = "none";
    
    // Only load movies if we're already logged in (page refresh)
    if (document.getElementById('galleryPage').style.display === 'block') {
        // Show gallery and favorites tabs if already logged in
        document.getElementById("favoritesButton").style.display = "block";
        document.getElementById("galleryButton").style.display = "block";
        loadMovies();
    }

    // Second listener's content
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchMovies();
            }
        });
    }
    
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('save-comment')) {
            const movieId = e.target.getAttribute('data-movie-id');
            saveMarketingComment(movieId);
        }
    });
});


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

    if (!validatePw(password, user)) return;

    try {
        const endpoint = action === 'login' ? "checkLogin" : "checkNewUser";
        const response = await fetch(`http://localhost:6543/${endpoint}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, password }) });

        const result = await response.json();

        if (result.status === "newUser" || result.status === "goodLogin") {
            // Store the user ID as provided by the server
            localStorage.setItem('userID', result.userID);
            currentUserRole = result.role || 'viewer';
            
            // Initialize user data
            localStorage.setItem(`userData_${result.userID}`, JSON.stringify({
                likedMovies: [], dislikedMovies: [] }));
    
            // Update UI and load movies
            document.getElementById("loginPage").style.display = "none";
            document.getElementById("galleryPage").style.display = "block"; // Always use galleryPage
            
            // Set the dashboard title immediately
            const dashboardTitle = document.querySelector('#galleryPage .dashboard-title');
            if (currentUserRole === 'content editor') {
                dashboardTitle.textContent = 'Content Editor Dashboard'; } 
            else if (currentUserRole === 'marketing manager') {
                dashboardTitle.textContent = 'Marketing Manager Dashboard'; } 
            else {
                dashboardTitle.textContent = 'Browse our gallery collection below:'; }
            
            document.getElementById("favoritesButton").style.display = "block";
            document.getElementById("galleryButton").style.display = "block";
            loadMovies();
        }
        
        alert(result.message);
        document.getElementById("user").value = "";
        document.getElementById("password").value = "";

    } catch (error) {
        console.error("Error submitting form:", error);
        alert("Error submitting form. Please try again.");
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
const DEBUG_MODE = false; // Set to `true` during development

function getYouTubeThumbnail(youtubeId, customThumbnail = '') {
    return customThumbnail && !customThumbnail.startsWith('http') 
      ? `http://localhost:6543${customThumbnail}` 
      : `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

async function loadMovies(searchTerm = '') {
    try {
        const userID = localStorage.getItem("userID");

        // Fetch user data first
        const userResponse = await fetch(`/user/${userID}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user data");
        const userData = await userResponse.json();

        // Update local storage with fresh user data
        localStorage.setItem(`userData_${userID}`, JSON.stringify({
            likedMovies: userData.likedMovies || [],
            dislikedMovies: userData.dislikedMovies || [] }));

        // Then fetch movies
        const url = searchTerm 
            ? `/api/movies?search=${encodeURIComponent(searchTerm)}`
            : '/api/movies';
        const moviesResponse = await fetch(url);
        if (!moviesResponse.ok) throw new Error(`HTTP error! status: ${moviesResponse.status}`);
        
        const movies = await moviesResponse.json();
        if (!Array.isArray(movies)) throw new Error("Invalid movies data received");

        renderMovies(movies, searchTerm);
        
        if (currentUserRole === 'content editor') {
            addEditorControls(); }

    } catch (error) {
        console.error("Error loading movies:", error);
        alert("Failed to load movies. Please try again later.");
        document.querySelectorAll('.movies-container').forEach(container => {
            container.innerHTML = '<p>Error loading movies. Please refresh the page.</p>'; });
    }
}

function renderMovies(movies, searchTerm = '') {
    const container = document.querySelector('#galleryPage .movies-container') || 
                     document.createElement('div');
    container.className = 'movies-container';
    container.innerHTML = '';
    
    if (movies.length === 0) {
        container.innerHTML = '<p>No movies found. ' + (searchTerm ? 'Not found.' : 'Check back later.') + '</p>';
    } else {
        for (let i = 0; i < movies.length; i += 4) {
            const rowMovies = movies.slice(i, i + 4);
            container.innerHTML += createMovieRow(rowMovies);
        }
    }
    
    // Get the existing page structure
    const galleryPage = document.getElementById('galleryPage');
    const header = galleryPage.querySelector('.dashboard-title');
    const searchContainer = galleryPage.querySelector('.search-container');
    
    // Clear and rebuild the page structure
    galleryPage.innerHTML = '';
    if (header) galleryPage.appendChild(header);
    if (searchContainer) galleryPage.appendChild(searchContainer);
    galleryPage.appendChild(container);
    
    // Add editor controls if the user is a content editor
    if (currentUserRole === 'content editor') {
        addEditorControls();
    }
    
    addLikeDislikeListeners();
}

function renderFavorites(movies) {
    const favoritesPage = document.getElementById("favoritesPage");
    if (!favoritesPage) return;

    const container = favoritesPage.querySelector('.movies-container') || document.createElement('div');
    container.className = 'movies-container';
    container.innerHTML = '';

    if (movies.length === 0) {
        container.innerHTML = '<p>No favorite movies found. Start liking some!</p>';
    } else {
        for (let i = 0; i < movies.length; i += 4) {
            const rowMovies = movies.slice(i, i + 4);
            container.innerHTML += createMovieRow(rowMovies);}
    }

    // Preserve existing page structure
    const header = favoritesPage.querySelector('h1');
    favoritesPage.innerHTML = '';
    if (header) favoritesPage.appendChild(header);
    favoritesPage.appendChild(container);

    addLikeDislikeListeners();
}

// STILL TOO LONG FIX ME
function createMovieRow(movies) {
    try {
        const userID = localStorage.getItem("userID");
        const userData = JSON.parse(localStorage.getItem(`userData_${userID}`) || {});
        
        const likedMovies = (userData.likedMovies || []).map(id => id.toString());
        const dislikedMovies = (userData.dislikedMovies || []).map(id => id.toString());

        let rowHtml = '<div class="row">';
        movies.forEach(movie => {
            if (!movie._id || !movie.youtubeId) {
                console.warn("Invalid movie data:", movie);
                return;
            }

            const movieId = movie._id.toString();
            const isLiked = likedMovies.includes(movieId);
            const isDisliked = dislikedMovies.includes(movieId);

            const thumbnail = getYouTubeThumbnail(movie.youtubeId, movie.thumbnail);

            // Marketing manager specific elements
            const statsHtml = currentUserRole === 'marketing manager' ? 
                `<div class="movie-stats">
                    <span>Likes: ${movie.totalLikes || 0}</span>
                    <span>Dislikes: ${movie.totalDislikes || 0}</span>
                </div>` : '';

            const commentHtml = currentUserRole === 'marketing manager' ? 
                `<div class="marketing-comment">
                    <textarea class="comment-box" data-movie-id="${movie._id}" 
                        placeholder="Add comment for editors...">${movie.marketingComments || ''}</textarea>
                    <button class="save-comment" data-movie-id="${movie._id}">Save</button>
                </div>` : '';

            rowHtml += `
            <div class="column">
                <div class="movie-card" data-movie-id="${movie._id}">
                    <div class="thumbnail-container" onclick="openMoviePlayer('${movie.youtubeId}')">
                        <img src="${thumbnail}" alt="${movie.title}" class="movie-thumbnail" 
                             onerror="this.src='https://img.youtube.com/vi/${movie.youtubeId}/hqdefault.jpg'">
                        <div class="play-icon">▶</div>
                    </div>
                    <div class="movie-info">
                        <h3>${movie.title}</h3>
                        <p>${movie.genre}</p>
                        ${statsHtml}
                    </div>
                    <div class="like-dislike-buttons">
                        <img src="/public/assets/thumbs-up.svg" 
                             class="like-btn ${isLiked ? 'liked' : ''}" 
                             data-movie-id="${movie._id}">
                        <img src="/public/assets/thumbs-down.svg" 
                             class="dislike-btn ${isDisliked ? 'disliked' : ''}" 
                             data-movie-id="${movie._id}">
                    </div>
                    ${commentHtml}
                </div>
            </div>`;
        });
        return rowHtml + '</div>';
    } catch (error) {
        console.error("Error creating movie row:", error);
        return '<div class="row"><p>Error displaying movies</p></div>';
    }
}

///////////////////////////////////
// Movie Playing Functions
///////////////////////////////////

// const varaibles for the two below functions for DRYness
const playerModal = document.getElementById('moviePlayerModal');
const playerFrame = document.getElementById('moviePlayerFrame');

function openMoviePlayer(youtubeId) {
    
    if (playerModal && playerFrame) {
        playerFrame.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
        playerModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind the modal
    }
}

function closeMoviePlayer() {
    if (playerModal && playerFrame) {
        playerFrame.src = '';
        playerModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
}

///////////////////////////////////
// Marketing M and Content E Functions
///////////////////////////////////

// For addEditorControls() function
const formHtml = `
            <div class="editor-controls">
                <h3>Movie Management</h3>
                <form id="addMovieForm" enctype="multipart/form-data">
                    <div class="add-movie-form">
                        <input type="text" id="newMovieTitle" placeholder="Movie Title" required>
                        <input type="text" id="newMovieGenre" placeholder="Genre (e.g., Action, Comedy)" required>
                        <input type="url" id="newMovieYoutubeUrl" 
                            placeholder="Paste YouTube URL"
                            pattern="^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+" 
                            required>
                        <input type="file" id="newMovieThumbnail" accept="image/*" required>
                        <button type="submit">Add Movie</button>
                        <small class="url-hint">Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ</small>
                    </div>
                </form>
            </div>
        `;

function addEditorControls() {
    const galleryPage = document.getElementById('galleryPage');
    if (!galleryPage) return;
    
    // Only add the form if it doesn't exist
    if (!document.getElementById('addMovieForm')) {
        galleryPage.insertAdjacentHTML('afterbegin', formHtml);
    
        document.getElementById('addMovieForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleAddMovie(); });
    }
    
    // Add delete buttons to each movie card
    document.querySelectorAll('.movie-card').forEach(card => {
        if (!card.querySelector('.delete-movie')) {
            const movieId = card.dataset.movieId;
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-movie';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                handleDeleteMovie(movieId); };
            card.appendChild(deleteBtn); }
    });
}

async function handleAddMovie() {
    const title = document.getElementById('newMovieTitle').value.trim();
    const genre = document.getElementById('newMovieGenre').value.trim();
    const youtubeUrl = document.getElementById('newMovieYoutubeUrl').value.trim();
    const thumbnailFile = document.getElementById('newMovieThumbnail').files[0];
    
    if (!title || !genre || !youtubeUrl || !thumbnailFile) {
        alert('Please fill all fields');
        return; }

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
        alert('Invalid YouTube URL. Please use a valid YouTube link.');
        return; }

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('genre', genre);
        formData.append('youtubeId', youtubeId);
        formData.append('thumbnail', thumbnailFile);
        
        const response = await fetch('/api/movies', 
            { method: 'POST', body: formData });
        
        if (!response.ok) throw new Error('Failed to add movie');
        
        // Refresh the list
        loadMovies();
        // Clear form
        document.getElementById('newMovieTitle').value = '';
        document.getElementById('newMovieGenre').value = '';
        document.getElementById('newMovieYoutubeUrl').value = '';
        document.getElementById('newMovieThumbnail').value = '';
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

function extractYouTubeId(url) {
    // Handle various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Handle comment saving
async function saveMarketingComment(movieId) {
    const comment = document.querySelector(`.comment-box[data-movie-id="${movieId}"]`).value;
    
    try {
        const response = await fetch(`/api/movies/${movieId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment })
        });

        if (!response.ok) throw new Error('Failed to save comment');
        
        alert('Comment saved successfully');
    } catch (error) {
        console.error("Error saving comment:", error);
        alert("Failed to save comment. Please try again.");
    }
}

///////////////////////////////////
// Search Functions
///////////////////////////////////

// Update searchMovies to use server-side search
function searchMovies() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    loadMovies(searchTerm);
}


///////////////////////////////////
// Likes/Dislike Functions
///////////////////////////////////

// 
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

// 
async function handleLikeDislike(movieID, action) {
    const userID = localStorage.getItem("userID");

    try {
        // Update server first
        const response = await fetch('/updateLikeDislike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieID, action, userID })
        });

        if (!response.ok) throw new Error('Failed to update like/dislike');

        // Get fresh data from server
        const userResponse = await fetch(`/user/${userID}`);
        const userData = await userResponse.json();

        // Update localStorage with fresh data
        localStorage.setItem(`userData_${userID}`, JSON.stringify({
            likedMovies: userData.likedMovies || [], dislikedMovies: userData.dislikedMovies || []
        }));

        // Force UI refresh
        const activePage = document.querySelector('[style*="display: block"]').id;
        if (activePage === "favoritesPage") {
            showFavorites();
        } else {
            loadMovies(); // Reload movies to get fresh like/dislike states
        }

    } catch (error) {
        console.error("Error updating like/dislike:", error);
        alert("Failed to update preference. Please try again.");
    }
}

// Fetch Favorites list for users 
async function showFavorites() {
    const userID = localStorage.getItem("userID");

    try {
        const userResponse = await fetch(`/user/${userID}`);
        if (!userResponse.ok) throw new Error(await userResponse.text());
        
        const userData = await userResponse.json();
        localStorage.setItem(`userData_${userID}`, JSON.stringify({
            likedMovies: userData.likedMovies || [], dislikedMovies: userData.dislikedMovies || []
        }));

        if (userData.likedMovies?.length > 0) {
            const moviesResponse = await fetch(`/api/movies?ids=${userData.likedMovies.join(',')}`);
            if (!moviesResponse.ok) throw new Error("Failed to fetch favorite movies");
            
            let fullMovies = await moviesResponse.json();
            fullMovies = fullMovies.map(movie => {
                if (!movie.thumbnail && movie.youtubeId) { 
                    movie.thumbnail = `https://img.youtube.com/vi/${movie.youtubeId}/hqdefault.jpg`;}
                return movie; });
            
            renderFavorites(fullMovies);
        } else {
            document.querySelector('.movies-container').innerHTML = '<p>No favorite movies yet!</p>';
        }
    } catch (error) {
        console.error("Error loading favorites:", error);
        alert("Failed to load favorites. Please try again.");
    }
}