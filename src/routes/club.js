const router = require('express').Router();
const clubService = require('../services/club');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
    try {
        const clubs = await clubService.getAllClubs();
        res.json(clubs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const club = await clubService.getClubById(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });
        res.json(club);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id/members', async (req, res) => {
    try {
        const members = await clubService.getClubMembers(req.params.id);
        res.json(members);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const profileId = req.user.id;
        const clubId = req.params.id;
        const result = await clubService.joinClub(profileId, clubId);
        if (result.already) return res.status(200).json({ success: true, message: 'Already a member' });
        res.json({ success: true, id: result.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
