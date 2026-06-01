const router = require("express").Router();
const path = require("path");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");

// Import all methods from your DAO
const {
    getPosts,
    createPost, // Note: You'll need to update this DAO method to save file URLs!
    updateLikeCount,
    getCommentsByPostId,
    addComment,
    getPostById,
} = require("../dataaccess/postDAO");

// --- MULTER STORAGE CONFIGURATION ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Files will be saved in an 'uploads' directory. Ensure this folder exists.
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        // Generates a unique filename using a timestamp + random number
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
        fileSize: 50 * 1024 * 1024, // 50MB maximum limit to accommodate video uploads
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

            // 1. If the DB driver already parsed it into an array natively
            if (Array.isArray(post.images)) {
                parsedImages = post.images;
            }
            // 2. If the DB driver returned the JSON_ARRAYAGG as a string
            else if (typeof post.images === "string") {
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

// POST /posts - Create Post (Modified to accept files)
// 'media' is the form field key name your frontend must use. Max 5 files per post.
router.post("/", authMiddleware, upload.array("media", 5), async (req, res) => {
    const { caption } = req.body;
    const posted_by = req.user.id;

    try {
        // Collect relative web paths for all successfully uploaded files
        // e.g., ["/uploads/media-171523...png", "/uploads/media-171523...mp4"]
        const mediaPaths = req.files
            ? req.files.map((file) => `/uploads/${file.filename}`)
            : [];

        // CRITICAL: You must modify createPost in your DAO to accept this third argument
        // and stringify or pass it to your DB schema (e.g., JSON column or junction table)
        const postId = await createPost(posted_by, caption, mediaPaths);

        res.status(201).json({
            message: "Post created successfully",
            id: postId,
            media: mediaPaths,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create post" });
    }
});

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

router.get("/:id", async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await getPostById(postId);

        // 1. Check if the post actually exists
        if (!post) {
            return res.status(404).json({ error: "Post not found." });
        }

        // 2. Optional Security: Block users from viewing suspended posts
        if (post.status === "suspended") {
            return res
                .status(403)
                .json({ error: "This post has been removed by moderators." });
        }

        // 3. Send it back to Vue
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
router.post("/:id/comments", authMiddleware, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const commentBy = req.user.id;
        const { content } = req.body;

        if (!content || content.trim() === "") {
            return res
                .status(400)
                .json({ error: "Comment content is required" });
        }

        const commentId = await addComment(postId, commentBy, content);
        res.status(201).json({ message: "Comment added", id: commentId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add comment" });
    }
});

module.exports = router;
