const db = require("../database");

const getProfileById = async (profileId) => {
    try {
        const profileResults = await db.query(
            "SELECT * FROM profile WHERE id = ?",
            [profileId],
        );

        return profileResults;
    } catch (error) {
        console.error("Error fetching profile by ID:", error);
        throw error;
    }
};

module.exports = { getProfileById };
