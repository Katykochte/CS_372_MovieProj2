# CS_372_MovieProj2
Repo for second CS 372 Project

# Notes for Dr. Das: 
This repo: https://github.com/Katykochte/CS_372_Review/tree/main is the repo that has our User Document as the README.md file for Project 4. **That repo also holds the most up-to-date code with everything needed to run the Docker image and the release code.** This current repo is not the one we want grading done on, as this is the working repo and does not have the finished files, please use the above-linked CS_372_Review repo for testing/grading. Thank you and have a great summer! 

# Notes for developers

makeAdminUser.js will make admin (content editor and marketing manager) account info for you using regular user and password. 
Edit the section that says "User credentials" and it will spit out a hashed password and insert for manual DB adding through terminal. (REMEMBER TO CHANGE THE "role: " PART, can be "viewer", "content editor", or "marketing manager") Users added through new user button are automatically "viewers" so other roles must be added this way. 
#### makeAdminUser has been updated to include all info users now have (4/12/25)

Add a new collection to the streamMovieDb called streamMovieGallery (this will hold all the url/info for the youtube videos)
These also need to be manually added but the easiest way to do so is by logging into the content editor 

#### Add another folder inside /public called "uploads" this is where the thumbnails uploaded will go to

