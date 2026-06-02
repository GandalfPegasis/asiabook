const db = require("../../database");

// --- POST MODERATION ---

const getFlaggedPosts = async (offset, LIMIT) => {
    let baseQuery = `
        FROM posts p
        JOIN profile u ON p.posted_by = u.id
        LEFT JOIN report r ON r.entity_id = p.id AND r.entity_type = 'post'
        WHERE p.status IN ('reviewing', 'suspended') OR r.status = 'pending'
        GROUP BY p.id
    `;

    const [[countResult]] = await db.query(
        `SELECT COUNT(DISTINCT p.id) as totalCount ` + baseQuery,
    );

    const [data] = await db.query(
        `
        SELECT 
            p.id, p.caption, p.status, p.created_at,
            u.name AS author_name, u.email AS author_email,
            COUNT(r.id) AS report_count,
            IF(COUNT(r.id) > 0, JSON_ARRAYAGG(JSON_OBJECT('id', r.id, 'reason', r.reason)), JSON_ARRAY()) AS reports
        ` +
            baseQuery +
            `
        ORDER BY report_count DESC, p.created_at DESC
        LIMIT ?, ?
    `,
        [offset, LIMIT],
    );

    return { data, totalCount: countResult?.totalCount || 0 };
};

const setPostStatus = async (postId, status) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`UPDATE posts SET status = ? WHERE id = ?`, [
            status,
            postId,
        ]);
        await conn.query(
            `UPDATE report SET status = 'reviewed' WHERE entity_type = 'post' AND entity_id = ?`,
            [postId],
        );
        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
};

const dismissPostReports = async (postId) => {
    await db.query(
        `UPDATE report SET status = 'dismissed' WHERE entity_type = 'post' AND entity_id = ?`,
        [postId],
    );
};

const deletePost = async (postId) => {
    await db.query(`DELETE FROM posts WHERE id = ?`, [postId]);
};

// --- COMMENT MODERATION ---

const getFlaggedComments = async (offset, LIMIT) => {
    let baseQuery = `
        FROM post_comments c
        JOIN profile u ON c.comment_by = u.id
        LEFT JOIN report r ON r.entity_id = c.id AND r.entity_type = 'post_comment'
        WHERE c.status IN ('reviewing', 'suspended') OR r.status = 'pending'
        GROUP BY c.id
    `;

    const [[countResult]] = await db.query(
        `SELECT COUNT(DISTINCT c.id) as totalCount ` + baseQuery,
    );

    const [data] = await db.query(
        `
        SELECT 
            c.id, c.content, c.status, c.created_at, c.post_id,
            u.name AS author_name, u.email AS author_email,
            COUNT(r.id) AS report_count,
            IF(COUNT(r.id) > 0, JSON_ARRAYAGG(JSON_OBJECT('id', r.id, 'reason', r.reason)), JSON_ARRAY()) AS reports
        ` +
            baseQuery +
            `
        ORDER BY report_count DESC, c.created_at DESC
        LIMIT ?, ?
    `,
        [offset, LIMIT],
    );

    return { data, totalCount: countResult?.totalCount || 0 };
};

const setCommentStatus = async (commentId, status) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`UPDATE post_comments SET status = ? WHERE id = ?`, [
            status,
            commentId,
        ]);
        await conn.query(
            `UPDATE report SET status = 'reviewed' WHERE entity_type = 'post_comment' AND entity_id = ?`,
            [commentId],
        );
        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
};

const dismissCommentReports = async (commentId) => {
    await db.query(
        `UPDATE report SET status = 'dismissed' WHERE entity_type = 'post_comment' AND entity_id = ?`,
        [commentId],
    );
};

const deleteComment = async (commentId) => {
    await db.query(`DELETE FROM post_comments WHERE id = ?`, [commentId]);
};

const createReport = async (reporterId, entityType, entityId, reason) => {
    try {
        const [result] = await db.query(
            `INSERT INTO report (reporter_id, entity_type, entity_id, reason, status) 
             VALUES (?, ?, ?, ?, 'pending')`,
            [reporterId, entityType, entityId, reason],
        );

        return result.insertId;
    } catch (error) {
        console.error("Error creating report:", error);
        throw error; // Let the router catch and handle this error
    }
};

module.exports = {
    getFlaggedPosts,
    setPostStatus,
    dismissPostReports,
    deletePost,
    getFlaggedComments,
    setCommentStatus,
    dismissCommentReports,
    deleteComment,
    createReport,
};
