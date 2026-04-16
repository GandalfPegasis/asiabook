const router = require("express").Router();

const { getPostByProfileId } = require("../dataaccess/postDAO");
const { getProfileById } = require("../dataaccess/profileDAO");

router.get("/", async (req, res) => {
    const PROFILE_ID = 1;

    try {
        // 1. Fetch the profile data
        const [profileResults] = await getProfileById(PROFILE_ID);

        // 2. Fetch the post pictures
        const [postResults] = await getPostByProfileId(PROFILE_ID);

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

module.exports = router;
