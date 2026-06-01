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
		`SELECT cm.id, cm.profile_id, p.name as profile_name, cm.role
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

// Join Requests
async function createJoinRequest(profileId, clubId) {
	const [exists] = await pool.query('SELECT id FROM club_join_requests WHERE profile_id = ? AND club_id = ? AND status = "pending"', [profileId, clubId]);
	if (exists.length > 0) return { already: true };

	const [result] = await pool.query(
		'INSERT INTO club_join_requests (profile_id, club_id, status) VALUES (?, ?, ?)',
		[profileId, clubId, 'pending']
	);
	return { id: result.insertId };
}

async function hasPendingRequest(profileId, clubId) {
	const [rows] = await pool.query(
		'SELECT id FROM club_join_requests WHERE profile_id = ? AND club_id = ? AND status = "pending"',
		[profileId, clubId]
	);
	return rows.length > 0;
}

async function getClubJoinRequests(clubId) {
	const [rows] = await pool.query(
		`SELECT cjr.id, cjr.profile_id, p.name as user_name, cjr.created_at
		 FROM club_join_requests cjr
		 JOIN profile p ON p.id = cjr.profile_id
		 WHERE cjr.club_id = ? AND cjr.status = 'pending'
		 ORDER BY cjr.created_at DESC`,
		[clubId]
	);
	return rows;
}

async function approveJoinRequest(requestId, clubId) {
	const [req] = await pool.query('SELECT profile_id FROM club_join_requests WHERE id = ? AND club_id = ?', [requestId, clubId]);
	if (req.length === 0) throw new Error('Request not found');

	const profileId = req[0].profile_id;

	// Add as member
	await pool.query('INSERT INTO club_members (profile_id, role, club_id) VALUES (?, ?, ?)', [profileId, 'member', clubId]);
	// Update request status
	await pool.query('UPDATE club_join_requests SET status = "approved" WHERE id = ?', [requestId]);

	return { success: true };
}

async function declineJoinRequest(requestId, clubId) {
	await pool.query('UPDATE club_join_requests SET status = "declined" WHERE id = ? AND club_id = ?', [requestId, clubId]);
	return { success: true };
}

// Member Management
async function removeMember(memberId, clubId) {
	const [result] = await pool.query('DELETE FROM club_members WHERE id = ? AND club_id = ?', [memberId, clubId]);
	return { success: result.affectedRows > 0 };
}

async function changeMemberRole(memberId, clubId, newRole) {
	const [result] = await pool.query('UPDATE club_members SET role = ? WHERE id = ? AND club_id = ?', [newRole, memberId, clubId]);
	return { success: result.affectedRows > 0 };
}

// Events
async function getClubEvents(clubId) {
	const [rows] = await pool.query(
		'SELECT * FROM club_events WHERE club_id = ? ORDER BY event_date DESC',
		[clubId]
	);
	return rows;
}

async function createClubEvent(clubId, title, description, eventDate, location) {
	const [result] = await pool.query(
		'INSERT INTO club_events (club_id, title, description, event_date, location) VALUES (?, ?, ?, ?, ?)',
		[clubId, title, description, eventDate, location]
	);
	return { id: result.insertId };
}

async function updateClubEvent(eventId, clubId, title, description, eventDate, location) {
	const [result] = await pool.query(
		'UPDATE club_events SET title = ?, description = ?, event_date = ?, location = ? WHERE id = ? AND club_id = ?',
		[title, description, eventDate, location, eventId, clubId]
	);
	return { success: result.affectedRows > 0 };
}

async function deleteClubEvent(eventId, clubId) {
	const [result] = await pool.query('DELETE FROM club_events WHERE id = ? AND club_id = ?', [eventId, clubId]);
	return { success: result.affectedRows > 0 };
}

// Update club details (title, description)
async function updateClub(clubId, title, description) {
    const [result] = await pool.query('UPDATE clubs SET title = ?, description = ? WHERE id = ?', [title, description, clubId]);
    return { success: result.affectedRows > 0 };
}

module.exports = {
	getAllClubs,
	getClubById,
	getClubMembers,
	joinClub,
	createJoinRequest,
	getClubJoinRequests,
	approveJoinRequest,
	declineJoinRequest,
	removeMember,
	changeMemberRole,
	getClubEvents,
	createClubEvent,
	updateClubEvent,
	deleteClubEvent,
	updateClub,
	hasPendingRequest,
};
