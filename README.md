# CS_372_MovieProj2
Repo for second CS 372 Project

# Notes for reviewers: 
Hopefully, this repo https://github.com/Katykochte/CS_372_Review/tree/main should have a Docker image you 
can download and use to get the webiste running. If not it also has instructions on how to use the files 
in this repo. Our emails are also in that repo if something goes wrong (hopefully it works though!)



## Notes for developers

makeAdminUser.js will make admin (content editor and marketing manager) account info for you using regular user and password. 
Edit the section that says "User credentials" and it will spit out a hashed password and insert for manual DB adding through terminal. (REMEMBER TO CHANGE THE "role: " PART, can be "viewer", "content editor", or "marketing manager") Users added through new user button are automatically "viewers" so other roles must be added this way. 
#### makeAdminUser has been updated to include all info users now have (4/12/25)

Add a new collection to the streamMovieDb called streamMovieGallery (this will hold all the url/info for the youtube videos)
These also need to be manually added but the easiest way to do so is by logging into the content editor 

#### Add another folder inside /public called "uploads" this is where the thumbnails uploaded will go to

## Known Issues
All functions pass line count check 

No known issues but feel free to look for any in current implementation (4/13/25)

