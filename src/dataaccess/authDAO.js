const db = require("../database");
const bcrypt = require("bcryptjs");

const getUserByEmail = async (email) => {
  try {
    const [rows] = await db.query("SELECT * FROM profile WHERE email = ?", [
      email,
    ]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw error;
  }
};

const createUser = async (name, email, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO profile (name, email, password, role, department) 
       VALUES (?, ?, ?, 'student', 'General')`,
      [name, email, hashedPassword]
    );

    return result.insertId;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

const validatePassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error("Error validating password:", error);
    throw error;
  }
};

module.exports = {
  getUserByEmail,
  createUser,
  validatePassword,
};
