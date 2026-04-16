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

// * FRIENDS
const getFriendsByProfileId = async (profileId) => {
    try {
        const friends = await db.query(
            `SELECT profile.name, profile.id
             FROM friends
             JOIN profile ON friends.profile_id_2 = profile.id
             WHERE friends.profile_id_1 = ? OR friends.profile_id_2 = ?;`,
            [profileId, profileId],
        );

        return friends;
    } catch (error) {
        console.error("Error fetching friends by profile ID:", error);
        throw error;
    }
};

module.exports = { getProfileById, getFriendsByProfileId };
