const router = require("express").Router();

const {
    getForums,
    getFormById,
    getRepliesByForumId,
} = require("../dataaccess/forumsDAO");

router.get("/forum", async (req, res) => {
    try {
        const [rows] = await getForums();

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch forum posts" });
    }
});

// Create a new forum post
router.post("/forum", async (req, res) => {
    try {
        const { title, post_by, description } = req.body;

        const sql =
            "INSERT INTO forum (title, post_by, description) VALUES (?, ?, ?)";
        const [result] = await db.query(sql, [title, post_by, description]);

        res.status(201).json({
            message: "Forum post created successfully",
            id: result.insertId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create forum post" });
    }
});
module.exports = router;
