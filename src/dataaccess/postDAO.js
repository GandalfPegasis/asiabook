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
                (
                    SELECT IFNULL(JSON_ARRAYAGG(location), JSON_ARRAY())
                    FROM post_picture 
                    WHERE post_id = p.id
                ) AS images
            FROM posts p
            JOIN profile prof ON p.posted_by = prof.id
            ORDER BY p.id DESC
        `);

        return result;
    } catch (err) {
        console.error("Error fetching posts:", err);
        throw err;
    }
};

module.exports = { getPostByProfileId, getPosts };
