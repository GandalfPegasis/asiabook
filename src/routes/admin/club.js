const router = require("express").Router();
const {
    getClubs,
    approveClubRequest,
    getPendingClubRequests,
    rejectClubRequest,
    deleteClubById,
    createOfficialClub,
    updateClubStatus,
} = require("../../dataaccess/admin/clubDAO");

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

router.post("/", async (req, res) => {
    const { title, description, status } = req.body;

    // 1. Basic Validation
    if (!title || !description) {
        return res
            .status(400)
            .json({ error: "Club title and description are required." });
    }

    if (title.length > 100) {
        return res
            .status(400)
            .json({ error: "Title must be 100 characters or less." });
    }

    try {
        // 2. Create the club in the database
        // We pass the status from the frontend (which sends 'active'),
        // but it defaults to 'active' in the DAO if missing.
        const newClubId = await createOfficialClub(
            title.trim(),
            description.trim(),
            status,
        );

        // 3. Send success response back to Vue
        res.json({
            success: true,
            message: "Official club created successfully.",
            clubId: newClubId,
        });
    } catch (error) {
        console.error("Failed to create official club:", error);
        res.status(500).json({
            error: "An internal server error occurred while creating the club.",
        });
    }
});

router.delete("/:id", async (req, res) => {
    const clubId = parseInt(req.params.id, 10);

    if (isNaN(clubId)) {
        return res.status(400).json({ error: "Invalid club ID provided." });
    }

    try {
        const success = await deleteClubById(clubId);

        if (!success) {
            return res
                .status(404)
                .json({ error: "Club not found or already deleted." });
        }

        // Successfully deleted
        res.json({
            success: true,
            message:
                "Club and all associated data have been permanently deleted.",
        });
    } catch (error) {
        console.error("Failed to delete club:", error);
        res.status(500).json({
            error: "An internal server error occurred while deleting the club.",
        });
    }
});

// Get pending requests
router.get("/club-requests", async (req, res) => {
    try {
        console.log("kontol memek");
        const requests = await getPendingClubRequests();
        console.log(requests);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: "Failed to load requests" });
    }
});

// Approve a request
router.post("/club-requests/:id/approve", async (req, res) => {
    try {
        await approveClubRequest(req.params.id);
        res.json({ success: true, message: "Club approved and created." });
    } catch (error) {
        res.status(500).json({ error: "Failed to approve club" });
    }
});

// Reject a request
router.post("/club-requests/:id/reject", async (req, res) => {
    try {
        await rejectClubRequest(req.params.id);
        res.json({ success: true, message: "Club request rejected." });
    } catch (error) {
        res.status(500).json({ error: "Failed to reject club" });
    }
});

router.put("/:id/suspend", async (req, res) => {
    const clubId = parseInt(req.params.id, 10);

    if (isNaN(clubId)) {
        return res.status(400).json({ error: "Invalid club ID." });
    }

    try {
        const success = await updateClubStatus(clubId, "suspended");

        if (!success) {
            return res.status(404).json({ error: "Club not found." });
        }

        res.json({ success: true, message: "Club suspended successfully." });
    } catch (error) {
        console.error("Failed to suspend club:", error);
        res.status(500).json({
            error: "Internal server error while suspending club.",
        });
    }
});

// Restore a suspended club
router.put("/:id/restore", async (req, res) => {
    const clubId = parseInt(req.params.id, 10);

    if (isNaN(clubId)) {
        return res.status(400).json({ error: "Invalid club ID." });
    }

    try {
        // Restoring brings it back to the normal 'active' state
        const success = await updateClubStatus(clubId, "active");

        if (!success) {
            return res.status(404).json({ error: "Club not found." });
        }

        res.json({ success: true, message: "Club restored successfully." });
    } catch (error) {
        console.error("Failed to restore club:", error);
        res.status(500).json({
            error: "Internal server error while restoring club.",
        });
    }
});

module.exports = router;
