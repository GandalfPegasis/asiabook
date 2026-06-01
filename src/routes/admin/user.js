const router = require("express").Router();
const {
    getUser,
    updateUserStatus,
    deleteUser,
} = require("../../dataaccess/admin/userDAO.js");

router.get("/", async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const LIMIT = 10;

    const offset = (page - 1) * LIMIT;

    const search = req.query.search || null;
    const role = req.query.role || null;

    try {
        const userData = await getUser(offset, LIMIT, search, role);

        res.json({
            data: userData.users,
            page: page,
            total_user: userData.total,
        });
    } catch (e) {
        console.log(e);
        res.json({ error: e });
    }
});

router.put("/:userId/status", async (req, res) => {
    const { status } = req.body;
    const { userId } = req.params;

    if (!status) {
        res.status(400).json({ error: "kurang status" }); // TODO fix message
    }

    // TODO check if status is a valid status

    try {
        await updateUserStatus(status, userId);

        res.json({ message: "Success" });
    } catch (e) {
        console.log(e);
        res.json({ error: e });
    }
});

router.delete("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        await deleteUser(userId);

        res.json({ message: "Success" });
    } catch (e) {
        console.log(e);
        res.json({ error: e });
    }
});

module.exports = router;
