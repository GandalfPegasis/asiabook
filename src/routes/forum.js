const router = require("express").Router();
const { authMiddleware, verifyToken } = require("../middleware/authMiddleware");

const {
    getForums,
    getForumById,
    getRepliesByForumId,
    createForum,
    createReply,
    voteForum,
    voteReply,
} = require("../dataaccess/forumsDAO");

// GET / - list all forum posts. Optional query: ?clubId=1
router.get('/', async (req, res) => {
    try {
        const clubId = req.query.clubId ? parseInt(req.query.clubId, 10) : null;
        let userId = null;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const payload = verifyToken(token);
            if (payload && payload.id) userId = payload.id;
        }
        const rows = await getForums({ userId, clubId });
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch forum posts" });
    }
});

// GET /:id - get forum post by id
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
        let userId = null;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const payload = verifyToken(token);
            if (payload && payload.id) userId = payload.id;
        }
        const forum = await getForumById(id, userId);
        if (!forum) return res.status(404).json({ error: "Forum not found" });

        res.json(forum);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch forum post" });
    }
});

// GET /:id/replies - get replies for a forum post
router.get('/:id/replies', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
        let userId = null;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const payload = verifyToken(token);
            if (payload && payload.id) userId = payload.id;
        }
        const replies = await getRepliesByForumId(id, userId);
        res.json(replies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch replies" });
    }
});

// Create a new forum post (authenticated)
// POST / - Create a new forum post (authenticated)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, club_id } = req.body;
        const post_by = req.user.id;
        if (!title || !post_by) return res.status(400).json({ error: "Missing title" });

        const created = await createForum(title, post_by, description || null, club_id || null);
        res.status(201).json({ message: "Forum post created successfully", id: created.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create forum post" });
    }
});

// Create a reply for a forum post (authenticated)
// POST /:id/replies - Create a reply for a forum post (authenticated)
router.post('/:id/replies', authMiddleware, async (req, res) => {
    try {
        const forumId = parseInt(req.params.id, 10);
        const post_by = req.user.id;
        const { reply_of, content } = req.body;
        if (isNaN(forumId) || !post_by || !content) return res.status(400).json({ error: "Missing required fields" });

        const created = await createReply(forumId, post_by, reply_of || null, content);
        res.status(201).json({ message: "Reply created", id: created.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create reply" });
    }
});

// POST /forum/:id/vote  { delta: 1 | -1 }
// POST /:id/vote  { delta: 1 | -1 }
router.post('/:id/vote', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const delta = parseInt(req.body.delta, 10) || 1;
        if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

        const result = await voteForum(req.user.id, id, delta > 0 ? 1 : -1);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update votes" });
    }
});

// POST /forum/:id/replies/:replyId/vote { delta }
// POST /:id/replies/:replyId/vote { delta }
router.post('/:id/replies/:replyId/vote', authMiddleware, async (req, res) => {
    try {
        const replyId = parseInt(req.params.replyId, 10);
        const delta = parseInt(req.body.delta, 10) || 1;
        if (isNaN(replyId)) return res.status(400).json({ error: "Invalid reply id" });

        const result = await voteReply(req.user.id, replyId, delta > 0 ? 1 : -1);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update reply votes" });
    }
});

module.exports = router;
