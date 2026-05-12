const router = require("express").Router();

const {
    getFriendRequestByProfileId,
    getFriendsByProfileId,
    getRequestCount,
    searchUsers,
    acceptFriendRequest,
    declineFriendRequest,
    getFriendSuggestions,
    sendFriendRequest,
} = require("../dataaccess/friendDAO");
const { authMiddleware } = require("../middleware/authMiddleware");

// Apply auth middleware to all friend routes
router.use(authMiddleware);

router.get("/", async (req, res) => {
    const CURRENT_USER_ID = req.user.id;

    try {
        const [friends] = await getFriendsByProfileId(CURRENT_USER_ID);

        const data = [...friends];

        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/request", async (req, res) => {
    const CURRENT_USER_ID = req.user.id;

    try {
        const [friendRequest] =
            await getFriendRequestByProfileId(CURRENT_USER_ID);

        const data = [...friendRequest];

        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Search users
router.get("/search", async (req, res) => {
    const CURRENT_USER_ID = req.user.id;
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    try {
        const [users] = await searchUsers(q.trim(), CURRENT_USER_ID);
        res.json(users);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Accept friend request
router.post("/request/:id/accept", async (req, res) => {
    const CURRENT_USER_ID = 1;
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
    }

    try {
        await acceptFriendRequest(requestId, CURRENT_USER_ID);
        res.json({ success: true, message: "Friend request accepted" });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Decline friend request
router.post("/request/:id/decline", async (req, res) => {
    const CURRENT_USER_ID = 1;
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
    }

    try {
        await declineFriendRequest(requestId, CURRENT_USER_ID);
        res.json({ success: true, message: "Friend request declined" });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Friend suggestions
router.get("/suggestions", async (req, res) => {
    const CURRENT_USER_ID = 1;

    try {
        const [suggestions] = await getFriendSuggestions(CURRENT_USER_ID);
        res.json(suggestions);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Send friend request
router.post("/request", async (req, res) => {
    const CURRENT_USER_ID = 1;
    const { receiverId } = req.body;

    if (!receiverId || isNaN(parseInt(receiverId))) {
        return res.status(400).json({ error: "Valid receiver ID is required" });
    }

    try {
        await sendFriendRequest(CURRENT_USER_ID, parseInt(receiverId));
        res.json({ success: true, message: "Friend request sent" });
    } catch (err) {
        console.error("Database error:", err);
        if (err.message.includes("already exists")) {
            res.status(409).json({ error: err.message });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

module.exports = router;
