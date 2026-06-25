const express = require("express");
const router = express.Router();
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");
const { ObjectId } = require("mongodb");

// GET all tickets for admin
router.get("/tickets", verifyJWT, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  const db = await connectDB();
  const tickets = await db.collection("tickets").find().toArray();
  res.json(tickets);
});

// PATCH approve or reject ticket
router.patch("/tickets/:id/verify", verifyJWT, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  const db = await connectDB();
  const { verificationStatus } = req.body;
  const result = await db
    .collection("tickets")
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { verificationStatus } }
    );
  res.json(result);
});

// PATCH toggle advertise
router.patch("/tickets/:id/advertise", verifyJWT, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  const db = await connectDB();

  const ticket = await db
    .collection("tickets")
    .findOne({ _id: new ObjectId(req.params.id) });

  // Max 6 advertised
  if (!ticket.isAdvertised) {
    const count = await db
      .collection("tickets")
      .countDocuments({ isAdvertised: true });
    if (count >= 6)
      return res.status(400).json({ message: "Max 6 advertised tickets allowed" });
  }

  const result = await db
    .collection("tickets")
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isAdvertised: !ticket.isAdvertised } }
    );
  res.json(result);
});

module.exports = router;