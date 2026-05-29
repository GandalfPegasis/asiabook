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

const createUser = async (name, email, password, role = 'student', department = 'General', contactNumber = null) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO profile (name, email, password, role, department, contact_number) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, department, contactNumber]
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

const deleteUser = async (userId) => {
  try {
    const [result] = await db.query("DELETE FROM profile WHERE id = ?", [userId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

module.exports = {
  getUserByEmail,
  createUser,
  validatePassword,
  deleteUser,
};
