const router = require("express").Router();
const {
    totalClubsKPI,
    totalPostKPI,
    totalUsersKPI,
    totalForumKPI,
    getRecentUser,
} = require("../../dataaccess/admin/dashboardDAO");
const db = require("../../database");

router.get("/kpi", async (req, res) => {
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

router.get("/recent-users", async (req, res) => {
    try {
        const recentUsers = await getRecentUser();

        res.json(recentUsers);
    } catch (error) {
        console.error("Recent Users Error:", error);
        res.status(500).json({ error: "Failed to fetch recent users" });
    }
});

// adminRoutes.js
router.get("/health", async (req, res) => {
    // Start a high-resolution timer to check latency
    const start = process.hrtime();
    let dbStatus = "Offline";

    try {
        // A simple query just to verify the DB is accepting connections
        await db.query("SELECT 1");
        dbStatus = "Online";
    } catch (error) {
        console.error("Database health check failed:", error);
    }

    // Stop the timer and calculate milliseconds
    const diff = process.hrtime(start);
    const latencyMs = Math.round((diff[0] * 1e9 + diff[1]) / 1000000);

    // Calculate Node.js memory usage percentage
    const memoryData = process.memoryUsage();
    const memoryUsed = memoryData.heapUsed;
    const memoryTotal = memoryData.heapTotal;
    const memoryPercent = Math.round((memoryUsed / memoryTotal) * 100);

    res.json({
        database: dbStatus,
        apiLatency: latencyMs,
        memoryPercent: memoryPercent,
    });
});

module.exports = router;
