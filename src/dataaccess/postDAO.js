const db = require("../database");

const getPostByProfileId = async (profileId) => {
    try {
        const postResults = await db.query(
            `SELECT post_picture.location, posts.caption
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

module.exports = { getPostByProfileId };
