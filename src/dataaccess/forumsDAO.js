const db = require("../database");

const getFormById = async (forumId) => {
    try {
        const [forumResults] = await db.query(
            `SELECT forum.id, forum.title, forum.description, profile.name AS author_name
            FROM forum
            JOIN profile ON forum.post_by = profile.id
            WHERE forum.id = ?;`,
            [forumId],
        );

        return forumResults;
    } catch (error) {
        console.error("Error fetching forum by ID:", error);
        throw error;
    }
};

// * FORUM REPLIES

const getRepliesByForumId = async (forumId) => {
    try {
        const replyResults = await db.query(
            `SELECT forum_reply.id, forum_reply.content AS content, forum_reply.reply_of, profile.name AS replier_name
             FROM forum_reply
             JOIN profile ON forum_reply.post_by = profile.id
             WHERE forum_reply.forum_id = ?
             ORDER BY forum_reply.id ASC;`, // Order by oldest to newest
            [forumId],
        );

        return replyResults;
    } catch (error) {
        console.error("Error fetching replies by forum ID:", error);
        throw error;
    }
};

module.exports = {
    getFormById,
    getRepliesByForumId,
};
