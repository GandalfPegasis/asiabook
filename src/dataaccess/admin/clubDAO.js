const db = require("../../database");

const getClubs = async (search, status) => {
    try {
        // Start with the base query. (1=1 is a trick to make appending "AND" easier)
        let baseQuery = `
            SELECT 
                c.id, c.title, c.description, c.status,
                (SELECT COUNT(*) FROM club_members WHERE club_id = c.id) AS member_count,
                (
                    SELECT JSON_ARRAYAGG(JSON_OBJECT('id', p.id, 'name', p.name, 'email', p.email))
                    FROM club_members cm_admin
                    JOIN profile p ON cm_admin.profile_id = p.id
                    WHERE cm_admin.club_id = c.id AND cm_admin.role = 'admin'
                ) AS admin_list
            FROM clubs c
            WHERE 1=1
        `;

        const queryParams = [];

        // Dynamically add search filter
        if (search) {
            baseQuery += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Dynamically add status filter
        if (status) {
            baseQuery += ` AND c.status = ?`;
            queryParams.push(status);
        }

        const [clubsData] = await db.query(baseQuery, queryParams);

        // Ensure admin_list is an empty array instead of null if a club has no admins
        const formattedClubs = clubsData.map((club) => ({
            ...club,
            admin_list: club.admin_list || [],
        }));

        return formattedClubs;
    } catch (e) {
        throw e;
    }
};

module.exports = { getClubs };
