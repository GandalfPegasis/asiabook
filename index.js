const express = require("express");
const app = express();

require("dotenv").config();

// Get the client
const mysql = require("mysql2/promise");

// Create the connection to database
var connections;
const dickAndBall = async () => {
    connections = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });
};

app.use(express.static("public"));

app.get("/profile", async (req, res) => {
    const PROFILE_ID = 1;

    try {
        // 1. Fetch the profile data
        const [profileResults] = await connections.query(
            "SELECT * FROM profile WHERE id = ?",
            [PROFILE_ID],
        );

        // 2. Fetch the post pictures
        const [postResults] = await connections.query(
            `SELECT post_picture.location, posts.caption
            FROM posts
            LEFT JOIN post_picture ON post_picture.post_id = posts.id
            WHERE posts.posted_by = ?;`,
            [PROFILE_ID],
        );

        // Extract the user object
        const user = profileResults[0];

        // 3. Build an HTML string to display the data and images
        let htmlResponse = `
            <html>
            <head><title>User Posts</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
        `;

        if (user) {
            htmlResponse += `<a href="/friend">friends</a><br>`;
            htmlResponse += `<h1>${user.name}</h1>`;
            htmlResponse += `<h3>${user.email}</h3>`;
            htmlResponse += `<h3>${user.password}</h3>`;
            htmlResponse += `<h3>${user.birth_date}</h3>`;
            htmlResponse += `<h3>${user.nationality}</h3>`;
            htmlResponse += `<h3>${user.role}</h3>`;
            htmlResponse += `<h3>${user.department}</h3>`;
            htmlResponse += `<h3>${user.language}</h3>`;
            htmlResponse += `<h3>${user.contact_info}</h3>`;
            htmlResponse += `<div style="display: flex; flex-wrap: wrap; gap: 20px;">`;

            // Loop through the post results and create an <img> tag for each
            if (postResults.length > 0) {
                postResults.forEach((post) => {
                    htmlResponse += `<div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 8px;">`;

                    // Always display the caption (if it exists)
                    if (post.caption) {
                        htmlResponse += `<p><strong>Caption:</strong> ${post.caption}</p>`;
                    }

                    // Only display the image if a location exists
                    if (post.location) {
                        htmlResponse += `<img src="/img/${post.location}" alt="Post image" style="max-width: 300px; max-height: 300px; object-fit: cover;" />`;
                    }

                    htmlResponse += `</div>`;
                });
            } else {
                htmlResponse += `<p>This user has no posts.</p>`;
            }

            htmlResponse += `</div>`;
        } else {
            htmlResponse += `<h1>User not found.</h1>`;
        }

        htmlResponse += `
            </body>
            </html>
        `;

        // 4. Send the HTML response to the browser
        res.send(htmlResponse);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).send("<h1>Internal Server Error</h1>");
    }
});

app.get("/friend", async (req, res) => {
    // Hardcoded for testing purposes
    const CURRENT_USER_ID = 1;

    try {
        // 1. Fetch the user's active friend list
        const [friends] = await connections.query(
            `SELECT profile.name, profile.id
             FROM friends
             JOIN profile ON friends.profile_id_2 = profile.id
             WHERE friends.profile_id_1 = ? OR friends.profile_id_2 = ?;`,
            [CURRENT_USER_ID, CURRENT_USER_ID],
        );

        // 2. Fetch incoming friend requests
        const [requests] = await connections.query(
            `SELECT friend_request.id AS request_id, profile.name AS sender_name, profile.id AS sender_id
             FROM friend_request
             JOIN profile ON friend_request.requested_by = profile.id
             WHERE friend_request.requested_to = ?;`,
            [CURRENT_USER_ID],
        );

        // 3. Build the HTML with a split-screen Flexbox layout
        let htmlResponse = `
            <html>
            <head>
                <title>Friends Hub</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; }
                    .container { display: flex; max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .left-col { flex: 1; border-right: 2px solid #eee; padding-right: 20px; }
                    .right-col { flex: 1; padding-left: 20px; }
                    .card { border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
                    .btn { border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                    .btn-accept { background: #28a745; color: white; }
                    .btn-decline { background: #dc3545; color: white; }
                    h2 { border-bottom: 2px solid #333; padding-bottom: 10px; }
                </style>
            </head>
            <body>
            <a href="/profile">Back to Profile</a>
                <div class="container">
                    <div class="left-col">
                        <h2>My Friends</h2>
        `;

        // Render Friend List
        if (friends.length > 0) {
            friends.forEach((friend) => {
                htmlResponse += `
                    <div class="card">
                        <p style="margin: 0; font-size: 18px;">👤 <strong>${friend.name}</strong></p>
                        <button class="btn" style="background: #e2e8f0; color: #333;">Message</button>
                    </div>
                `;
            });
        } else {
            htmlResponse += `<p>You haven't added any friends yet.</p>`;
        }

        htmlResponse += `
                    </div>

                    <div class="right-col">
                        <h2>Friend Requests</h2>
        `;

        // Render Friend Requests
        if (requests.length > 0) {
            requests.forEach((req) => {
                htmlResponse += `
                    <div class="card">
                        <p style="margin: 0;"><strong>${req.sender_name}</strong> sent a request.</p>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-accept">Accept</button>
                            <button class="btn btn-decline">Decline</button>
                        </div>
                    </div>
                `;
            });
        } else {
            htmlResponse += `<p>No new friend requests.</p>`;
        }

        htmlResponse += `
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send the final HTML to the browser
        res.send(htmlResponse);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("<h1>Error loading the friends page</h1>");
    }
});

app.get("/forum/:id", async (req, res) => {
    const forumId = req.params.id;

    try {
        // 1. Fetch the main forum post and the author's name
        const [forumResults] = await connections.query(
            `SELECT forum.id, forum.title, forum.description, profile.name AS author_name
             FROM forum
             JOIN profile ON forum.post_by = profile.id
             WHERE forum.id = ?;`,
            [forumId],
        );

        // If the forum post doesn't exist, stop here
        if (forumResults.length === 0) {
            return res.status(404).send("<h1>Forum post not found</h1>");
        }
        const forumPost = forumResults[0];

        // 2. Fetch all replies for this forum post
        const [replyResults] = await connections.query(
            `SELECT forum_reply.id, forum_reply.content AS content, forum_reply.reply_of, profile.name AS replier_name
             FROM forum_reply
             JOIN profile ON forum_reply.post_by = profile.id
             WHERE forum_reply.forum_id = ?
             ORDER BY forum_reply.id ASC;`, // Order by oldest to newest
            [forumId],
        );

        // 3. Build the HTML UI
        let htmlResponse = `
            <html>
            <head>
                <title>${forumPost.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .main-post { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
                    .reply-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    .nested-reply { margin-left: 40px; border-left: 4px solid #28a745; } /* Indent replies to replies */
                    .author { font-weight: bold; color: #333; margin-bottom: 5px; }
                    .reply-to-badge { font-size: 12px; background: #e9ecef; padding: 3px 6px; border-radius: 4px; color: #555; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="main-post">
                        <h1 style="margin-top: 0;">${forumPost.title}</h1>
                        <p class="author">Posted by: ${forumPost.author_name}</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                        <p style="font-size: 16px; line-height: 1.5;">${forumPost.description}</p>
                    </div>

                    <h2>Replies (${replyResults.length})</h2>
        `;

        // Loop through and render the replies
        if (replyResults.length > 0) {
            // 1. Create a lookup object so we can find authors by their reply ID
            const authorLookup = {};
            replyResults.forEach((reply) => {
                authorLookup[reply.id] = reply.replier_name;
            });

            // 2. Loop through and render the replies
            replyResults.forEach((reply) => {
                const isNested = reply.reply_of ? "nested-reply" : "";

                // 3. Find the name of the person they are replying to
                const parentAuthorName = authorLookup[reply.reply_of];

                // 4. Update the badge to show the name instead of the ID
                const replyBadge = reply.reply_of
                    ? `<span class="reply-to-badge" style="font-size: 12px; background: #e9ecef; padding: 3px 6px; border-radius: 4px; color: #555; margin-left: 10px;">
                   Replying to ${parentAuthorName}
               </span>`
                    : "";

                htmlResponse += `
            <div class="reply-card ${isNested}">
                <div class="author">
                    👤 ${reply.replier_name} 
                    ${replyBadge}
                </div>
                <p style="margin: 10px 0 0 0;">${reply.content}</p>
            </div>
        `;
            });
        } else {
            htmlResponse += `<p>No replies yet. Be the first to reply!</p>`;
        }

        htmlResponse += `
                </div>
            </body>
            </html>
        `;

        // Send HTML to the browser
        res.send(htmlResponse);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("<h1>Error loading the forum</h1>");
    }
});

app.all("/{*any}", (req, res, next) => {
    const err = new Error(`Route not found!`);
    err.statusCode = 404;

    next(err);
});

const errorHandler = require("./src/middleware/errorHandler.js");
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
    await dickAndBall();
    console.log(`Example app listening at http://localhost:${port}`);
});
