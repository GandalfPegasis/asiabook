const db = require("../database");

// 1. GET POSTS BY PROFILE ID (Updated to include author details and avatars)
const getPostByProfileId = async (profileId) => {
    try {
        const [postResults] = await db.query(
            `SELECT 
                p.id AS post_id, 
                p.caption,
                prof.name AS author_name,
                prof.avatar AS author_avatar, -- NEW: Added profile avatar
                
                -- Packages all matching picture locations into a single JSON array
                (
                    SELECT IFNULL(JSON_ARRAYAGG(location), JSON_ARRAY())
                    FROM post_picture 
                    WHERE post_id = p.id
                ) AS images

            FROM posts p
            JOIN profile prof ON p.posted_by = prof.id -- NEW: Joined profile
            WHERE p.posted_by = ?
            ORDER BY p.id DESC;`,
            [profileId],
        );

        return postResults;
    } catch (error) {
        console.error("Error fetching posts by profile ID:", error);
        throw error;
    }
};

// 2. GET SINGLE POST BY ID
const getPostById = async (postId) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                p.id, 
                p.caption, 
                p.likes, 
                p.created_at, 
                p.status,
                u.avatar AS author_avatar, -- FIXED: Changed from p.avatar to u.avatar
                u.name AS author_name, 
                u.role AS author_role
             FROM posts p
             JOIN profile u ON p.posted_by = u.id
             WHERE p.id = ?`,
            [postId],
        );

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        throw error;
    }
};

// 3. GET GLOBAL FEED POSTS
const getPosts = async (limit, offset, userId) => {
    try {
        let sql = "";
        let queryParams = [];

        if (!userId) {
            sql = `
                SELECT 
                    p.id AS post_id,
                    p.caption,
                    prof.id AS author_id,
                    prof.name AS author_name,
                    p.likes,
                    prof.avatar AS author_avatar,
                    role,
                    COALESCE(
                        (SELECT JSON_ARRAYAGG(pp.location) 
                        FROM post_picture pp 
                        WHERE pp.post_id = p.id), 
                        JSON_ARRAY()
                    ) AS images,
                    
                    COUNT(DISTINCT cp.id) AS comment_count,
                    p.created_at

                FROM posts p
                JOIN profile prof ON p.posted_by = prof.id
                LEFT JOIN post_comments cp ON p.id = cp.post_id

                GROUP BY p.id, p.caption, prof.name, p.likes, p.created_at, prof.avatar
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?;
            `;
            queryParams = [limit, offset];
        } else {
            sql = `
                SELECT 
                    p.id AS post_id,
                    p.caption,
                    prof.id AS author_id,
                    prof.name AS author_name,
                    p.likes,
                    role,
                    prof.avatar AS author_avatar,
                    GROUP_CONCAT(DISTINCT pp.location SEPARATOR ',') AS images,
                    COUNT(DISTINCT cp.id) AS comment_count,
                    p.created_at,
                    IF(f.id IS NOT NULL, true, false) AS is_friend

                FROM posts p
                JOIN profile prof ON p.posted_by = prof.id
                LEFT JOIN post_picture pp ON p.id = pp.post_id
                LEFT JOIN post_comments cp ON p.id = cp.post_id
                
                LEFT JOIN friends f ON 
                    (f.profile_id_1 = ? AND f.profile_id_2 = p.posted_by) OR 
                    (f.profile_id_1 = p.posted_by AND f.profile_id_2 = ?)

                GROUP BY p.id, p.caption, prof.name, p.likes, p.created_at, f.id, prof.avatar
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?;
            `;
            queryParams = [userId, userId, limit, offset];
        }

        const [result] = await db.query(sql, queryParams);
        return result;
    } catch (err) {
        console.error("Error fetching posts:", err);
        throw err;
    }
};

// 4. CREATE NEW POST
async function createPost(posted_by, caption, mediaPaths) {
    const [postResult] = await db.query(
        `INSERT INTO posts (posted_by, caption) VALUES (?, ?)`,
        [posted_by, caption],
    );

    const postId = postResult.insertId;

    if (mediaPaths && mediaPaths.length > 0) {
        const pictureValues = mediaPaths.map((path) => [postId, path]);
        await db.query(
            `INSERT INTO post_picture (post_id, location) VALUES ?`,
            [pictureValues],
        );
    }

    return postId;
}

// 5. UPDATE LIKES
const updateLikeCount = async (postId, increment) => {
    try {
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

// 6. GET POST COMMENTS
const getCommentsByPostId = async (postId) => {
    const [rows] = await db.query(
        `
        SELECT 
            c.id, c.content, c.created_at, 
            p.name AS author_name, 
            p.role AS author_role,
            p.avatar AS author_avatar
        FROM post_comments c
        JOIN profile p ON c.comment_by = p.id
        WHERE c.post_id = ? AND c.status != 'suspended'
        ORDER BY c.created_at ASC
    `,
        [postId],
    );
    return rows;
};

// 7. ADD COMMENT
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
    getPostById,
};
