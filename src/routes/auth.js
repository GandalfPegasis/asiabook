const router = require("express").Router();
const filter = require("leo-profanity");
const {
    getUserByEmail,
    createUser,
    validatePassword,
    deleteUser,
    isUserAdmin,
    getUserById,
    updatePassword,
    createPasswordResetToken,
    getValidResetToken,
    updatePasswordByEmail,
    deleteResetToken,
} = require("../dataaccess/authDAO");
const { isUserSuspended, updateProfile } = require("../dataaccess/profileDAO");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const {
    generateToken,
    authMiddleware,
} = require("../middleware/authMiddleware");

const UNIVERSITY_RESTRICTED = [
    "asia university",
    "admin",
    "administrator",
    "staff",
    "faculty",
    "moderator",
    "professor",
    "teacher",
    "president",
    "dean",
    "director",
    "officer",
    "manager",
    "ceo",
    "founder",
    "owner",
    "council",
    "board",
    "committee",
];

router.post("/signup", async (req, res) => {
    const {
        name,
        email,
        password,
        confirmPassword,
        contactNumber,
        role,
        department,
    } = req.body;

    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: "All fields are required" });
    }

    if (!role || !department) {
        return res
            .status(400)
            .json({ error: "Role and department are required" });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res
            .status(400)
            .json({ error: "Name must be between 2 and 50 characters" });
    }

    const nameRegex = /^[A-Za-zÀ-ÿ\s'-]+$/;
    if (!nameRegex.test(trimmedName)) {
        return res.status(400).json({
            error: "Name can only contain letters, spaces, apostrophes, and hyphens",
        });
    }

    const lowerName = trimmedName.toLowerCase();

    if (filter.check(trimmedName)) {
        return res
            .status(400)
            .json({ error: "Name contains inappropriate language" });
    }

    const containsRestrictedWord = UNIVERSITY_RESTRICTED.some((word) =>
        lowerName.includes(word.toLowerCase()),
    );
    if (containsRestrictedWord) {
        return res
            .status(400)
            .json({ error: "Name contains restricted words" });
    }

    if (!email.endsWith("@live.asia.edu.tw")) {
        return res
            .status(400)
            .json({ error: "Please use Asia University's email address" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
        return res
            .status(400)
            .json({ error: "Password must be at least 6 characters" });
    }

    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: "Email already registered" });
        }

        const userId = await createUser(
            trimmedName,
            email,
            password,
            role,
            department,
            contactNumber,
        );
        const token = generateToken(userId, email);

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: { id: userId, name: trimmedName, email, role, department },
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ error: "Failed to create account" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(400)
            .json({ error: "Email and password are required" });
    }

    try {
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isPasswordValid = await validatePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        if (await isUserSuspended(user.id))
            res.status(401).json({ error: "User is suspended" });

        const token = generateToken(user.id, user.email);

        const isAdmin = await isUserAdmin(user.id);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                department: user.department,
                role: user.role,
                avatar: user.avatar,
                admin: isAdmin,
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

router.delete("/delete-account", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const success = await deleteUser(userId);
        if (!success) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (err) {
        console.error("Delete account error:", err);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

router.post("/change-password", authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        req.status(400).json({ error: "Please fill out all field!" });
    }

    const userId = req.user.id;

    try {
        const userData = await getUserById(userId);

        const validCurrentPassword = await validatePassword(
            currentPassword,
            userData.password,
        );

        if (!validCurrentPassword) {
            return res
                .status(400)
                .json({ error: "Current password is wrong!" });
        }

        await updatePassword(userId, newPassword);

        res.json({ success: true, message: "Password updated successfully!" });
    } catch (e) {
        console.error("Error reseting password:", e);
        res.status(500).json({ error: "Failed reseting password" });
    }
});

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await getUserByEmail(email);

        // Security best practice: Don't reveal if the email exists or not
        if (!user) {
            return res.json({
                success: true,
                message: "If that email exists, a reset link has been sent.",
            });
        }

        // Generate token and expiration
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Save to DB via DAO
        await createPasswordResetToken(email, token, expiresAt);

        // MOCK EMAIL LOGIC
        const resetLink = `http://localhost:5173/reset-password?token=${token}`;
        console.log(`\n📧 MOCK EMAIL TO: ${email}`);
        console.log(`Subject: Reset your AsiaBook Password`);
        console.log(`Click here to reset: ${resetLink}\n`);

        res.json({
            success: true,
            message: "If that email exists, a reset link has been sent.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 2. Process New Password
router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Find valid token via DAO
        const resetRecord = await getValidResetToken(token);

        if (!resetRecord) {
            return res.status(400).json({
                error: "Invalid or expired reset token. Please request a new one.",
            });
        }

        const userEmail = resetRecord.email;

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clean up token via DAO
        await updatePasswordByEmail(userEmail, hashedPassword);
        await deleteResetToken(userEmail);

        res.json({
            success: true,
            message: "Password has been successfully reset.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
