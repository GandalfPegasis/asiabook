const { getProfileById } = require("../dataaccess/profileDAO");
const { getPostByProfileId } = require("../dataaccess/postDAO");

const getProfile = async (req, res) => {
    const PROFILE_ID = req.user.id; // Get from authenticated user token

    try {
        const [profileResults] = await getProfileById(PROFILE_ID);

        const postResults = await getPostByProfileId(PROFILE_ID);

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
};

module.exports = { getProfile };
