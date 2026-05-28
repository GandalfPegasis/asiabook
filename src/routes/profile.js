const router = require("express").Router();

const { getPostByProfileId } = require("../dataaccess/postDAO");
const { getProfileById, updateProfile } = require("../dataaccess/profileDAO");
const {
    getFriendsByProfileId,
    getRequestCount,
} = require("../dataaccess/friendDAO");
const { authMiddleware } = require("../middleware/authMiddleware");
const { getProfile } = require("../controllers/profile");

// Apply auth middleware to all profile routes
router.use(authMiddleware);

router.get("/", getProfile);

const balls = (data) => {
    if (!data.birth_date) data.birth_date = null;
    if (!data.nationality) data.nationality = null;
    if (!data.role) data.role = null;
    if (!data.department) data.department = null;
    if (!data.language) data.language = null;
    if (!data.contact_info) data.contact_info = null;

    return data;
};

router.put("/", async (req, res) => {
    const userId = req.user.id;

    const {
        name,
        email,
        birth_date,
        nationality,
        role,
        department,
        language,
        contact_info,
    } = balls(req.body);

    if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
    }

    try {
        const result = await updateProfile(userId, {
            name,
            email,
            birth_date,
            nationality,
            role,
            department,
            language,
            contact_info,
        });

        res.json(result);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).send("<h1>Internal Server Error</h1>");
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

        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
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

module.exports = router;
