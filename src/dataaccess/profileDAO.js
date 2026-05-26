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
                contact_info = ?
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

module.exports = { getProfileById, updateProfile };
