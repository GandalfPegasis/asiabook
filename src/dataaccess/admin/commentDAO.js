// dataaccess/commentDAO.js
const db = require("../../database");

// Fetch all active comments for a specific post
const getCommentsByPostId = async (postId) => {
    try {
        const [comments] = await db.query(
            `SELECT 
                c.id, 
                c.content, 
                c.created_at, 
                u.name AS author_name, 
                u.role AS author_role
             FROM comment_post c
             JOIN profile u ON c.comment_by = u.id
             WHERE c.post_id = ? AND c.status = 'active'
             ORDER BY c.created_at ASC`, // Oldest comments first (standard social media style)
            [postId],
        );
        return comments;
    } catch (e) {
        throw e;
    }
};

// Insert a new comment
const createComment = async (postId, userId, content, status = "active") => {
    try {
        const [result] = await db.query(
            `INSERT INTO comment_post (post_id, comment_by, content, status) VALUES (?, ?, ?, ?)`,
            [postId, userId, content, status],
        );
        return { id: result.insertId, status: status };
    } catch (e) {
        throw e;
    }
};

module.exports = { getCommentsByPostId, createComment };
