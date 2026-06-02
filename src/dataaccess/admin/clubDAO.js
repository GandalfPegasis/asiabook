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

// Fetch all pending requests
const getPendingClubRequests = async () => {
    const [requests] = await db.query(`
        SELECT cr.id, cr.title, cr.description, cr.requested_by, p.name as requester_name, cr.created_at
        FROM club_requests cr
        JOIN profile p ON cr.requested_by = p.id
        WHERE cr.status = 'pending'
        ORDER BY cr.created_at ASC
    `);
    return requests;
};

// Approve a request (Creates the club, updates request status)
const approveClubRequest = async (requestId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get the request data
        const [requests] = await conn.query(
            "SELECT * FROM club_requests WHERE id = ?",
            [requestId],
        );
        const request = requests[0];

        if (!request) throw new Error("Request not found");

        // 2. Create the actual club
        const [clubResult] = await conn.query(
            "INSERT INTO clubs (title, description, status) VALUES (?, ?, ?)",
            [request.title, request.description, "active"],
        );
        const newClubId = clubResult.insertId;

        // 3. (Optional) Automatically make the requester an admin of their new club!
        // await conn.query('INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)', [newClubId, request.requested_by, 'admin']);

        // 4. Mark the request as approved
        await conn.query(
            'UPDATE club_requests SET status = "approved" WHERE id = ?',
            [requestId],
        );

        await conn.commit();
        return newClubId;
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
};

// Reject a request
const rejectClubRequest = async (requestId) => {
    await db.query(
        'UPDATE club_requests SET status = "rejected" WHERE id = ?',
        [requestId],
    );
};

const deleteClubById = async (clubId) => {
    try {
        const [result] = await db.query("DELETE FROM clubs WHERE id = ?", [
            clubId,
        ]);

        // Returns true if a row was actually deleted, false if the club didn't exist
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error deleting club:", error);
        throw error;
    }
};

const createOfficialClub = async (title, description, status = "active") => {
    try {
        const [result] = await db.query(
            `INSERT INTO clubs (title, description, status) 
             VALUES (?, ?, ?)`,
            [title, description, status],
        );

        // Return the ID of the newly created club
        return result.insertId;
    } catch (error) {
        console.error("Error creating official club:", error);
        throw error;
    }
};

const updateClubStatus = async (clubId, status) => {
    try {
        const [result] = await db.query(
            "UPDATE clubs SET status = ? WHERE id = ?",
            [status, clubId],
        );

        // Returns true if the club was found and updated
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error updating club status:", error);
        throw error;
    }
};

module.exports = {
    getClubs,
    getPendingClubRequests,
    rejectClubRequest,
    approveClubRequest,
    deleteClubById,
    createOfficialClub,
    updateClubStatus,
};
