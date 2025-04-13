// Katy Kochte, Cleary Bettisworth, Sabian Cavazos
// CS 372 Movie Streaming Site (JavaScript)
// Holds all backend (None Server) functionalities 
// Works with streamNetflixServer.js + streamNetflixWeb.html

///////////////////////////////////
// Top Tab Controls
///////////////////////////////////

// Control the login tab
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

// Control the favorties table
function openFavoritesTab() {
    // Hide all possible pages and just show favorites
    document.getElementById("favoritesPage").style.display = "block";
    document.getElementById("galleryPage").style.display = "none";
    document.getElementById("marketingPage").style.display = "none";
    document.getElementById("editorPage").style.display = "none";
    showFavorites();
}

// Control for all types of gallery tab
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

// Listener for multiple types of clicks
document.addEventListener('DOMContentLoaded', () => {
    
    // Hide gallery and favorites tabs when page initially loads
    document.getElementById("favoritesButton").style.display = "none";
    document.getElementById("galleryButton").style.display = "none";
    
    // Only load movies if already logged in (page refresh)
    if (document.getElementById('galleryPage').style.display === 'block') {
        // Show gallery and favorites tabs if already logged in
        document.getElementById("favoritesButton").style.display = "block";
        document.getElementById("galleryButton").style.display = "block";
        loadMovies();
    }

    // Listen for enter key for movie adding
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchMovies();
            }
        });
    }
    
    // Listen for save button on commenting feature
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

// Check password for right chars
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

// Check username for right requirements
function validateUser(user) {
    // chars + @ + chars + .com
    const passwordRegex = /^[a-zA-Z0-9]+@[a-zA-Z]+\.com$/; 
    
    if (!passwordRegex.test(user)) {
        alert("User must be a valid email with @ and .com");
        return false;
    }
    return true;
}

// Respond accordingly to user login results
async function handleAuthResponse(result) {

    // set up necessary viewer/new user data 
    if (result.status === "newUser" || result.status === "goodLogin") {
        // store user data
        localStorage.setItem('userID', result.userID);
        currentUserRole = result.role || 'viewer';
        localStorage.setItem(`userData_${result.userID}`, JSON.stringify({
            likedMovies: [], dislikedMovies: [] 
        }));

        // update UI
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("galleryPage").style.display = "block";
        
        // set dashboard title based on role
        const dashboardTitle = document.querySelector('#galleryPage .dashboard-title');
        if (currentUserRole === 'content editor') {
            dashboardTitle.textContent = 'Content Editor Dashboard';
        } else if (currentUserRole === 'marketing manager') {
            dashboardTitle.textContent = 'Marketing Manager Dashboard';
        } else {
            dashboardTitle.textContent = 'Browse our gallery collection below:';
        }

        // show other tabs and load movies
        document.getElementById("favoritesButton").style.display = "block";
        document.getElementById("galleryButton").style.display = "block";
        loadMovies();
    }
    alert(result.message);

}

// Submit User and Password
async function submitForm(event, action) {

    // get user and login from textfields
    event.preventDefault();
    const user = document.getElementById("user").value;
    const password = document.getElementById("password").value;

    // validate user and password
    if (!validatePw(password, user) || !validateUser(user)) return;

    // try to send info to server/DB and see what results
    try {
        // check what kind of login it is and respond accordingly
        const endpoint = action === 'login' ? "checkLogin" : "checkNewUser";
        const response = await fetch(`http://localhost:6543/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, password })
        });

        const result = await response.json();
        await handleAuthResponse(result);

        // clear form fields
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

const DEBUG_MODE = false; // Set to `true` during development

// Pulls youtube thumbnails
function getYouTubeThumbnail(youtubeId, customThumbnail = '') {
    return customThumbnail && !customThumbnail.startsWith('http') 
      ? `http://localhost:6543${customThumbnail}` 
      : `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

// Loads gallery movies
async function loadMovies(searchTerm = '') {
    try {
        const userID = localStorage.getItem("userID");

        // fetch current user data first 
        const userResponse = await fetch(`/user/${userID}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user data");
        const userData = await userResponse.json();

        // update local storage with fresh user data
        localStorage.setItem(`userData_${userID}`, JSON.stringify({
            likedMovies: userData.likedMovies || [],
            dislikedMovies: userData.dislikedMovies || [] }));

        // fetch movies (w/ or w/out search)
        const url = searchTerm 
            ? `/api/movies?search=${encodeURIComponent(searchTerm)}`
            : '/api/movies';
        const moviesResponse = await fetch(url);
        if (!moviesResponse.ok) throw new Error(`HTTP error! status: ${moviesResponse.status}`);
        
        const movies = await moviesResponse.json();
        if (!Array.isArray(movies)) throw new Error("Invalid movies data received");

        renderMovies(movies, searchTerm);

    } catch (error) {
        console.error("Error loading movies:", error);
        alert("Failed to load movies. Please try again later.");
        document.querySelectorAll('.movies-container').forEach(container => {
            container.innerHTML = '<p>Error loading movies. Please refresh the page.</p>'; });
    }
}

// Renders gallery format and movies
function renderMovies(movies, searchTerm = '') {

    // clear screen and get movie container or make one if not exist
    const container = document.querySelector('#galleryPage .movies-container') || 
                     document.createElement('div');
    container.className = 'movies-container';
    container.innerHTML = '';
    
    // arranges movies and message if no movies 
    if (movies.length === 0) {
        container.innerHTML = '<p>No movies found. ' + (searchTerm ? 'Not found.' : 'Check back later.') + '</p>';
    } else {
        for (let i = 0; i < movies.length; i += 4) {
            const rowMovies = movies.slice(i, i + 4);
            container.innerHTML += createMovieRow(rowMovies);
        }
    }
    
    // get the existing page structure
    const galleryPage = document.getElementById('galleryPage');
    const header = galleryPage.querySelector('.dashboard-title');
    const searchContainer = galleryPage.querySelector('.search-container');
    
    // clear and rebuild the page structure
    galleryPage.innerHTML = '';
    if (header) galleryPage.appendChild(header);
    if (searchContainer) galleryPage.appendChild(searchContainer);
    galleryPage.appendChild(container);
    
    // add editor controls if the user is a content editor
    if (currentUserRole === 'content editor') {
        addEditorControls();
    }
    // setup likes/dislikes
    addLikeDislikeListeners();

}

// Creates rows of movies for gallery 
function createMovieRow(movies) {
    try {
        const { likedMovies, dislikedMovies } = getUserMoviePreferences();
        let rowHtml = '<div class="row">';
        
        movies.forEach(movie => {
            rowHtml += createMovieCard(movie, likedMovies, dislikedMovies);
        });
        
        return rowHtml + '</div>';
    } catch (error) {
        console.error("Error creating movie row:", error);
        return '<div class="row"><p>Error displaying movies</p></div>';
    }
}

// Get user likes/dislike for gallery rows
function getUserMoviePreferences() {
    const userID = localStorage.getItem("userID");
    const userData = JSON.parse(localStorage.getItem(`userData_${userID}`) || {});
    return {
        likedMovies: (userData.likedMovies || []).map(id => id.toString()),
        dislikedMovies: (userData.dislikedMovies || []).map(id => id.toString())
    };
}

// Make HTML for marketing stats/comments based on user role
function getRoleSpecificMovieHtml(movie) {
    let html = '';
    
    // add marketing manager functionalities
    if (currentUserRole === 'marketing manager') {
        html += `
        <div class="movie-stats">
            <span>Likes: ${movie.totalLikes || 0}</span>
            <span>Dislikes: ${movie.totalDislikes || 0}</span>
        </div>`;
        
        // add editable comment box
        html += `
        <div class="marketing-comment">
            <textarea class="comment-box" data-movie-id="${movie._id}" 
                placeholder="Add comment for editors...">${movie.marketingComments || ''}</textarea>
            <button class="save-comment" data-movie-id="${movie._id}">Save</button>
        </div>`;
    } 
    // if content editor, view-only comments
    else if (currentUserRole === 'content editor' && movie.marketingComments) {
        html += `
        <div class="marketing-comment">
            <div class="comment-view">${movie.marketingComments}</div>
        </div>`;
    }
    
    return html;
}

// Creates HTML for a single movie card
function createMovieCard(movie, likedMovies, dislikedMovies) {

    if (!movie._id || !movie.youtubeId) {
        console.warn("Invalid movie data:", movie);
        return '';}

    const movieId = movie._id.toString();
    const thumbnail = getYouTubeThumbnail(movie.youtubeId, movie.thumbnail);
    const roleHtml = getRoleSpecificMovieHtml(movie);
    
    return `
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
                ${roleHtml}
            </div>
            <div class="like-dislike-buttons">
                <img src="/public/assets/thumbs-up.svg" 
                     class="like-btn ${likedMovies.includes(movieId) ? 'liked' : ''}" 
                     data-movie-id="${movie._id}">
                <img src="/public/assets/thumbs-down.svg" 
                     class="dislike-btn ${dislikedMovies.includes(movieId) ? 'disliked' : ''}" 
                     data-movie-id="${movie._id}">
            </div>
            ${currentUserRole === 'content editor' ? 
              `<div class="delete-movie" onclick="handleDeleteMovie('${movie._id}')">×</div>` : ''}
        </div>
    </div>`;
}

///////////////////////////////////
// Movie Playing Screen
///////////////////////////////////

// Const variables for the two below functions
const playerModal = document.getElementById('moviePlayerModal');
const playerFrame = document.getElementById('moviePlayerFrame');

// Opens movie "screen"
function openMoviePlayer(youtubeId) {
    
    if (playerModal && playerFrame) {
        playerFrame.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
        playerModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // prevent scrolling behind the modal
    }
}

// Closes movie "screen"
function closeMoviePlayer() {

    if (playerModal && playerFrame) {
        playerFrame.src = '';
        playerModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
}

///////////////////////////////////
// Favorites Functions
///////////////////////////////////

// Fetch Favorites list for users 
async function showFavorites() {

    const userID = localStorage.getItem("userID");

    // use userID to try and get users likes/dislikes for favorites
    try {
        const userResponse = await fetch(`/user/${userID}`);
        if (!userResponse.ok) throw new Error(await userResponse.text());
        
        const userData = await userResponse.json();
        localStorage.setItem(`userData_${userID}`, JSON.stringify({
            likedMovies: userData.likedMovies || [], dislikedMovies: userData.dislikedMovies || [] }));

        // if has any favorites, get their info and render them
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

// Renders favorites movies
function renderFavorites(movies) {

    const favoritesPage = document.getElementById("favoritesPage");
    if (!favoritesPage) return; // return if somehow wrong page

    // get favorite movies and show them in rows
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

    // preserve existing page structure
    const header = favoritesPage.querySelector('h1');
    favoritesPage.innerHTML = '';
    if (header) favoritesPage.appendChild(header);
    favoritesPage.appendChild(container);

    addLikeDislikeListeners();
}

///////////////////////////////////
// Marketing M and Content E Functions
///////////////////////////////////

// HTML form for addEditorControls() function
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

// Adds editors controls to HTML
function addEditorControls() {

    const galleryPage = document.getElementById('galleryPage');
    if (!galleryPage) return; // don's add if not gallery page
    
    // only add the form if it doesn't exist
    if (!document.getElementById('addMovieForm')) {
        galleryPage.insertAdjacentHTML('afterbegin', formHtml);
    
        document.getElementById('addMovieForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleAddMovie(); });
    }
    
    // add delete buttons to each movie card
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

// Adds movies via content editor functionality
async function handleAddMovie() {

    // get form data
    const title = document.getElementById('newMovieTitle').value.trim();
    const genre = document.getElementById('newMovieGenre').value.trim();
    const youtubeUrl = document.getElementById('newMovieYoutubeUrl').value.trim();
    const thumbnailFile = document.getElementById('newMovieThumbnail').files[0];
    
    // check if missing info
    if (!title || !genre || !youtubeUrl || !thumbnailFile) {
        alert('Please fill all fields');
        return; }

    // get youtube ID
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
        alert('Invalid YouTube URL. Please use a valid YouTube link.');
        return; }

    // try to add the new movie
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('genre', genre);
        formData.append('youtubeId', youtubeId);
        formData.append('thumbnail', thumbnailFile);
        
        const response = await fetch('/api/movies', 
            { method: 'POST', body: formData });
        
        if (!response.ok) throw new Error('Failed to add movie');
        
        // refresh the list
        loadMovies();

        // clear form
        document.getElementById('newMovieTitle').value = '';
        document.getElementById('newMovieGenre').value = '';
        document.getElementById('newMovieYoutubeUrl').value = '';
        document.getElementById('newMovieThumbnail').value = '';
    } catch (error) {
        console.error("Error adding movie:", error);
        alert("Failed to add movie. Please try again.");
    }
}

// Deletes a movie via content editor functionality
async function handleDeleteMovie(movieId) {

    // check incase accident click
    if (!confirm('Are you sure you want to delete this movie?')) return;
    
    // delete movie
    try {
        const response = await fetch(`/api/movies/${movieId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete movie');
        
        // refresh the movie list
        loadMovies();

    } catch (error) {
        console.error("Error deleting movie:", error);
        alert("Failed to delete movie. Please try again.");
    }
}

// Collect youtube ID
function extractYouTubeId(url) {
    // handles various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Handle comment saving for marketing manager
async function saveMarketingComment(movieId) {

    // get the comment
    const comment = document.querySelector(`.comment-box[data-movie-id="${movieId}"]`).value;
    
    // try to attach the comment to that movie
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
// Search Function
///////////////////////////////////

// Handles search for movies
function searchMovies() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    loadMovies(searchTerm);
}

///////////////////////////////////
// Likes/Dislike Functions
///////////////////////////////////

// Listens for and handles like/dislike button clicks
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

// Likes/dislikes adding on a movie
async function handleLikeDislike(movieID, action) {

    const userID = localStorage.getItem("userID");

    // try to update likes and dislikes
    try {
        // update server first
        const response = await fetch('/updateLikeDislike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieID, action, userID })
        });

        if (!response.ok) throw new Error('Failed to update like/dislike');

        // get fresh data from server
        const userResponse = await fetch(`/user/${userID}`);
        const userData = await userResponse.json();

        // update localStorage with fresh data
        localStorage.setItem(`userData_${userID}`, JSON.stringify({
            likedMovies: userData.likedMovies || [], dislikedMovies: userData.dislikedMovies || []
        }));

        // force UI refresh to updated info shows
        const activePage = document.querySelector('[style*="display: block"]').id;
        if (activePage === "favoritesPage") {
            showFavorites();
        } else {
            loadMovies(); // reload movies to get fresh like/dislike states
        }

    } catch (error) {
        console.error("Error updating like/dislike:", error);
        alert("Failed to update preference. Please try again.");
    }
}
