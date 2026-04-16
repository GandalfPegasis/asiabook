const db = require("../database");

const getFriendsRequestsByProfileId = async (profileId) => {
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

module.exports = { getFriendsRequestsByProfileId };
