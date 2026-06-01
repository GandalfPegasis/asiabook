const db = require("../database");

async function createReport(reporterId, entityType, entityId, reason) {
    // entityType must match your ENUM: 'post', 'post_comment', 'user', 'forum', 'forum_comment', 'club'
    const [result] = await db.query(
        `INSERT INTO report (reporter_id, entity_type, entity_id, reason) 
         VALUES (?, ?, ?, ?)`,
        [reporterId, entityType, entityId, reason],
    );
    return result.insertId;
}

module.exports = { createReport };
