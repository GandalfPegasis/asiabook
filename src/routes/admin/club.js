const router = require("express").Router();
const { getClubs } = require("../../dataaccess/admin/clubDAO");

router.get("/", async (req, res) => {
    const search = req.query.search || null;
    const status = req.query.status || null;

    try {
        const clubsData = await getClubs(search, status);
        res.json(clubsData);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
