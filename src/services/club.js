const pool = require('../database');

async function getAllClubs() {
	const [rows] = await pool.query('SELECT id, title, description FROM clubs ORDER BY title');
	return rows;
}

async function getClubById(id) {
	const [rows] = await pool.query('SELECT id, title, description FROM clubs WHERE id = ?', [id]);
	return rows[0] || null;
}

async function getClubMembers(clubId) {
	const [rows] = await pool.query(
		`SELECT p.id, p.name, cm.role
		 FROM club_members cm
		 JOIN profile p ON p.id = cm.profile_id
		 WHERE cm.club_id = ?`,
		[clubId]
	);
	return rows;
}

async function joinClub(profileId, clubId) {
	// prevent duplicate memberships
	const [exists] = await pool.query('SELECT id FROM club_members WHERE profile_id = ? AND club_id = ?', [profileId, clubId]);
	if (exists.length > 0) return { already: true };

	const [result] = await pool.query('INSERT INTO club_members (profile_id, role, club_id) VALUES (?, ?, ?)', [profileId, 'member', clubId]);
	return { id: result.insertId };
}

module.exports = {
	getAllClubs,
	getClubById,
	getClubMembers,
	joinClub,
};
