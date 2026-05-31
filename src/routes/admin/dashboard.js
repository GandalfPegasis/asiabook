const router = require("express").Router();
const {
    totalClubsKPI,
    totalPostKPI,
    totalUsersKPI,
    totalForumKPI,
} = require("../../dataaccess/admin/dashboardDAO");

router.get("/", async (req, res) => {
    try {
        totalUser = await totalUsersKPI();
        totalPost = await totalPostKPI();
        totalClub = await totalClubsKPI();
        totalForum = await totalForumKPI();

        res.json({
            data: {
                ...totalClub,
                ...totalPost,
                ...totalUser,
                ...totalForum,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "error" });
    }
});

module.exports = router;
