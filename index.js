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

const port = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/dick", async (req, res) => {
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

app.listen(port, async () => {
    await dickAndBall();
    console.log(`Example app listening at http://localhost:${port}`);
});
