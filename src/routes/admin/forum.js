const router = require("express").Router();
const db = require("../../database");

// ==========================================
// 1. GET ALL FORUMS (With Nested Replies)
// Endpoint: GET /api/admin/forums
// ==========================================
router.get("/", async (req, res) => {
    const search = req.query.search || null;
    const clubFilter = req.query.club || null;

    try {
        let baseQuery = `
            FROM forum f
            LEFT JOIN clubs c ON f.club_id = c.id
            JOIN profile u ON f.post_by = u.id
            WHERE 1=1
        `;

        const queryParams = [];

        // Apply Search Filter
        if (search) {
            baseQuery += ` AND f.title LIKE ?`;
            queryParams.push(`%${search}%`);
        }

        // Apply Club Filter
        if (clubFilter) {
            // Note: In reality, you'd usually pass the club ID from the frontend.
            // If passing the exact string name, we check against c.title
            baseQuery += ` AND c.title = ?`;
            queryParams.push(clubFilter);
        }

        // Fetch Forums and use a Subquery to build the JSON array of Replies!
        const dataSql =
            `
            SELECT 
                f.id, 
                f.title, 
                f.votes, 
                f.status, 
                f.created_at AS createdAt,
                COALESCE(c.title, 'General (No Club)') AS club,
                u.name AS author,
                
                -- Subquery: Package all replies for this thread into a JSON array
                (
                    SELECT IFNULL(JSON_ARRAYAGG(JSON_OBJECT(
                        'id', r.id, 
                        'author', ru.name, 
                        'content', r.content, 
                        'votes', r.votes, 
                        'flagged', IF(r.status = 'flagged', true, false)
                    )), JSON_ARRAY())
                    FROM forum_reply r
                    JOIN profile ru ON r.post_by = ru.id
                    WHERE r.forum_id = f.id
                ) AS replies
                
            ` +
            baseQuery +
            `
            ORDER BY f.created_at DESC
        `;

        const [forumData] = await db.query(dataSql, queryParams);

        res.json({ data: forumData });
    } catch (error) {
        console.error("Failed to fetch forums:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ==========================================
// 2. LOCK A THREAD
// Endpoint: PUT /api/admin/forums/:id/lock
// ==========================================
router.put("/:id/lock", async (req, res) => {
    const forumId = req.params.id;
    try {
        await db.query(`UPDATE forum SET status = 'locked' WHERE id = ?`, [
            forumId,
        ]);
        res.json({ success: true, message: "Thread locked successfully." });
    } catch (error) {
        console.error("Failed to lock thread:", error);
        res.status(500).json({ error: "Failed to lock thread" });
    }
});

// ==========================================
// 3. UNLOCK A THREAD
// Endpoint: PUT /api/admin/forums/:id/unlock
// ==========================================
router.put("/:id/unlock", async (req, res) => {
    const forumId = req.params.id;
    try {
        await db.query(`UPDATE forum SET status = 'active' WHERE id = ?`, [
            forumId,
        ]);
        res.json({ success: true, message: "Thread unlocked successfully." });
    } catch (error) {
        console.error("Failed to unlock thread:", error);
        res.status(500).json({ error: "Failed to unlock thread" });
    }
});

// ==========================================
// 4. DELETE ENTIRE THREAD
// Endpoint: DELETE /api/admin/forums/:id
// ==========================================
router.delete("/:id", async (req, res) => {
    const forumId = req.params.id;
    try {
        // Because of ON DELETE CASCADE in your SQL tables,
        // deleting the thread automatically deletes all its replies!
        await db.query(`DELETE FROM forum WHERE id = ?`, [forumId]);
        res.json({ success: true, message: "Thread deleted permanently." });
    } catch (error) {
        console.error("Failed to delete thread:", error);
        res.status(500).json({ error: "Failed to delete thread" });
    }
});

module.exports = router;
