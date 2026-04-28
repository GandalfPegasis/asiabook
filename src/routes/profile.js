const router = require("express").Router();

const { getPostByProfileId } = require("../dataaccess/postDAO");
const { getProfileById } = require("../dataaccess/profileDAO");
const {
    getFriendsByProfileId,
    getRequestCount,
} = require("../dataaccess/friendDAO");

router.get("/", async (req, res) => {
    const PROFILE_ID = 1; // TODO - get this from the session or request parameters

    try {
        const [profileResults] = await getProfileById(PROFILE_ID);

        const [postResults] = await getPostByProfileId(PROFILE_ID);

        const user = profileResults[0];

        const data = {
            ...user,
            posts: postResults,
        };

        res.json(data);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).send("<h1>Internal Server Error</h1>");
    }
});

router.get("/friends", async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
