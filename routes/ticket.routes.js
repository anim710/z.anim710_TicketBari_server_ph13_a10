const express = require("express");
const router = express.Router();
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");
const { ObjectId } = require("mongodb");

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
router.post("/", verifyJWT, async (req, res) => {
  if (req.user.role !== "vendor")
    return res.status(403).json({ message: "Vendors only" });

  const db = await connectDB();
  const ticket = {
    ...req.body,
    verificationStatus: "pending",
    isAdvertised: false,
    isHidden: false,
    createdAt: new Date(),
  };
  const result = await db.collection("tickets").insertOne(ticket);
  res.json(result);
});

// PATCH update ticket (vendor only)
router.patch("/:id", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const result = await db
    .collection("tickets")
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
  res.json(result);
});

// DELETE ticket (vendor only)
router.delete("/:id", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const result = await db
    .collection("tickets")
    .deleteOne({ _id: new ObjectId(req.params.id) });
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