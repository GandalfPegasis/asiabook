const db = require("../database");

const getProfileById = async (profileId) => {
    try {
        const [profileResults] = await db.query(
            "SELECT * FROM profile WHERE id = ?",
            [profileId],
        );

        return profileResults;
    } catch (error) {
        console.error("Error fetching profile by ID:", error);
        throw error;
    }
};

const isUserSuspended = async (profileId) => {
    try {
        const [result] = await db.query(
            `SELECT * FROM profile WHERE id = ? AND status = 'suspended'`,
            [profileId],
        );

        if (result.length) {
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error isUserSuspended:", error);
        throw error;
    }
};

const updateProfile = async (profileId, profileData) => {
    try {
        const profileResults = await db.query(
            `UPDATE profile
            SET 
                name = ?,
                email = ?,
                birth_date = ?,
                nationality = ?,
                role = ?,
                department = ?,
                language = ?,
                contact_number = ?
            WHERE id = ?;`,
            [
                profileData.name,
                profileData.email,
                profileData.birth_date,
                profileData.nationality,
                profileData.role,
                profileData.department,
                profileData.language,
                profileData.contact_info,
                profileId,
            ],
        );

        return profileResults;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};

const getUserClubs = async (userId) => {
    const [clubs] = await db.query(
        `
        SELECT c.id, c.title 
        FROM clubs c
        JOIN club_members cm ON c.id = cm.club_id
        WHERE cm.profile_id = ? AND c.status = 'active'
        ORDER BY c.title ASC
    `,
        [userId],
    );

    return clubs;
};

// 2. Fetch User's Forum Activity (Threads started + Replies made)
const getUserForumActivity = async (userId) => {
    // We use UNION to combine threads they started AND replies they made into one timeline
    const [activity] = await db.query(
        `
        SELECT 
            id, 
            id AS forum_id, 
            title AS thread_title, 
            description AS content, 
            created_at 
        FROM forum 
        WHERE post_by = ? AND status != 'suspended'
        
        UNION ALL
        
        SELECT 
            fr.id, 
            fr.forum_id, 
            f.title AS thread_title, 
            fr.content, 
            fr.created_at 
        FROM forum_reply fr
        JOIN forum f ON fr.forum_id = f.id
        WHERE fr.post_by = ? AND f.status != 'suspended'
        
        ORDER BY created_at DESC
        LIMIT 15
    `,
        [userId, userId],
    );

    return activity;
};

module.exports = {
    getProfileById,
    updateProfile,
    isUserSuspended,
    getUserForumActivity,
    getUserClubs,
};
