const router = require("express").Router();

const {
    getFriendRequestByProfileId,
    getFriendsByProfileId,
    getRequestCount,
} = require("../dataaccess/friendDAO");

router.get("/", async (req, res) => {
    const CURRENT_USER_ID = 1;

    try {
        const [friends] = await getFriendsByProfileId(CURRENT_USER_ID);

        const data = [...friends];

        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/request", async (req, res) => {
    const CURRENT_USER_ID = 1;

    try {
        const [friendRequest] =
            await getFriendRequestByProfileId(CURRENT_USER_ID);

        const data = [...friendRequest];

        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
