const router = require("express").Router();

const { getFriendsRequestsByProfileId } = require("../dataaccess/friendDAO");
const { getFriendsByProfileId } = require("../dataaccess/profileDAO");

router.get("/", async (req, res) => {
    // Hardcoded for testing purposes
    const CURRENT_USER_ID = 1;

    try {
        // 1. Fetch the user's active friend list
        const [friends] = await getFriendsByProfileId(CURRENT_USER_ID);

        // 2. Fetch incoming friend requests
        const [requests] = await getFriendsRequestsByProfileId(CURRENT_USER_ID);

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

module.exports = router;
