const express = require("express");
const router = express.Router();
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");
const { verifyAdmin } = require("../middleware/verifyRole");
const { ObjectId } = require("mongodb");

// GET all users (admin)
router.get("/", verifyJWT, verifyAdmin, async (req, res) => {
  const db = await connectDB();
  const users = await db
    .collection("users")
    .find({}, { projection: { password: 0 } })
    .toArray();
  res.json(users);
});

// PATCH change user role (admin)
router.patch("/:id/role", verifyJWT, verifyAdmin, async (req, res) => {
  const { role } = req.body;
  if (!["user", "vendor", "admin"].includes(role))
    return res.status(400).json({ message: "Invalid role" });

  let userId;
  try {
    userId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const db = await connectDB();
  const result = await db
    .collection("users")
    .updateOne({ _id: userId }, { $set: { role } });
  res.json(result);
});

// PATCH mark vendor as fraud (admin)
router.patch("/:id/fraud", verifyJWT, verifyAdmin, async (req, res) => {
  let userId;
  try {
    userId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const db = await connectDB();
  const user = await db.collection("users").findOne({ _id: userId });
  if (!user) return res.status(404).json({ message: "User not found" });

  // Hide all this vendor's tickets from the platform.
  await db
    .collection("tickets")
    .updateMany({ vendorEmail: user.email }, { $set: { isHidden: true } });

  // Mark user as fraud.
  await db
    .collection("users")
    .updateOne({ _id: userId }, { $set: { isFraud: true } });

  res.json({ message: "Marked as fraud" });
});

module.exports = router;
