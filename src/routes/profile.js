const router = require("express").Router();

const { getPostByProfileId } = require("../dataaccess/postDAO");
const {
    getProfileById,
    updateProfile,
    getUserClubs,
    getUserForumActivity,
} = require("../dataaccess/profileDAO");
const {
    getFriendsByProfileId,
    getRequestCount,
} = require("../dataaccess/friendDAO");
const { authMiddleware } = require("../middleware/authMiddleware");
const { getProfile } = require("../controllers/profile");
// Apply auth middleware to all profile routes

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

    if (contact_info && !validatePhoneNumber(contact_info)) {
        return res.status(400).json({
            error: "Invalid contact number format. Use 7 to 15 digits (spaces, dashes, () and + allowed).",
        });
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

router.get("/friends", authMiddleware, async (req, res) => {
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
// router.get("/:id", async (req, res) => {
//     const PROFILE_ID = parseInt(req.params.id);

//     if (isNaN(PROFILE_ID)) {
//         return res.status(400).json({ error: "Invalid profile ID" });
//     }

//     try {
//         const [profileResults] = await getProfileById(PROFILE_ID);

//         if (profileResults.length === 0) {
//             return res.status(404).json({ error: "Profile not found" });
//         }

//         const postResults = await getPostByProfileId(PROFILE_ID);

//         const user = profileResults[0];

//         const data = {
//             ...user,
//             posts: postResults,
//         };

//         console.log(data);

//         res.json(data);
//     } catch (err) {
//         console.error("Database query error:", err);
//         res.status(500).send("<h1>Internal Server Error</h1>");
//     }
// });

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

router.get(["/", "/:id"], authMiddleware, async (req, res) => {
    try {
        // If an ID is in the URL, use it. Otherwise, use the logged-in user's ID.
        const targetUserId = req.params.id
            ? parseInt(req.params.id, 10)
            : req.user.id;

        // console.log("UserId", targetUserId);

        // 1. Fetch base user info (name, email, department, language, etc.)
        const userProfile = await getProfileById(targetUserId);

        // console.log(userProfile);

        if (!userProfile) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. Fetch all their related data in parallel for speed!
        const [posts, clubs, forum_posts] = await Promise.all([
            getPostByProfileId(targetUserId), // Your existing feed posts function
            getUserClubs(targetUserId), // NEW: Joined clubs
            getUserForumActivity(targetUserId), // NEW: Forum activity
        ]);

        // 3. Assemble the final object matching your Vue frontend interface
        const finalUserData = {
            ...userProfile[0],
            posts: posts || [],
            clubs: clubs || [],
            forum_posts: forum_posts || [],
        };

        console.log(finalUserData);

        res.json(finalUserData);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const validatePhoneNumber = (phone) => {
    if (!phone) return true;

    const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
    const digitsOnly = phone.replace(/\D/g, "");

    return (
        phoneRegex.test(phone) &&
        digitsOnly.length >= 7 &&
        digitsOnly.length <= 15
    );
};

const balls = (data) => {
    if (!data.birth_date) data.birth_date = null;
    if (!data.nationality) data.nationality = null;
    if (!data.role) data.role = null;
    if (!data.department) data.department = null;
    if (!data.language) data.language = null;
    if (!data.contact_info) data.contact_info = null;

    return data;
};

module.exports = router;
