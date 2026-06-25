const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const connectDB = require("../lib/db");

// Called after BetterAuth signs in — we issue our own JWT
router.post("/jwt", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const db = await connectDB();
  let user = await db.collection("users").findOne({ email });

  // First time user — save with role "user"
  if (!user) {
    await db.collection("users").insertOne({
      email,
      role: "user",
      createdAt: new Date(),
    });
    user = await db.collection("users").findOne({ email });
  }

  const token = jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

// Get current user role/info
router.get("/me", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email required" });
  const db = await connectDB();
  const user = await db.collection("users").findOne({ email });
  res.json(user);
});

module.exports = router;