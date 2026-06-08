const router = require("express").Router();
const clubService = require("../services/club");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createClubRequest } = require("../dataaccess/clubDAO");
router.get("/", async (req, res) => {
    try {
        const clubs = await clubService.getAllClubs();
        res.json(clubs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const club = await clubService.getClubById(req.params.id);
        if (!club) return res.status(404).json({ error: "Club not found" });
        res.json(club);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id/members", async (req, res) => {
    try {
        const members = await clubService.getClubMembers(req.params.id);
        res.json(members);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id/events", async (req, res) => {
    try {
        const events = await clubService.getClubEvents(req.params.id);
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id/requests", authMiddleware, async (req, res) => {
    try {
        const clubId = req.params.id;
        // Verify user is admin of this club
        const members = await clubService.getClubMembers(clubId);
        const isAdmin = members.some(
            (m) => m.profile_id === req.user.id && m.role === "admin",
        );
        if (!isAdmin) return res.status(403).json({ error: "Not authorized" });

        const requests = await clubService.getClubJoinRequests(clubId);
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/:id/join", authMiddleware, async (req, res) => {
    try {
        const profileId = req.user.id;
        const clubId = req.params.id;
        const result = await clubService.joinClub(profileId, clubId);
        if (result.already)
            return res
                .status(200)
                .json({ success: true, message: "Already a member" });
        res.json({ success: true, id: result.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Join Request endpoints
router.post("/:id/request-join", authMiddleware, async (req, res) => {
    try {
        const profileId = req.user.id;
        const clubId = req.params.id;
        const result = await clubService.createJoinRequest(profileId, clubId);
        if (result.already)
            return res
                .status(200)
                .json({ success: true, message: "Request already sent" });
        res.json({ success: true, id: result.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.post(
    "/:id/requests/:requestId/approve",
    authMiddleware,
    async (req, res) => {
        try {
            const clubId = req.params.id;
            const requestId = req.params.requestId;

            const members = await clubService.getClubMembers(clubId);
            const isAdmin = members.some(
                (m) => m.profile_id === req.user.id && m.role === "admin",
            );
            if (!isAdmin)
                return res.status(403).json({ error: "Not authorized" });

            await clubService.approveJoinRequest(requestId, clubId);
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    },
);

router.post(
    "/:id/requests/:requestId/decline",
    authMiddleware,
    async (req, res) => {
        try {
            const clubId = req.params.id;
            const requestId = req.params.requestId;

            const members = await clubService.getClubMembers(clubId);
            const isAdmin = members.some(
                (m) => m.profile_id === req.user.id && m.role === "admin",
            );
            if (!isAdmin)
                return res.status(403).json({ error: "Not authorized" });

            await clubService.declineJoinRequest(requestId, clubId);
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    },
);

// Member Management
router.delete("/:id/members/:memberId", authMiddleware, async (req, res) => {
    try {
        const clubId = req.params.id;
        const memberId = req.params.memberId;

        const members = await clubService.getClubMembers(clubId);
        const isAdmin = members.some(
            (m) => m.profile_id === req.user.id && m.role === "admin",
        );
        if (!isAdmin) return res.status(403).json({ error: "Not authorized" });

        const result = await clubService.removeMember(memberId, clubId);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.patch(
    "/:id/members/:memberId/role",
    authMiddleware,
    async (req, res) => {
        try {
            const clubId = req.params.id;
            const memberId = req.params.memberId;
            const { role } = req.body;

            const members = await clubService.getClubMembers(clubId);
            const isAdmin = members.some(
                (m) => m.profile_id === req.user.id && m.role === "admin",
            );
            if (!isAdmin)
                return res.status(403).json({ error: "Not authorized" });

            const result = await clubService.changeMemberRole(
                memberId,
                clubId,
                role,
            );
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    },
);

// Events
router.post("/:id/events", authMiddleware, async (req, res) => {
    try {
        const clubId = req.params.id;
        const { title, description, event_date, location } = req.body;

        const members = await clubService.getClubMembers(clubId);
        const isAdmin = members.some(
            (m) => m.profile_id === req.user.id && m.role === "admin",
        );
        if (!isAdmin) return res.status(403).json({ error: "Not authorized" });

        const event = await clubService.createClubEvent(
            clubId,
            title,
            description,
            event_date,
            location,
        );
        res.json(event);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Server error" });
    }
});

router.put("/:id/events/:eventId", authMiddleware, async (req, res) => {
    try {
        const clubId = req.params.id;
        const eventId = req.params.eventId;
        const { title, description, event_date, location } = req.body;

        const members = await clubService.getClubMembers(clubId);
        const isAdmin = members.some(
            (m) => m.profile_id === req.user.id && m.role === "admin",
        );
        if (!isAdmin) return res.status(403).json({ error: "Not authorized" });

        const result = await clubService.updateClubEvent(
            eventId,
            clubId,
            title,
            description,
            event_date,
            location,
        );
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Server error" });
    }
});

router.delete("/:id/events/:eventId", authMiddleware, async (req, res) => {
    try {
        const clubId = req.params.id;
        const eventId = req.params.eventId;

        const members = await clubService.getClubMembers(clubId);
        const isAdmin = members.some(
            (m) => m.profile_id === req.user.id && m.role === "admin",
        );
        if (!isAdmin) return res.status(403).json({ error: "Not authorized" });

        const result = await clubService.deleteClubEvent(eventId, clubId);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Server error" });
    }
});

// Check if current user has a pending join request
router.get("/:id/request-status", authMiddleware, async (req, res) => {
    try {
        const clubId = req.params.id;
        const profileId = req.user.id;
        const requested = await clubService.hasPendingRequest(
            profileId,
            clubId,
        );
        res.json({ requested });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update club (admin-only)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const clubId = req.params.id;
        const { title, description } = req.body;

        const members = await clubService.getClubMembers(clubId);
        const isAdmin = members.some(
            (m) => m.profile_id === req.user.id && m.role === "admin",
        );
        if (!isAdmin) return res.status(403).json({ error: "Not authorized" });

        const result = await clubService.updateClub(clubId, title, description);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/request-new", authMiddleware, async (req, res) => {
    const { title, description } = req.body;
    // Extract the logged-in user's ID from the middleware
    const userId = req.user.id;

    // Basic validation
    if (!title || !description) {
        return res
            .status(400)
            .json({ error: "Title and description are required." });
    }

    if (title.length > 100) {
        return res
            .status(400)
            .json({ error: "Title must be under 100 characters." });
    }

    try {
        await createClubRequest(userId, title.trim(), description.trim());

        res.json({
            success: true,
            message: "Club request submitted successfully.",
        });
    } catch (error) {
        console.error("Failed to submit club request:", error);
        res.status(500).json({
            error: "Internal server error while submitting request.",
        });
    }
});

module.exports = router;
