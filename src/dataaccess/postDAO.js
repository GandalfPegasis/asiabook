const db = require("../database");

const getPostByProfileId = async (profileId) => {
    try {
        const [postResults] = await db.query(
            `SELECT 
                p.id AS post_id, 
                p.caption,
                
                -- Packages all matching picture locations into a single JSON array
                (
                    SELECT IFNULL(JSON_ARRAYAGG(location), JSON_ARRAY())
                    FROM post_picture 
                    WHERE post_id = p.id
                ) AS images

            FROM posts p
            WHERE p.posted_by = ?
            ORDER BY p.id DESC;`, // Highly recommend sorting newest to oldest!
            [profileId],
        );

        return postResults;
    } catch (error) {
        console.error("Error fetching posts by profile ID:", error);
        throw error;
    }
};

const getPostById = async (postId) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                p.id, 
                p.caption, 
                p.likes, 
                p.created_at, 
                p.status,
                u.name AS author_name, 
                u.role AS author_role
             FROM posts p
             JOIN profile u ON p.posted_by = u.id
             WHERE p.id = ?`,
            [postId],
        );

        // If a post is found, return the first row. Otherwise, return null.
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
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
                    
                    -- Returns an actual JSON array of strings, or an empty array if null
                    COALESCE(
                        (SELECT JSON_ARRAYAGG(pp.location) 
                        FROM post_picture pp 
                        WHERE pp.post_id = p.id), 
                        JSON_ARRAY()
                    ) AS images,
                    
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

async function createPost(posted_by, caption, mediaPaths) {
    // 1. Insert the main post
    const [postResult] = await db.query(
        `INSERT INTO posts (posted_by, caption) 
         VALUES (?, ?)`,
        [posted_by, caption],
    );

    const postId = postResult.insertId;

    // 2. If there are media files, bulk insert them into post_picture
    if (mediaPaths && mediaPaths.length > 0) {
        // Create an array of arrays for bulk insertion: [[postId, '/path1.png'], [postId, '/path2.mp4']]
        const pictureValues = mediaPaths.map((path) => [postId, path]);

        await db.query(
            `INSERT INTO post_picture (post_id, location) VALUES ?`,
            [pictureValues],
        );
    }

    return postId;
}
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
    getPostById,
};
