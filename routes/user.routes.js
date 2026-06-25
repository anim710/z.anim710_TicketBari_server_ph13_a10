const express = require("express");
const router = express.Router();
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");
const { ObjectId } = require("mongodb");

// GET all users (admin)
router.get("/", verifyJWT, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  const db = await connectDB();
  const users = await db.collection("users").find().toArray();
  res.json(users);
});

// PATCH change user role (admin)
router.patch("/:id/role", verifyJWT, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  const db = await connectDB();
  const { role } = req.body;
  const result = await db
    .collection("users")
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { role } });
  res.json(result);
});

// PATCH mark vendor as fraud
router.patch("/:id/fraud", verifyJWT, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  const db = await connectDB();
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(req.params.id) });

  // Hide all vendor tickets
  await db
    .collection("tickets")
    .updateMany({ vendorEmail: user.email }, { $set: { isHidden: true } });

  // Mark user as fraud
  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { isFraud: true } });

  res.json({ message: "Marked as fraud" });
});

module.exports = router;