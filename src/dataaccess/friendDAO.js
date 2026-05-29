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
            `SELECT DISTINCT profile.id, profile.name
             FROM friends
             JOIN profile ON (friends.profile_id_1 = profile.id OR friends.profile_id_2 = profile.id)
             WHERE (friends.profile_id_1 = ? OR friends.profile_id_2 = ?) AND profile.id != ?;`,
            [profileId, profileId, profileId],
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

// * SEARCH USERS
const searchUsers = async (query, currentUserId) => {
    try {
        const users = await db.query(
            `SELECT id, name, email
             FROM profile
             WHERE (name LIKE ? OR email LIKE ?) AND id != ?
             LIMIT 20;`,
            [`%${query}%`, `%${query}%`, currentUserId],
        );

        return users;
    } catch (error) {
        console.error("Error searching users:", error);
        throw error;
    }
};

// * ACCEPT FRIEND REQUEST
const acceptFriendRequest = async (requestId, userId) => {
    try {
        // First get the request details
        const [request] = await db.query(
            `SELECT requested_by, requested_to FROM friend_request WHERE id = ? AND requested_to = ?`,
            [requestId, userId],
        );

        if (request.length === 0) {
            throw new Error("Friend request not found or not authorized");
        }

        const { requested_by, requested_to } = request[0];

        // Add to friends table
        await db.query(
            `INSERT INTO friends (profile_id_1, profile_id_2) VALUES (?, ?)`,
            [requested_by, requested_to],
        );

        // Remove from friend_request
        await db.query(`DELETE FROM friend_request WHERE id = ?`, [requestId]);

        return { success: true };
    } catch (error) {
        console.error("Error accepting friend request:", error);
        throw error;
    }
};

// * DECLINE FRIEND REQUEST
const declineFriendRequest = async (requestId, userId) => {
    try {
        const result = await db.query(
            `DELETE FROM friend_request WHERE id = ? AND requested_to = ?`,
            [requestId, userId],
        );

        if (result[0].affectedRows === 0) {
            throw new Error("Friend request not found or not authorized");
        }

        return { success: true };
    } catch (error) {
        console.error("Error declining friend request:", error);
        throw error;
    }
};

// * FRIEND SUGGESTIONS
const getFriendSuggestions = async (userId) => {
    try {
        const suggestions = await db.query(
            `SELECT DISTINCT p.id, p.name
             FROM profile p
             WHERE p.id != ?
             AND p.id NOT IN (
                 SELECT profile_id_1 FROM friends WHERE profile_id_2 = ?
                 UNION
                 SELECT profile_id_2 FROM friends WHERE profile_id_1 = ?
             )
             AND p.id NOT IN (
                 SELECT requested_by FROM friend_request WHERE requested_to = ?
                 UNION
                 SELECT requested_to FROM friend_request WHERE requested_by = ?
             )
             ORDER BY RAND()
             LIMIT 10;`,
            [userId, userId, userId, userId, userId],
        );

        return suggestions;
    } catch (error) {
        console.error("Error fetching friend suggestions:", error);
        throw error;
    }
};

// * SEND FRIEND REQUEST
const sendFriendRequest = async (senderId, receiverId) => {
    try {
        // Check if they're not already friends and no pending request exists
        const existing = await db.query(
            `SELECT id FROM friends WHERE (profile_id_1 = ? AND profile_id_2 = ?) OR (profile_id_1 = ? AND profile_id_2 = ?)
             UNION
             SELECT id FROM friend_request WHERE (requested_by = ? AND requested_to = ?) OR (requested_by = ? AND requested_to = ?)`,
            [
                senderId,
                receiverId,
                receiverId,
                senderId,
                senderId,
                receiverId,
                receiverId,
                senderId,
            ],
        );

        if (existing[0].length > 0) {
            throw new Error(
                "Friend request already exists or users are already friends",
            );
        }

        await db.query(
            `INSERT INTO friend_request (requested_by, requested_to) VALUES (?, ?)`,
            [senderId, receiverId],
        );

        return { success: true };
    } catch (error) {
        console.error("Error sending friend request:", error);
        throw error;
    }
};

const getSentFriendRequest = async (userId) => {
    try {
        const friendRequests = await db.query(
            `
            SELECT 
                fr.id AS request_id,
                fr.requested_to,
                p.name AS receiver_name
            FROM friend_request fr
            JOIN profile p ON fr.requested_to = p.id
            WHERE fr.requested_by = ?`,
            [userId],
        );

        return friendRequests;
    } catch (error) {
        console.error("Error get sent friend request:", error);
        throw error;
    }
};

const cancelFriendRequest = async (id, senderId) => {
    try {
        const friendRequests = await db.query(
            `DELETE FROM friend_request 
            WHERE id = ? AND requested_by = ?`,
            [id, senderId],
        );

        return friendRequests;
    } catch (error) {
        console.error("error canceling friend request:", error);
        throw error;
    }
};

module.exports = {
    getFriendRequestByProfileId,
    getFriendsByProfileId,
    getRequestCount,
    searchUsers,
    acceptFriendRequest,
    declineFriendRequest,
    getFriendSuggestions,
    sendFriendRequest,
    getSentFriendRequest,
    cancelFriendRequest,
};
