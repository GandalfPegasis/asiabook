const db = require("../database");

const getFriendRequestByProfileId = async (profileId) => {
    try {
        const requests = await db.query(
            `SELECT friend_request.id AS request_id, profile.name AS sender_name, profile.id AS sender_id
             FROM friend_request
             JOIN profile ON friend_request.requested_by = profile.id
             WHERE friend_request.requested_to = ?;`,
            [profileId],
        );

        return requests;
    } catch (error) {
        console.error("Error fetching friend requests by profile ID:", error);
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

module.exports = {
    getFriendRequestByProfileId,
    getFriendsByProfileId,
    getRequestCount,
};
