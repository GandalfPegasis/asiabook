const router = require("express").Router();
const multer = require("multer");
const path = require("path");

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

// --- MULTER CONFIGURATION FOR AVATARS ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure this folder exists: 'uploads/avatars/'
        cb(null, "uploads/avatars/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only images are allowed"));
        }
    },
});

// PUT /profile - Update profile details and avatar
// NEW: Added upload.single("avatar") middleware here
router.put("/", authMiddleware, upload.single("avatar"), async (req, res) => {
    const userId = req.user.id;

    const {
        name,
        email,
        birth_date,
        nationality,
        role,
        department,
        language,
        contact_number,
    } = balls(req.body);

    if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
    }

    if (contact_number && !validatePhoneNumber(contact_number)) {
        return res.status(400).json({
            error: "Invalid contact number format. Use 7 to 15 digits (spaces, dashes, () and + allowed).",
        });
    }

    // Capture the avatar path if the user uploaded a new image
    const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    try {
        // Build the payload to send to your DAO
        const updatePayload = {
            name,
            email,
            birth_date,
            nationality,
            role,
            department,
            language,
            contact_number,
        };

        // Only attach the avatar to the payload if a new one was uploaded
        if (avatarUrl) {
            updatePayload.avatar = avatarUrl;
        }

        // Pass the payload to your DAO
        const result = await updateProfile(userId, updatePayload);

        res.json({
            ...result,
            avatar: avatarUrl, // Send the new URL back to the frontend to update instantly
        });
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

// GET /profile/:id/friends
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

// GET /profile
// Note: Changed /:id to /:id(\\d+) so it doesn't accidentally catch the word "friends" as an ID!
router.get(["/", "/:id"], authMiddleware, async (req, res) => {
    try {
        const targetUserId = req.params.id
            ? parseInt(req.params.id, 10)
            : req.user.id;

        const userProfile = await getProfileById(targetUserId);

        if (!userProfile) {
            return res.status(404).json({ error: "User not found" });
        }

        const [posts, clubs, forum_posts] = await Promise.all([
            getPostByProfileId(targetUserId),
            getUserClubs(targetUserId),
            getUserForumActivity(targetUserId),
        ]);

        const finalUserData = {
            ...userProfile[0],
            posts: posts || [],
            clubs: clubs || [],
            forum_posts: forum_posts || [],
        };

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
    if (!data.contact_number) data.contact_number = null;

    return data;
};

module.exports = router;
