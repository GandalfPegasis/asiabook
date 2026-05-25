const db = require("../database");

const getPostByProfileId = async (profileId) => {
    try {
        const postResults = await db.query(
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
                prof.name AS author, 
                prof.role,
                IF(
                    COUNT(pp.location) > 0, 
                    CONCAT('[', GROUP_CONCAT(CONCAT('"', pp.location, '"')), ']'), 
                    '[]'
                ) AS images
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

module.exports = { getPostByProfileId, getPosts };
