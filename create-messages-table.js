const mysql = require('mysql2/promise');
require('dotenv').config();

async function createMessagesTable() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'asiabook',
    });

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id int primary key auto_increment,
        sender_id int NOT NULL,
        receiver_id int NOT NULL,
        content text NOT NULL,
        is_read boolean NOT NULL DEFAULT false,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES profile(id) ON UPDATE cascade ON DELETE cascade,
        FOREIGN KEY (receiver_id) REFERENCES profile(id) ON UPDATE cascade ON DELETE cascade
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ messages table created or already exists.');
  } catch (error) {
    console.error('❌ Failed to create messages table:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createMessagesTable();