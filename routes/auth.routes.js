const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");

// ── Helper: create JWT token ─────────────────────────────────
function createToken(user) {
  return jwt.sign(
    {
      email: user.email,
      role: user.role || "user",
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// Custom email+password registration — no BetterAuth
// ─────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const db = await connectDB();

    // 2. Check if email already used
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // 3. Hash the password — never store plain text
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save new user to MongoDB
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: "user",          // default role
      image: "",
      provider: "email",     // how they signed up
      createdAt: new Date(),
    };
    await db.collection("users").insertOne(newUser);

    // 5. Create JWT and return it
    const token = createToken(newUser);

    res.status(201).json({
      message: "Registered successfully",
      token,
      user: { name, email, role: "user", image: "" },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Custom email+password login — no BetterAuth
// ─────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const db = await connectDB();

    // 1. Find user
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "No account found with this email" });
    }

    // 2. Check they signed up with email (not Google)
    if (user.provider === "google") {
      return res.status(401).json({
        message: "This email uses Google login. Please click 'Continue with Google'",
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // 4. Check fraud status
    if (user.isFraud) {
      return res.status(403).json({ message: "Account suspended" });
    }

    // 5. Create JWT
    const token = createToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || "",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/google-save
// Called AFTER BetterAuth Google OAuth completes
// Saves Google user to our users collection if not already there
// and returns our own JWT
// ─────────────────────────────────────────────────────────────
router.post("/google-save", async (req, res) => {
  try {
    const { name, email, image } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const db = await connectDB();

    // Check if user already exists
    let user = await db.collection("users").findOne({ email });

    if (!user) {
      // First time Google login — create user
      const newUser = {
        name: name || "Google User",
        email,
        image: image || "",
        role: "user",
        provider: "google",
        createdAt: new Date(),
      };
      await db.collection("users").insertOne(newUser);
      user = newUser;
    }

    // Check fraud
    if (user.isFraud) {
      return res.status(403).json({ message: "Account suspended" });
    }

    // Return our JWT
    const token = createToken(user);

    res.json({
      message: "Google login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || "",
      },
    });
  } catch (err) {
    console.error("Google save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// Returns logged-in user's info (requires JWT)
// ─────────────────────────────────────────────────────────────
router.get("/me", verifyJWT, async (req, res) => {
  try {
    const db = await connectDB();
    const user = await db
      .collection("users")
      .findOne(
        { email: req.user.email },
        { projection: { password: 0 } } // never return password
      );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;