const db = require("../database");

const createClubRequest = async (userId, title, description) => {
    try {
        const [result] = await db.query(
            `INSERT INTO club_requests (requested_by, title, description) 
             VALUES (?, ?, ?)`,
            [userId, title, description],
        );
        return result.insertId;
    } catch (error) {
        console.error("Error creating club request:", error);
        throw error;
    }
};

module.exports = {
    createClubRequest,
};
