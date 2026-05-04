const router = require("express").Router();

const { getPosts } = require("../dataaccess/postDAO");

router.get("/", async (req, res) => {
    try {
        const rows = await getPosts();

        // Some MySQL versions return the JSON array as a string.
        // This safely parses it back into a true JavaScript array before sending it to Vue.
        const formattedRows = rows.map((row) => ({
            ...row,
            images:
                typeof row.images === "string"
                    ? JSON.parse(row.images)
                    : row.images,
        }));

        res.json(formattedRows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch the feed" });
    }
});

// Create a new post (Just the text/caption portion for now)
router.post("/", async (req, res) => {
    const { posted_by, caption } = req.body;
    try {
        const sql = "INSERT INTO posts (posted_by, caption) VALUES (?, ?)";
        const [result] = await db.query(sql, [posted_by, caption]);
        res.status(201).json({ message: "Post created", id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create post" });
    }
});

module.exports = router;
