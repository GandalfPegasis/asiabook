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

const getPosts = async (limit, offset, userId) => {
    try {
        let sql = "";
        let queryParams = [];

        if (!userId) {
            sql = `
                SELECT 
                    p.id AS post_id,
                    p.caption,
                    prof.name AS author_name,
                    p.likes,
                    GROUP_CONCAT(DISTINCT pp.location SEPARATOR ',') AS images,
                    COUNT(DISTINCT cp.id) AS comment_count,
                    p.created_at,
                    
                    -- Pure Trending Score (No Friend Bonus)
                    (
                        (p.likes + (COUNT(DISTINCT cp.id) * 3)) 
                        / 
                        POWER(TIMESTAMPDIFF(HOUR, p.created_at, NOW()) + 2, 1.5)
                    ) AS feed_score

                FROM posts p
                JOIN profile prof ON p.posted_by = prof.id
                LEFT JOIN post_picture pp ON p.id = pp.post_id
                LEFT JOIN post_comments cp ON p.id = cp.post_id
                
                GROUP BY p.id, p.caption, prof.name, p.likes, p.created_at
                ORDER BY feed_score DESC
                LIMIT ? OFFSET ?;
            `;
            // Only pass limit and offset
            queryParams = [limit, offset];
        } else {
            sql = `
                SELECT 
                    p.id AS post_id,
                    p.caption,
                    prof.name AS author_name,
                    p.likes,
                    GROUP_CONCAT(DISTINCT pp.location SEPARATOR ',') AS images,
                    COUNT(DISTINCT cp.id) AS comment_count,
                    p.created_at,

                    -- Score INCLUDING the 50-point Friend Bonus
                    (
                        (p.likes + (COUNT(DISTINCT cp.id) * 3) + IF(f.id IS NOT NULL, 50, 0)) 
                        / 
                        POWER(TIMESTAMPDIFF(HOUR, p.created_at, NOW()) + 2, 1.5)
                    ) AS feed_score

                FROM posts p
                JOIN profile prof ON p.posted_by = prof.id
                LEFT JOIN post_picture pp ON p.id = pp.post_id
                LEFT JOIN post_comments cp ON p.id = cp.post_id
                
                -- Join friends table using the logged-in User ID
                LEFT JOIN friends f ON 
                    (f.profile_id_1 = ? AND f.profile_id_2 = p.posted_by) OR 
                    (f.profile_id_1 = p.posted_by AND f.profile_id_2 = ?)

                GROUP BY p.id, p.caption, prof.name, p.likes, p.created_at, f.id
                ORDER BY feed_score DESC
                LIMIT ? OFFSET ?;
            `;
            // Pass the userId twice (for the OR condition), then limit and offset
            queryParams = [userId, userId, limit, offset];
        }

        const [result] = await db.query(sql, queryParams);

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
