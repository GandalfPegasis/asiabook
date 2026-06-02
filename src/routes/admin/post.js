const router = require("express").Router();
const modDAO = require("../../dataaccess/admin/postDAO");

// --- POST ROUTES (/api/admin/post) ---

router.get("/", async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const LIMIT = 10;
    const offset = (page - 1) * LIMIT;

    try {
        const { data, totalCount } = await modDAO.getFlaggedPosts(
            offset,
            LIMIT,
        );
        res.json({ data, page, total_items: totalCount });
    } catch (e) {
        console.error("Moderation Fetch Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put("/:id/approve", async (req, res) => {
    try {
        await modDAO.setPostStatus(req.params.id, "active");
        res.json({ success: true, message: "Post approved." });
    } catch (e) {
        res.status(500).json({ error: "Failed to approve post." });
    }
});

router.put("/:id/suspend", async (req, res) => {
    try {
        await modDAO.setPostStatus(req.params.id, "suspended");
        res.json({ success: true, message: "Post suspended." });
    } catch (e) {
        res.status(500).json({ error: "Failed to suspend post." });
    }
});

router.put("/:id/dismiss-reports", async (req, res) => {
    try {
        await modDAO.dismissPostReports(req.params.id);
        res.json({ success: true, message: "Reports dismissed." });
    } catch (e) {
        res.status(500).json({ error: "Failed to dismiss reports." });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await modDAO.deletePost(req.params.id);
        res.json({ success: true, message: "Post permanently deleted." });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete post." });
    }
});

// --- COMMENT ROUTES (/api/admin/post/comments) ---

router.get("/comments", async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const LIMIT = 10;
    const offset = (page - 1) * LIMIT;

    try {
        const { data, totalCount } = await modDAO.getFlaggedComments(
            offset,
            LIMIT,
        );
        res.json({ data, page, total_items: totalCount });
    } catch (e) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Added these so your Frontend Vue tab for Comments actually works!
router.put("/comments/:id/suspend", async (req, res) => {
    try {
        await modDAO.setCommentStatus(req.params.id, "suspended");
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to suspend comment." });
    }
});

router.put("/comments/:id/dismiss-reports", async (req, res) => {
    try {
        await modDAO.dismissCommentReports(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to dismiss reports." });
    }
});

router.delete("/comments/:id", async (req, res) => {
    try {
        await modDAO.deleteComment(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete comment." });
    }
});

module.exports = router;
