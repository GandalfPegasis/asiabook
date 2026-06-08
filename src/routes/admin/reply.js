const router = require("express").Router();
const db = require("../../database");

// ==========================================
// DELETE A SPECIFIC REPLY
// Endpoint: DELETE /api/admin/replies/:id
// ==========================================
router.delete("/:id", async (req, res) => {
    const replyId = req.params.id;
    try {
        await db.query(`DELETE FROM forum_reply WHERE id = ?`, [replyId]);
        res.json({ success: true, message: "Reply deleted." });
    } catch (error) {
        console.error("Failed to delete reply:", error);
        res.status(500).json({ error: "Failed to delete reply" });
    }
});

module.exports = router;
