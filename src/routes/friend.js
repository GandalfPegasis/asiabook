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
    getSentFriendRequest,
    cancelFriendRequest,
} = require("../dataaccess/friendDAO");
const { authMiddleware } = require("../middleware/authMiddleware");

// Apply auth middleware to all friend routes
router.use(authMiddleware);

router.get("/", async (req, res) => {
    const userId = req.user.id;

    try {
        const [friends] = await getFriendsByProfileId(userId);

        const data = [...friends];

        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/request", async (req, res) => {
    const userId = req.user.id;

    try {
        const [friendRequest] = await getFriendRequestByProfileId(userId);

        const data = [...friendRequest];

        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});
// 1. GET Sent Friend Requests
router.get("/requests/sent", async (req, res) => {
    try {
        // Assuming you have middleware that sets req.user
        const userId = req.user.id;

        const [sentRequests] = await getSentFriendRequest(userId);

        res.status(200).json(sentRequests);
    } catch (error) {
        console.error("Error fetching sent requests:", error);
        res.status(500).json({ error: "Failed to fetch sent requests" });
    }
});

// 2. DELETE (Cancel) a Sent Friend Request
router.delete("/requests/:id", async (req, res) => {
    try {
        const userId = req.user.id;
        const requestId = req.params.id;

        // Security Check: Make sure the user deleting the request is actually the sender!

        const [result] = await cancelFriendRequest(requestId, userId);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Request not found or unauthorized to cancel.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Friend request cancelled successfully.",
        });
    } catch (error) {
        console.error("Error cancelling friend request:", error);
        res.status(500).json({ error: "Failed to cancel friend request" });
    }
});

// Search users
router.get("/search", async (req, res) => {
    const userId = req.user.id;
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res
            .status(400)
            .json({ error: "Search query must be at least 2 characters" });
    }

    try {
        const [users] = await searchUsers(q.trim(), userId);
        res.json(users);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Accept friend request
router.post("/request/:id/accept", async (req, res) => {
    const userId = req.user.id;
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
    }

    try {
        await acceptFriendRequest(requestId, userId);

        res.json({ success: true, message: "Friend request accepted" });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Decline friend request
router.post("/request/:id/decline", async (req, res) => {
    const userId = req.user.id;
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
    }

    try {
        await declineFriendRequest(requestId, userId);
        res.json({ success: true, message: "Friend request declined" });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Friend suggestions
router.get("/suggestions", async (req, res) => {
    const userId = req.user.id;

    try {
        const [suggestions] = await getFriendSuggestions(userId);
        res.json(suggestions);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Send friend request
router.post("/request", async (req, res) => {
    const userId = req.user.id;

    const { receiverId } = req.body;

    if (!receiverId || isNaN(parseInt(receiverId))) {
        return res.status(400).json({ error: "Valid receiver ID is required" });
    }

    try {
        await sendFriendRequest(userId, parseInt(receiverId));
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
