const router = require("express").Router();

const { getFormById, getRepliesByForumId } = require("../dataaccess/forumsDAO");

router.get("/:id", async (req, res) => {
    const forumId = req.params.id;

    try {
        // 1. Fetch the main forum post and the author's name
        const [forumResults] = await getFormById(forumId);

        // If the forum post doesn't exist, stop here
        if (forumResults.length === 0) {
            return res.status(404).send("<h1>Forum post not found</h1>");
        }

        // 2. Fetch all replies for this forum post
        const [replyResults] = await getRepliesByForumId(forumId);
        console.log(replyResults);
        // 3. Build the HTML UI
        let htmlResponse = `
            <html>
            <head>
                <title>${forumResults.title}</title>
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
                        <h1 style="margin-top: 0;">${forumResults.title}</h1>
                        <p class="author">Posted by: ${forumResults.author_name}</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                        <p style="font-size: 16px; line-height: 1.5;">${forumResults.description}</p>
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
                    </div>`;
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

module.exports = router;
