const db = require("../database");

// Ensure votes infrastructure exists (best-effort)
const ensureVotesTables = async () => {
    try {
        await db.query(
            `ALTER TABLE forum ADD COLUMN IF NOT EXISTS votes INT NOT NULL DEFAULT 0;`,
        );
    } catch (e) {
        // ignore
    }

    try {
        await db.query(
            `ALTER TABLE forum_reply ADD COLUMN IF NOT EXISTS votes INT NOT NULL DEFAULT 0;`,
        );
    } catch (e) {
        // ignore
    }

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS forum_votes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                forum_id INT NOT NULL,
                user_id INT NOT NULL,
                vote TINYINT NOT NULL,
                UNIQUE KEY uq_forum_user (forum_id, user_id),
                FOREIGN KEY (forum_id) REFERENCES forum(id) ON DELETE CASCADE
            );
        `);
    } catch (e) {
        // ignore
    }

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS forum_reply_votes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                reply_id INT NOT NULL,
                user_id INT NOT NULL,
                vote TINYINT NOT NULL,
                UNIQUE KEY uq_reply_user (reply_id, user_id),
                FOREIGN KEY (reply_id) REFERENCES forum_reply(id) ON DELETE CASCADE
            );
        `);
    } catch (e) {
        // ignore
    }
};

// Ensure club_id column exists on forum for filtering (best-effort)
const ensureClubColumn = async () => {
    try {
        await db.query(
            `ALTER TABLE forum ADD COLUMN IF NOT EXISTS club_id INT NULL;`,
        );
    } catch (e) {
        // ignore
    }
};

ensureClubColumn();
ensureVotesTables();

const getForums = async (opts = {}) => {
    // opts: { userId, clubId }
    const { userId = null, clubId = null } = opts;
    try {
        const params = [];

        // 1. Base filter: Always exclude suspended forums
        let whereClause = "WHERE f.status != 'suspended'";

        // 2. Add club filter if provided
        if (clubId) {
            whereClause += " AND f.club_id = ?";
            params.push(clubId);
        }

        const joinUserVote = userId
            ? `LEFT JOIN forum_votes fv ON fv.forum_id = f.id AND fv.user_id = ?`
            : "";
        if (userId) params.unshift(userId);

        // NEW: Added p.avatar AS author_avatar
        const sql = `SELECT f.id, f.title, f.description, f.status, f.post_by AS author_id, p.name AS author_name, p.avatar AS author_avatar, p.role AS author_role, f.votes,
                          (SELECT COUNT(*) FROM forum_reply fr WHERE fr.forum_id = f.id) AS reply_count,
                          ${userId ? "COALESCE(fv.vote, 0) AS user_vote," : ""} f.club_id
                         FROM forum f
                         JOIN profile p ON f.post_by = p.id
                         ${joinUserVote}
                         ${whereClause}
                         ORDER BY f.id DESC;`;

        const [forums] = await db.query(sql, params);
        return forums;
    } catch (err) {
        console.error("error fetching forums:", err);
        throw err;
    }
};

const getForumById = async (forumId, userId = null) => {
    try {
        const params = [forumId];
        let joinUserVote = "";
        if (userId) {
            joinUserVote =
                "LEFT JOIN forum_votes fv ON fv.forum_id = forum.id AND fv.user_id = ?";
            params.unshift(userId);
        }

        // NEW: Added profile.avatar AS author_avatar
        const sql = `SELECT forum.id, forum.title, forum.description, forum.status, forum.post_by AS author_id, profile.id AS author_id_profile, profile.name AS author_name, profile.avatar AS author_avatar, forum.votes${userId ? ", COALESCE(fv.vote,0) AS user_vote" : ""}
                         FROM forum
                         JOIN profile ON forum.post_by = profile.id
                         ${joinUserVote}
                         WHERE forum.id = ? AND forum.status != 'suspended';`;

        const [forumResults] = await db.query(sql, params);
        return forumResults[0] || null;
    } catch (error) {
        console.error("Error fetching forum by ID:", error);
        throw error;
    }
};

// * FORUM REPLIES

const getRepliesByForumId = async (forumId, userId = null) => {
    try {
        const params = [forumId];
        let joinUserVote = "";
        if (userId) {
            joinUserVote =
                "LEFT JOIN forum_reply_votes frv ON frv.reply_id = forum_reply.id AND frv.user_id = ?";
            params.unshift(userId);
        }

        // NEW: Added profile.avatar AS replier_avatar
        const sql = `SELECT forum_reply.id, forum_reply.content AS content, forum_reply.reply_of, profile.name AS replier_name, profile.avatar AS replier_avatar, forum_reply.post_by, forum_reply.votes${userId ? ", COALESCE(frv.vote,0) AS user_vote" : ""}
                     FROM forum_reply
                     JOIN profile ON forum_reply.post_by = profile.id
                     ${joinUserVote}
                     WHERE forum_reply.forum_id = ?
                     ORDER BY forum_reply.id ASC;`;

        const [rows] = await db.query(sql, params);

        const replyMap = {};
        const topLevelReplies = [];

        rows.forEach((reply) => {
            replyMap[reply.id] = { ...reply, children: [] };
        });

        rows.forEach((reply) => {
            if (reply.reply_of === null) {
                topLevelReplies.push(replyMap[reply.id]);
            } else if (replyMap[reply.reply_of]) {
                replyMap[reply.reply_of].children.push(replyMap[reply.id]);
            }
        });

        return topLevelReplies;
    } catch (error) {
        console.error("Error fetching replies by forum ID:", error);
        throw error;
    }
};

const createForum = async (title, post_by, description, club_id = null) => {
    try {
        const [result] = await db.query(
            `INSERT INTO forum (title, post_by, description, club_id) VALUES (?, ?, ?, ?);`,
            [title, post_by, description, club_id],
        );

        return { id: result.insertId };
    } catch (error) {
        console.error("Error creating forum:", error);
        throw error;
    }
};

const createReply = async (forum_id, post_by, reply_of, content) => {
    try {
        const [result] = await db.query(
            `INSERT INTO forum_reply (forum_id, post_by, reply_of, content) VALUES (?, ?, ?, ?);`,
            [forum_id, post_by, reply_of || null, content],
        );

        return { id: result.insertId };
    } catch (error) {
        console.error("Error creating forum reply:", error);
        throw error;
    }
};

const upvoteForum = async (forumId, delta = 1) => {
    try {
        await db.query(
            `UPDATE forum SET votes = GREATEST(0, votes + ?) WHERE id = ?;`,
            [delta, forumId],
        );
        const [rows] = await db.query(`SELECT votes FROM forum WHERE id = ?;`, [
            forumId,
        ]);
        return rows[0] ? rows[0].votes : null;
    } catch (error) {
        console.error("Error updating forum votes:", error);
        throw error;
    }
};

const upvoteReply = async (replyId, delta = 1) => {
    try {
        await db.query(
            `UPDATE forum_reply SET votes = GREATEST(0, votes + ?) WHERE id = ?;`,
            [delta, replyId],
        );
        const [rows] = await db.query(
            `SELECT votes FROM forum_reply WHERE id = ?;`,
            [replyId],
        );
        return rows[0] ? rows[0].votes : null;
    } catch (error) {
        console.error("Error updating reply votes:", error);
        throw error;
    }
};

const voteForum = async (userId, forumId, vote) => {
    // vote: 1 or -1
    const normalizedVote = vote > 0 ? 1 : -1;
    try {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const [existingRows] = await conn.query(
                `SELECT vote FROM forum_votes WHERE forum_id = ? AND user_id = ?`,
                [forumId, userId],
            );
            const existing = existingRows[0] ? existingRows[0].vote : null;

            if (existing === null || existing === undefined) {
                await conn.query(
                    `INSERT INTO forum_votes (forum_id, user_id, vote) VALUES (?, ?, ?)`,
                    [forumId, userId, normalizedVote],
                );
            } else if (existing === normalizedVote) {
                // toggle off
                await conn.query(
                    `DELETE FROM forum_votes WHERE forum_id = ? AND user_id = ?`,
                    [forumId, userId],
                );
            } else {
                // change vote (e.g. +1 straight to -1)
                await conn.query(
                    `UPDATE forum_votes SET vote = ? WHERE forum_id = ? AND user_id = ?`,
                    [normalizedVote, forumId, userId],
                );
            }

            const [voteTotals] = await conn.query(
                `SELECT COALESCE(SUM(vote), 0) AS votes FROM forum_votes WHERE forum_id = ?`,
                [forumId],
            );
            const totalVotes = Math.max(0, voteTotals[0].votes);
            await conn.query(`UPDATE forum SET votes = ? WHERE id = ?`, [
                totalVotes,
                forumId,
            ]);
            const [rows2] = await conn.query(
                `SELECT votes FROM forum WHERE id = ?`,
                [forumId],
            );
            const [uv] = await conn.query(
                `SELECT vote FROM forum_votes WHERE forum_id = ? AND user_id = ?`,
                [forumId, userId],
            );
            await conn.commit();
            conn.release();
            return {
                votes: rows2[0] ? rows2[0].votes : null,
                user_vote: uv[0] ? uv[0].vote : 0,
            };
        } catch (e) {
            await conn.rollback();
            conn.release();
            throw e;
        }
    } catch (error) {
        console.error("Error voting forum:", error);
        throw error;
    }
};

const voteReply = async (userId, replyId, vote) => {
    const normalizedVote = vote > 0 ? 1 : -1;
    try {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const [existingRows] = await conn.query(
                `SELECT vote FROM forum_reply_votes WHERE reply_id = ? AND user_id = ?`,
                [replyId, userId],
            );
            const existing = existingRows[0] ? existingRows[0].vote : null;

            if (existing === null || existing === undefined) {
                await conn.query(
                    `INSERT INTO forum_reply_votes (reply_id, user_id, vote) VALUES (?, ?, ?)`,
                    [replyId, userId, normalizedVote],
                );
            } else if (existing === normalizedVote) {
                // toggle off
                await conn.query(
                    `DELETE FROM forum_reply_votes WHERE reply_id = ? AND user_id = ?`,
                    [replyId, userId],
                );
            } else {
                // change vote
                await conn.query(
                    `UPDATE forum_reply_votes SET vote = ? WHERE reply_id = ? AND user_id = ?`,
                    [normalizedVote, replyId, userId],
                );
            }

            const [voteTotals] = await conn.query(
                `SELECT COALESCE(SUM(vote), 0) AS votes FROM forum_reply_votes WHERE reply_id = ?`,
                [replyId],
            );
            const totalVotes = Math.max(0, voteTotals[0].votes);
            await conn.query(`UPDATE forum_reply SET votes = ? WHERE id = ?`, [
                totalVotes,
                replyId,
            ]);
            const [rows2] = await conn.query(
                `SELECT votes FROM forum_reply WHERE id = ?`,
                [replyId],
            );
            const [uv] = await conn.query(
                `SELECT vote FROM forum_reply_votes WHERE reply_id = ? AND user_id = ?`,
                [replyId, userId],
            );
            await conn.commit();
            conn.release();
            return {
                votes: rows2[0] ? rows2[0].votes : null,
                user_vote: uv[0] ? uv[0].vote : 0,
            };
        } catch (e) {
            await conn.rollback();
            conn.release();
            throw e;
        }
    } catch (error) {
        console.error("Error voting reply:", error);
        throw error;
    }
};

module.exports = {
    getForums,
    getForumById,
    getRepliesByForumId,
    createForum,
    createReply,
    voteForum,
    voteReply,
};
