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
            // todo - this query is not correct, it only counts the number of friends but does not return the friend details
            `SELECT profile.name, profile.id
             FROM friends
             JOIN profile ON friends.profile_id_1 = profile.id
             WHERE friends.profile_id_1 = ? OR friends.profile_id_2 = ?;`,
            [profileId, profileId],
        );

        return friends;
    } catch (error) {
        console.error("Error fetching friends by profile ID:", error);
        throw error;
    }
};

const getRequestCount = async (profileId) => {
    try {
        const [friends] = await db.query(
            `SELECT count(id) as friend_request
            FROM friend_request
            WHERE requested_to = ?;`,
            [profileId],
        );

        return friends;
    } catch (error) {
        console.error("Error fetching getRequestCount:", error);
        throw error;
    }
};

module.exports = { getProfileById, getFriendsByProfileId, getRequestCount };
