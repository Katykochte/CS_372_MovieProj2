# CS_372_MovieProj2
Repo for second CS 372 Project

## Notes to consider

makeAdminUser.js will make admin (content editor and marketing manager) account info for you using regular user and password. 
Edit the section that says "User credentials" and it will spit out a hashed password and insert for manual DB adding through terminal. (REMEMBER TO CHANGE THE "role: " PART, can be "viewer", "content editor", or "marketing manager") Users added through new user button are automatically "viewers" so other roles must be added this way. 

Add a new collection to the streamMovieDb called streamMovieGallery (this will hold all the url/info for the youtube videos)
These also need to be manually added but the easiest way to do so is by logging into the content editor 

## Known Issues

(*** Functionality not needed for current user stories batch ***)
- Swapping Likes and Dislikes occasionally fails to increment one or the other, i.e. if a user has liked a video and goes back and changes that to a dislike, the like will be removed from the counter associated with the video however the dislikes will sometimes not be incremented, and vice versa, although the logic for this operation is in place.("/updateLikeDislike" inside streamNetflixServer.js) 


