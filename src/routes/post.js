const router = require("express").Router();
const path = require("path");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { autoFlagMiddleware } = require("../middleware/moderation"); // <-- NEW: Imported the word filter!
const { createReport } = require("../dataaccess/reportDAO");

// Import all methods from your DAO
const {
    getPosts,
    createPost,
    updateLikeCount,
    getCommentsByPostId,
    addComment,
    getPostById,
} = require("../dataaccess/postDAO");

// --- MULTER STORAGE CONFIGURATION ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname),
        );
    },
});

// --- FILE FILTER FOR IMAGES & VIDEOS ---
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv/;
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(
            new Error(
                "Only images (jpeg, jpg, png, gif, webp) and videos (mp4, mov, avi, mkv) are allowed.",
            ),
        );
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB maximum limit
    },
});

// GET /posts - Feed
router.get("/", async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const rows = await getPosts(limit, offset, userId);

        const formattedPosts = rows.map((post) => {
            let parsedImages = [];

            if (Array.isArray(post.images)) {
                parsedImages = post.images;
            } else if (typeof post.images === "string") {
                try {
                    parsedImages = JSON.parse(post.images);
                } catch (e) {
                    console.error(
                        "Failed to parse images JSON for post:",
                        post.id,
                    );
                }
            }

            return {
                ...post,
                images: parsedImages,
            };
        });

        res.status(200).json(formattedPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch the feed" });
    }
});

// POST /posts - Create Post
// NEW: Added `autoFlagMiddleware` to catch bad words in the caption!
router.post(
    "/",
    authMiddleware,
    upload.array("media", 5),
    autoFlagMiddleware,
    async (req, res) => {
        const { caption } = req.body;
        const posted_by = req.user.id;

        // The middleware automatically attaches this (either 'active' or 'reviewing')
        const status = req.body.status || "active";

        console.log(caption);
        console.log(posted_by);
        try {
            const mediaPaths = req.files
                ? req.files.map((file) => `/uploads/${file.filename}`)
                : [];

            // CRITICAL: Update createPost in your DAO to accept the 4th argument (status)
            const postId = await createPost(
                posted_by,
                caption,
                mediaPaths,
                status,
            );

            res.status(201).json({
                success: true,
                message:
                    status === "reviewing"
                        ? "Post submitted and is pending review by moderators."
                        : "Post created successfully",
                id: postId,
                media: mediaPaths,
                status: status,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to create post" });
        }
    },
);

// --- LIKES ROUTES ---

// POST /posts/:id/like - Increment Like
router.post("/:id/like", authMiddleware, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        await updateLikeCount(postId, true);
        res.json({ success: true, message: "Post liked" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to like post" });
    }
});

// DELETE /posts/:id/like - Decrement Like
router.delete("/:id/like", authMiddleware, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        await updateLikeCount(postId, false);
        res.json({ success: true, message: "Post unliked" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to unlike post" });
    }
});

// GET /posts/:id - Fetch Single Post
router.get("/:id", async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await getPostById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found." });
        }

        // Security: Block users from viewing suspended OR reviewing posts
        if (post.status === "suspended" || post.status === "reviewing") {
            return res
                .status(403)
                .json({ error: "This post is currently unavailable." });
        }

        res.json({ success: true, data: post });
    } catch (error) {
        console.error("Failed to fetch single post:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- COMMENTS ROUTES ---

// GET /posts/:id/comments - Fetch Comments for a Post
router.get("/:id/comments", async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const comments = await getCommentsByPostId(postId);
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

// POST /posts/:id/comments - Create a Comment
// NEW: Inserted autoFlagMiddleware here to catch bad words!
router.post(
    "/:id/comments",
    authMiddleware,
    autoFlagMiddleware,
    async (req, res) => {
        try {
            const postId = parseInt(req.params.id);
            const commentBy = req.user.id;
            const { content } = req.body;

            // Provided by the middleware
            const status = req.body.status || "active";

            if (!content || content.trim() === "") {
                return res
                    .status(400)
                    .json({ error: "Comment content is required" });
            }

            // CRITICAL: Update addComment in your DAO to accept the 4th argument (status)
            const commentId = await addComment(
                postId,
                commentBy,
                content,
                status,
            );

            res.status(201).json({
                success: true,
                message:
                    status === "reviewing"
                        ? "Comment submitted and is pending review."
                        : "Comment added",
                id: commentId,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to add comment" });
        }
    },
);

// --- REPORT ROUTE ---
router.post("/:id/report", authMiddleware, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const reporterId = req.user.id;
        const { reason } = req.body;

        await createReport(reporterId, "post", postId, reason);

        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to submit report" });
    }
});

router.post("/comments/:id/report", authMiddleware, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id, 10);
        const reporterId = req.user.id; // Pulled from your auth token
        const { reason } = req.body;

        // 1. Basic validation
        if (!reason) {
            return res
                .status(400)
                .json({ error: "A report reason is required." });
        }

        if (isNaN(commentId)) {
            return res.status(400).json({ error: "Invalid comment ID." });
        }

        // 2. Save it to the database
        // Notice we explicitly pass "post_comment" as the entity type here!
        await createReport(reporterId, "post_comment", commentId, reason);

        // 3. Send success response back to the Vue modal
        res.status(201).json({
            success: true,
            message: "Report submitted successfully.",
        });
    } catch (error) {
        console.error("Failed to submit comment report:", error);
        res.status(500).json({
            error: "An internal server error occurred while reporting.",
        });
    }
});

module.exports = router;
