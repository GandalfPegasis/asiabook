const jwt = require("jsonwebtoken");

const JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";

const generateToken = (userId, email) => {
    return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = payload;
    next();
};

module.exports = {
    generateToken,
    verifyToken,
    authMiddleware,
    JWT_SECRET,
};
