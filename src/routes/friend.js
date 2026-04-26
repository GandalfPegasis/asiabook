const router = require("express").Router();

const { getFriendsRequestsByProfileId } = require("../dataaccess/friendDAO");
const {
    getFriendsByProfileId,
    getRequestCount,
} = require("../dataaccess/profileDAO");

router.get("/", async (req, res) => {
    // Hardcoded for testing purposes
    const CURRENT_USER_ID = 1;

    try {
        const [friends] = await getFriendsByProfileId(CURRENT_USER_ID);
        const [requestCount] = await getRequestCount(CURRENT_USER_ID);

        const data = {
            friends,
            requestCount: requestCount["friend_request"],
        };
        console.log("Friends Page Data:", data);
        res.json(data);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("<h1>Error loading the friends page</h1>");
    }
});

module.exports = router;
