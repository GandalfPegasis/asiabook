const router = require("express").Router();

const { getPostByProfileId } = require("../dataaccess/postDAO");
const { getProfileById } = require("../dataaccess/profileDAO");
const {
    getFriendsByProfileId,
    getRequestCount,
} = require("../dataaccess/friendDAO");
const { authMiddleware } = require("../middleware/authMiddleware");

// Apply auth middleware to all profile routes
router.use(authMiddleware);

router.get("/", async (req, res) => {
    const PROFILE_ID = req.user.id; // Get from authenticated user token

    try {
        const [profileResults] = await getProfileById(PROFILE_ID);

        const [postResults] = await getPostByProfileId(PROFILE_ID);

        const user = profileResults[0];

        const data = {
            ...user,
            posts: postResults,
        };

        res.json(data);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).send("<h1>Internal Server Error</h1>");
    }
});

// NEW: Get profile by ID
router.get("/:id", async (req, res) => {
    const PROFILE_ID = parseInt(req.params.id);

    if (isNaN(PROFILE_ID)) {
        return res.status(400).json({ error: "Invalid profile ID" });
    }

    try {
        const [profileResults] = await getProfileById(PROFILE_ID);

        if (profileResults.length === 0) {
            return res.status(404).json({ error: "Profile not found" });
        }

        const [postResults] = await getPostByProfileId(PROFILE_ID);

        const user = profileResults[0];

        const data = {
            ...user,
            posts: postResults,
        };

        res.json(data);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).send("<h1>Internal Server Error</h1>");
    }
});

// NEW: Get friends by profile ID
router.get("/:id/friends", async (req, res) => {
    const PROFILE_ID = parseInt(req.params.id);

    if (isNaN(PROFILE_ID)) {
        return res.status(400).json({ error: "Invalid profile ID" });
    }

    try {
        const [friends] = await getFriendsByProfileId(PROFILE_ID);
        const [requestCount] = await getRequestCount(PROFILE_ID);

        const data = {
            friends,
            requestCount: requestCount["friend_request"],
        };
        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/friends", async (req, res) => {
    const CURRENT_USER_ID = req.user.id;

    try {
        const [friends] = await getFriendsByProfileId(CURRENT_USER_ID);
        const [requestCount] = await getRequestCount(CURRENT_USER_ID);

        const data = {
            friends,
            requestCount: requestCount["friend_request"],
        };
        console.log("Friends Page Data:", data);
        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
