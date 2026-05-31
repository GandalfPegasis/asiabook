const db = require("../../database");

const getUser = async (offset, limit, search, role) => {
    try {
        let baseQuery = `FROM profile WHERE 1=1`; // 1=1 is a trick to make appending "AND" easier
        const queryParams = [];

        if (search) {
            baseQuery += ` AND (name LIKE ? OR email LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (role) {
            baseQuery += ` AND role = ?`;
            queryParams.push(role);
        }

        const countSql = `SELECT COUNT(*) as totalCount ` + baseQuery;
        const [[countResult]] = await db.query(countSql, queryParams);

        const dataSql =
            `SELECT id, name, email, role, department, status, created_at ` +
            baseQuery +
            ` LIMIT ?, ?`;

        const dataParams = [...queryParams, offset, limit];
        const [userData] = await db.query(dataSql, dataParams);

        return {
            users: userData,
            total: countResult.totalCount,
        };
    } catch (e) {
        throw e;
    }
};

const updateUserStatus = async (newStatus, userId) => {
    try {
        await db.query(`UPDATE profile SET status = ? WHERE id = ?`, [
            newStatus,
            userId,
        ]);
    } catch (e) {
        throw e;
    }
};

const deleteUser = async (userId) => {
    try {
        await db.query(`DELETE FROM profile WHERE id = ?`, [userId]);
    } catch (e) {
        throw e;
    }
};

module.exports = { getUser, updateUserStatus, deleteUser };
