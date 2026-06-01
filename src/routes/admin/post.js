const router = require("express").Router();
const db = require("../../database"); // Path to your database connection

const {
    getCommentsByPostId,
    createComment,
} = require("../../dataaccess/admin/commentDAO");
const { autoFlagMiddleware } = require("../../middleware/moderation"); // The word filter we built!

// 1. GET ALL FLAGGED OR REPORTED POSTS (with Pagination)
// Endpoint: GET /api/admin/moderation/posts?page=1
router.get("/", async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const LIMIT = 10;
    const offset = (page - 1) * LIMIT;

    try {
        // Base query to find posts that are under review, suspended, or have active reports
        let baseQuery = `
            FROM posts p                        -- Changed from 'post' to 'posts'
            JOIN profile u ON p.posted_by = u.id -- Changed from 'user_id' to 'posted_by'
            LEFT JOIN report r ON r.entity_id = p.id AND r.entity_type = 'post'
            WHERE p.status IN ('reviewing', 'suspended') OR r.status = 'pending'
            GROUP BY p.id
        `;

        // 1. Get the total count for pagination math
        const countSql =
            `SELECT COUNT(DISTINCT p.id) as totalCount ` + baseQuery;
        const [countResult] = await db.query(countSql);

        // 2. Get the actual rows with author details and report counts
        const dataSql =
            `
            SELECT 
                p.id, 
                p.caption,
                p.status, 
                p.created_at,
                u.name AS author_name, 
                u.email AS author_email,
                COUNT(r.id) AS report_count,
                IF(COUNT(r.id) > 0, JSON_ARRAYAGG(JSON_OBJECT('id', r.id, 'reason', r.reason)), JSON_ARRAY()) AS reports
            ` +
            baseQuery +
            `
            ORDER BY report_count DESC, p.created_at DESC
            LIMIT ?, ?
        `;

        const [moderationData] = await db.query(dataSql, [offset, LIMIT]);

        res.json({
            data: moderationData,
            page: page,
            total_items: countResult,
        });
    } catch (e) {
        console.error("Moderation Fetch Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 2. APPROVE / OVERRULE A FLAGGED POST (Mark as safe)
// Endpoint: PUT /api/admin/moderation/posts/:id/approve
router.put("/:id/approve", async (req, res) => {
    const postId = req.params.id;

    try {
        // Start a transaction to ensure both updates succeed or fail together
        await db.query("START TRANSACTION");

        // 1. Change post status back to active
        await db.query(`UPDATE post SET status = 'active' WHERE id = ?`, [
            postId,
        ]);

        // 2. Mark any pending reports for this post as reviewed/dismissed
        await db.query(
            `UPDATE report SET status = 'reviewed' WHERE entity_type = 'post' AND entity_id = ?`,
            [postId],
        );

        await db.query("COMMIT");
        res.json({
            success: true,
            message: "Post approved and returned to public feed.",
        });
    } catch (e) {
        await db.query("ROLLBACK");
        console.error(e);
        res.status(500).json({ error: "Failed to approve post." });
    }
});

// 3. SUSPEND A POST (Hide it from the feed permanently or temporarily)
// Endpoint: PUT /api/admin/moderation/posts/:id/suspend
router.put("/:id/suspend", async (req, res) => {
    const postId = req.params.id;

    try {
        await db.query("START TRANSACTION");

        // 1. Hide the post from public view
        await db.query(`UPDATE post SET status = 'suspended' WHERE id = ?`, [
            postId,
        ]);

        // 2. Close the reports as handled (reviewed)
        await db.query(
            `UPDATE report SET status = 'reviewed' WHERE entity_type = 'post' AND entity_id = ?`,
            [postId],
        );

        await db.query("COMMIT");
        res.json({
            success: true,
            message: "Post suspended and hidden from public feed.",
        });
    } catch (e) {
        await db.query("ROLLBACK");
        console.error(e);
        res.status(500).json({ error: "Failed to suspend post." });
    }
});

// 4. DISMISS REPORTS (Keep the post active, ignore the reports)
// Endpoint: PUT /api/admin/moderation/posts/:id/dismiss-reports
router.put("/:id/dismiss-reports", async (req, res) => {
    const postId = req.params.id;

    try {
        // Keep post as active, but mark all reports as dismissed
        await db.query(
            `UPDATE report SET status = 'dismissed' WHERE entity_type = 'post' AND entity_id = ?`,
            [postId],
        );

        res.json({ success: true, message: "Reports dismissed successfully." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to dismiss reports." });
    }
});

// routes/postRouter.js (Add this to your existing post router)

router.get("/comments", async (req, res) => {
    // 1. Pagination setup
    const page = parseInt(req.query.page, 10) || 1;
    const LIMIT = 10;
    const offset = (page - 1) * LIMIT;

    try {
        // 2. Base query to find flagged comments and join user/report data
        let baseQuery = `
            FROM post_comments c
            JOIN profile u ON c.comment_by = u.id
            LEFT JOIN report r ON r.entity_id = c.id AND r.entity_type = 'post_comment'
            WHERE c.status IN ('reviewing', 'suspended') OR r.status = 'pending'
            GROUP BY c.id
        `;

        // 3. Get the total count (for your frontend pagination math)
        const countSql =
            `SELECT COUNT(DISTINCT c.id) as totalCount ` + baseQuery;
        const [[countResult]] = await db.query(countSql);

        // 4. Fetch the actual comment data, author info, and report JSON arrays
        const dataSql =
            `
            SELECT 
                c.id, 
                c.content, 
                c.status, 
                c.created_at,
                c.post_id,
                u.name AS author_name, 
                u.email AS author_email,
                COUNT(r.id) AS report_count,
                IF(COUNT(r.id) > 0, JSON_ARRAYAGG(JSON_OBJECT('id', r.id, 'reason', r.reason)), JSON_ARRAY()) AS reports
            ` +
            baseQuery +
            `
            ORDER BY report_count DESC, c.created_at DESC
            LIMIT ?, ?
        `;

        const [commentsData] = await db.query(dataSql, [offset, LIMIT]);

        // 5. Send it back perfectly formatted for your Promise.all() frontend call
        res.json({
            data: commentsData,
            page: page,
            total_items: countResult,
        });
    } catch (e) {
        console.error("Admin Comments Fetch Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 1. GET ALL COMMENTS FOR A POST
// Endpoint: GET /api/posts/:id/comments
router.get("/:id/comments", async (req, res) => {
    const postId = req.params.id;

    try {
        const comments = await getCommentsByPostId(postId);
        res.json(comments);
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        res.status(500).json({ error: "Failed to load comments" });
    }
});

// 2. ADD A NEW COMMENT TO A POST
// Endpoint: POST /api/posts/:id/comments
// Note: We slide `autoFlagMiddleware` in here to catch bad words!
router.post("/:id/comments", autoFlagMiddleware, async (req, res) => {
    const postId = req.params.id;

    // In a real app, you get this from your authentication token (e.g., req.user.id)
    // For now, we'll assume the frontend sends the user's ID in the body
    const { userId, content } = req.body;

    // The middleware automatically attaches this based on bad words
    const status = req.body.status;

    try {
        if (!content || content.trim() === "") {
            return res.status(400).json({ error: "Comment cannot be empty" });
        }

        const newComment = await createComment(postId, userId, content, status);

        res.json({
            success: true,
            message:
                status === "reviewing"
                    ? "Comment submitted and is pending review."
                    : "Comment posted successfully!",
            data: newComment,
        });
    } catch (error) {
        console.error("Failed to post comment:", error);
        res.status(500).json({ error: "Could not save comment" });
    }
});

module.exports = router;
