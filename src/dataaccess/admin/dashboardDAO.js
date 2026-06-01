const db = require("../../database");

const totalUsersKPI = async () => {
    try {
        const [totalUser] = await db.query(
            `SELECT count(*) as total_user FROM profile`,
        );

        return totalUser[0];
    } catch (e) {
        throw e;
    }
};

const totalPostKPI = async () => {
    try {
        const [totalPost] = await db.query(
            `SELECT count(*) as total_post FROM posts`,
        );

        return totalPost[0];
    } catch (e) {
        throw e;
    }
};

const totalClubsKPI = async () => {
    try {
        const [totalUser] = await db.query(
            `SELECT count(*) as total_club FROM clubs`,
        );

        return totalUser[0];
    } catch (e) {
        throw e;
    }
};

const totalForumKPI = async () => {
    try {
        const [totalForum] = await db.query(
            `SELECT count(*) as total_forum FROM forum`,
        );

        return totalForum[0];
    } catch (e) {
        throw e;
    }
};

module.exports = { totalUsersKPI, totalPostKPI, totalClubsKPI, totalForumKPI };
