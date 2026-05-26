const router = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");

// Import all methods from your DAO
const {
    getPosts,
    createPost,
    updateLikeCount,
    getCommentsByPostId,
    addComment,
} = require("../dataaccess/postDAO");

// GET /posts - Feed

router.get("/", async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const rows = await getPosts(limit, offset, userId);
        const formattedPosts = rows.map((post) => {
            // Create a copy of the post object
            const formattedPost = { ...post };

            // Check if the images string exists (not null)
            if (formattedPost.images) {
                // Split the comma-separated string into a real JavaScript array
                formattedPost.images = formattedPost.images.split(",");
            } else {
                // If there are no images, return an empty array
                formattedPost.images = [];
            }

            return formattedPost;
        });
        res.status(200).json(formattedPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch the feed" });
    }
});

// POST /posts - Create Post
router.post("/", authMiddleware, async (req, res) => {
    const { caption } = req.body;
    const posted_by = req.user.id; // From your authMiddleware

    // TODO accept images or files

    try {
        const postId = await createPost(posted_by, caption);
        res.status(201).json({ message: "Post created", id: postId });
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
