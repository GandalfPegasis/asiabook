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

const getUserById = async (userId) => {
    try {
        const [rows] = await db.query("SELECT * FROM profile WHERE id = ?", [
            userId,
        ]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error fetching user by id:", error);
        throw error;
    }
};

const createUser = async (
    name,
    email,
    password,
    role = "student",
    department = "General",
    contactNumber = null,
) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `INSERT INTO profile (name, email, password, role, department, contact_number) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, role, department, contactNumber],
        );

        return result.insertId;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

const updatePassword = async (userId, newPassword) => {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await db.query(
            `UPDATE profile SET password = ? WHERE id = ?`,
            [hashedPassword, userId],
        );

        return result;
    } catch (e) {
        console.error("Error in updating password:", e);
        throw e;
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
        const [result] = await db.query("DELETE FROM profile WHERE id = ?", [
            userId,
        ]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

const isUserAdmin = async (userId) => {
    try {
        const [result] = await db.query(
            "SELECT * FROM admin WHERE profile_id = ?",
            [userId],
        );

        if (result.length) return true;
        return false;
    } catch (e) {
        console.error("Error in isUserAdmin:", e);
        throw e;
    }
};

const createPasswordResetToken = async (email, token, expiresAt) => {
    await db.query(
        "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)",
        [email, token, expiresAt],
    );
};

const getValidResetToken = async (token) => {
    // Only returns the record if it exists AND hasn't expired yet
    const [resets] = await db.query(
        "SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW()",
        [token],
    );
    return resets[0] || null;
};

const updatePasswordByEmail = async (email, hashedPassword) => {
    await db.query("UPDATE profile SET password = ? WHERE email = ?", [
        hashedPassword,
        email,
    ]);
};

const deleteResetToken = async (email) => {
    await db.query("DELETE FROM password_resets WHERE email = ?", [email]);
};

module.exports = {
    getUserByEmail,
    createUser,
    validatePassword,
    deleteUser,
    isUserAdmin,
    updatePassword,
    getUserById,
    createPasswordResetToken,
    getValidResetToken,
    updatePasswordByEmail,
    deleteResetToken,
};
