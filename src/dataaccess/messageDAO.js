const db = require("../database");

const ensureTableExists = async () => {
    await db.query(
        `CREATE TABLE IF NOT EXISTS messages (
      id int primary key auto_increment,
      sender_id int NOT NULL,
      receiver_id int NOT NULL,
      content text NOT NULL,
      is_read boolean NOT NULL DEFAULT false,
      created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES profile(id) ON UPDATE cascade ON DELETE cascade,
      FOREIGN KEY (receiver_id) REFERENCES profile(id) ON UPDATE cascade ON DELETE cascade
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    );
};

const getMessagesForUser = async (userId) => {
    try {
        const [rows] = await db.query(
            `SELECT m.*, sender.name AS sender_name, receiver.name AS receiver_name
       FROM messages m
       JOIN profile sender ON m.sender_id = sender.id
       JOIN profile receiver ON m.receiver_id = receiver.id
       WHERE m.sender_id = ? OR m.receiver_id = ?
       ORDER BY m.created_at ASC;`,
            [userId, userId],
        );

        return rows;
    } catch (error) {
        console.error("Error fetching messages for user:", error);
        throw error;
    }
};

const getConversation = async (userId, contactId) => {
    try {
        const [rows] = await db.query(
            `SELECT m.*, sender.name AS sender_name, receiver.name AS receiver_name
       FROM messages m
       JOIN profile sender ON m.sender_id = sender.id
       JOIN profile receiver ON m.receiver_id = receiver.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC;`,
            [userId, contactId, contactId, userId],
        );

        return rows;
    } catch (error) {
        console.error("Error fetching conversation:", error);
        throw error;
    }
};

const sendMessage = async (senderId, receiverId, content) => {
    try {
        const [result] = await db.query(
            `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?);`,
            [senderId, receiverId, content],
        );

        const [rows] = await db.query(
            `SELECT m.*, sender.name AS sender_name, receiver.name AS receiver_name
       FROM messages m
       JOIN profile sender ON m.sender_id = sender.id
       JOIN profile receiver ON m.receiver_id = receiver.id
       WHERE m.id = ?;`,
            [result.insertId],
        );

        return rows[0];
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

module.exports = {
    ensureTableExists,
    getMessagesForUser,
    getConversation,
    sendMessage,
};
