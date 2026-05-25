const db = require("../database");

const getPostByProfileId = async (profileId) => {
    try {
        const [postResults] = await db.query(
            `SELECT posts.id as post_id, post_picture.location, posts.caption
            FROM posts
            LEFT JOIN post_picture ON post_picture.post_id = posts.id
            WHERE posts.posted_by = ?;`,
            [profileId],
        );
        return postResults;
    } catch (error) {
        console.error("Error fetching posts by profile ID:", error);
        throw error;
    }
};

const getPosts = async () => {
    try {
        const [result] = await db.query(`
            SELECT 
                p.id, 
                p.caption, 
                IFNULL(p.likes, 0) AS likes,
                prof.name AS author, 
                prof.role,
                (
                    SELECT IFNULL(JSON_ARRAYAGG(location), JSON_ARRAY())
                    FROM post_picture 
                    WHERE post_id = p.id
                ) AS images,
                (
                    SELECT COUNT(*) 
                    FROM post_comments pc 
                    WHERE pc.post_id = p.id
                ) AS comments
            FROM posts p
            JOIN profile prof ON p.posted_by = prof.id
            LEFT JOIN post_picture pp ON pp.post_id = p.id
            GROUP BY p.id, prof.name, prof.role
            ORDER BY p.id DESC;
        `);

        return result;
    } catch (err) {
        console.error("Error fetching posts:", err);
        throw err;
    }
};

const createPost = async (posted_by, caption) => {
    try {
        // Explicitly set likes to 0 when creating a post
        const sql =
            "INSERT INTO posts (posted_by, caption, likes) VALUES (?, ?, 0)";
        const [result] = await db.query(sql, [posted_by, caption]);
        return result.insertId;
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
};

// --- NEW LIKES METHODS ---
const updateLikeCount = async (postId, increment) => {
    try {
        // IFNULL prevents errors if previous posts have NULL in the likes column
        const query = increment
            ? `UPDATE posts SET likes = IFNULL(likes, 0) + 1 WHERE id = ?`
            : `UPDATE posts SET likes = GREATEST(IFNULL(likes, 0) - 1, 0) WHERE id = ?`;

        const [result] = await db.query(query, [postId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error updating likes:", error);
        throw error;
    }
};

// --- NEW COMMENTS METHODS ---
const getCommentsByPostId = async (postId) => {
    try {
        const [rows] = await db.query(
            `
            SELECT pc.id, pc.content, pr.name AS comment_by_name
            FROM post_comments pc
            JOIN profile pr ON pc.comment_by = pr.id
            WHERE pc.post_id = ?
            ORDER BY pc.id ASC
        `,
            [postId],
        );
        return rows;
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
};

const addComment = async (postId, commentBy, content) => {
    try {
        const sql =
            "INSERT INTO post_comments (post_id, comment_by, content) VALUES (?, ?, ?)";
        const [result] = await db.query(sql, [postId, commentBy, content]);
        return result.insertId;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

module.exports = {
    getPostByProfileId,
    getPosts,
    createPost,
    updateLikeCount,
    getCommentsByPostId,
    addComment,
};
