const router = require("express").Router();
const Filter = require("leo-profanity");
const { getUserByEmail, createUser, validatePassword, deleteUser } = require("../dataaccess/authDAO");
const { generateToken, authMiddleware } = require("../middleware/authMiddleware");


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
  "committee"
];

router.post("/signup", async (req, res) => {
  const { name, email, password, confirmPassword, contactNumber, role, department } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!role || !department) {
    return res.status(400).json({ error: "Role and department are required" });
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return res.status(400).json({ error: "Name must be between 2 and 50 characters" });
  }

  const nameRegex = /^[A-Za-zÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return res.status(400).json({ error: "Name can only contain letters, spaces, apostrophes, and hyphens" });
  }

  const lowerName = trimmedName.toLowerCase();

  if (filter.check(trimmedName)) {
    return res.status(400).json({ error: "Name contains inappropriate language" });
  }

  const containsRestrictedWord = UNIVERSITY_RESTRICTED.some((word) => lowerName.includes(word.toLowerCase()));
  if (containsRestrictedWord) {
    return res.status(400).json({ error: "Name contains restricted words" });
  }

  if (!email.endsWith("@live.asia.edu.tw")) {
    return res.status(400).json({ error: "Please use Asia University's email address" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const userId = await createUser(trimmedName, email, password, role, department, contactNumber);
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
    return res.status(400).json({ error: "Email and password are required" });
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

    const token = generateToken(user.id, user.email);

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

module.exports = router;
