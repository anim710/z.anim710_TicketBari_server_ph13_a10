const express = require("express");
const router = express.Router();
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");
const { verifyAdmin } = require("../middleware/verifyRole");
const { ObjectId } = require("mongodb");

// GET all tickets for admin
router.get("/tickets", verifyJWT, verifyAdmin, async (req, res) => {
  const db = await connectDB();
  const tickets = await db.collection("tickets").find().toArray();
  res.json(tickets);
});

// PATCH approve or reject ticket
router.patch("/tickets/:id/verify", verifyJWT, verifyAdmin, async (req, res) => {
  const { verificationStatus } = req.body;
  if (!["approved", "rejected", "pending"].includes(verificationStatus))
    return res.status(400).json({ message: "Invalid verification status" });

  let ticketId;
  try {
    ticketId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: "Invalid ticket id" });
  }

  const db = await connectDB();
  const result = await db
    .collection("tickets")
    .updateOne({ _id: ticketId }, { $set: { verificationStatus } });
  res.json(result);
});

// PATCH toggle advertise
router.patch("/tickets/:id/advertise", verifyJWT, verifyAdmin, async (req, res) => {
  let ticketId;
  try {
    ticketId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: "Invalid ticket id" });
  }

  const db = await connectDB();
  const ticket = await db.collection("tickets").findOne({ _id: ticketId });
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  // Max 6 advertised at a time.
  if (!ticket.isAdvertised) {
    const count = await db
      .collection("tickets")
      .countDocuments({ isAdvertised: true });
    if (count >= 6)
      return res.status(400).json({ message: "Max 6 advertised tickets allowed" });
  }

  const result = await db
    .collection("tickets")
    .updateOne({ _id: ticketId }, { $set: { isAdvertised: !ticket.isAdvertised } });
  res.json(result);
});

module.exports = router;
