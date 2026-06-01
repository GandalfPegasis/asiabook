// src/config/database.js
const mysql = require("mysql2/promise");

// Create a connection pool rather than a single connection
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "192.168.1.116",
    user: process.env.MYSQL_USER || "kenneth",
    password: process.env.MYSQL_PASSWORD || "kenneth123",
    database: process.env.MYSQL_DATABASE || "asiabook",

    // Pool specific configurations
    waitForConnections: true,
    connectionLimit: 10, // Adjust based on your server limits
    maxIdle: 10, // Max idle connections, the idle connections are closed
    idleTimeout: 60000, // Idle connections timeout, in milliseconds
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

// Optional: A quick test function to verify the connection on startup
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();

        console.log("✅ Database connection established successfully.");

        connection.release();
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        // In a production app, you might want to process.exit(1) here
    }
};

testConnection();

module.exports = pool;
