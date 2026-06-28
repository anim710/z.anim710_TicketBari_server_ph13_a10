const express = require("express");
const router = express.Router();
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");
const { verifyVendor } = require("../middleware/verifyRole");
const { ObjectId } = require("mongodb");

// Fields a vendor must never be able to set/change via create or update.
const IMMUTABLE_TICKET_FIELDS = [
  "verificationStatus",
  "vendorEmail",
  "vendorName",
  "isAdvertised",
  "isHidden",
  "createdAt",
  "_id",
];

// GET all approved tickets (public) with search, filter, sort, pagination
router.get("/", async (req, res) => {
  const db = await connectDB();
  const { from, to, type, sort, page = 1 } = req.query;
  const limit = 9;
  const skip = (parseInt(page) - 1) * limit;

  let query = { verificationStatus: "approved", isHidden: { $ne: true } };
  if (from) query.from = { $regex: from, $options: "i" };
  if (to) query.to = { $regex: to, $options: "i" };
  if (type) query.transportType = type;

  let sortOption = {};
  if (sort === "low") sortOption.price = 1;
  if (sort === "high") sortOption.price = -1;

  const total = await db.collection("tickets").countDocuments(query);
  const tickets = await db
    .collection("tickets")
    .find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .toArray();

  res.json({ tickets, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// GET latest 8 tickets
router.get("/latest", async (req, res) => {
  const db = await connectDB();
  const tickets = await db
    .collection("tickets")
    .find({ verificationStatus: "approved", isHidden: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(8)
    .toArray();
  res.json(tickets);
});

// GET advertised tickets (max 6)
router.get("/advertised", async (req, res) => {
  const db = await connectDB();
  const tickets = await db
    .collection("tickets")
    .find({ isAdvertised: true, isHidden: { $ne: true } })
    .limit(6)
    .toArray();
  res.json(tickets);
});

// GET single ticket
router.get("/:id", async (req, res) => {
  const db = await connectDB();
  const ticket = await db
    .collection("tickets")
    .findOne({ _id: new ObjectId(req.params.id) });
  if (!ticket) return res.status(404).json({ message: "Not found" });
  res.json(ticket);
});

// POST add ticket (vendor only)
router.post("/", verifyJWT, verifyVendor, async (req, res) => {
  const db = await connectDB();

  // Block fraud-flagged vendors from adding tickets.
  const vendor = await db.collection("users").findOne({ email: req.user.email });
  if (vendor?.isFraud)
    return res.status(403).json({ message: "Account suspended" });

  const body = { ...req.body };
  IMMUTABLE_TICKET_FIELDS.forEach((f) => delete body[f]);

  const ticket = {
    ...body,
    vendorEmail: req.user.email,
    vendorName: req.user.name,
    verificationStatus: "pending",
    isAdvertised: false,
    isHidden: false,
    createdAt: new Date(),
  };
  const result = await db.collection("tickets").insertOne(ticket);
  res.json(result);
});

// PATCH update ticket (owner vendor or admin)
router.patch("/:id", verifyJWT, async (req, res) => {
  const db = await connectDB();
  let ticketId;
  try {
    ticketId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: "Invalid ticket id" });
  }

  const ticket = await db.collection("tickets").findOne({ _id: ticketId });
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  const isOwner = ticket.vendorEmail === req.user.email;
  if (req.user.role !== "admin" && !isOwner)
    return res.status(403).json({ message: "Not allowed" });

  if (ticket.verificationStatus === "rejected" && req.user.role !== "admin")
    return res.status(400).json({ message: "Rejected tickets cannot be edited" });

  const body = { ...req.body };
  IMMUTABLE_TICKET_FIELDS.forEach((f) => delete body[f]);

  const result = await db
    .collection("tickets")
    .updateOne({ _id: ticketId }, { $set: body });
  res.json(result);
});

// DELETE ticket (owner vendor or admin)
router.delete("/:id", verifyJWT, async (req, res) => {
  const db = await connectDB();
  let ticketId;
  try {
    ticketId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: "Invalid ticket id" });
  }

  const ticket = await db.collection("tickets").findOne({ _id: ticketId });
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  const isOwner = ticket.vendorEmail === req.user.email;
  if (req.user.role !== "admin" && !isOwner)
    return res.status(403).json({ message: "Not allowed" });

  if (ticket.verificationStatus === "rejected" && req.user.role !== "admin")
    return res.status(400).json({ message: "Rejected tickets cannot be deleted" });

  const result = await db.collection("tickets").deleteOne({ _id: ticketId });
  res.json(result);
});

// GET vendor's own tickets
router.get("/vendor/my-tickets", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const tickets = await db
    .collection("tickets")
    .find({ vendorEmail: req.user.email })
    .toArray();
  res.json(tickets);
});

module.exports = router;