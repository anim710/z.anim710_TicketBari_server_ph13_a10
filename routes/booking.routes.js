const express = require("express");
const router = express.Router();
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");
const { ObjectId } = require("mongodb");

// POST create booking
router.post("/", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const booking = {
    ...req.body,
    status: "pending",
    createdAt: new Date(),
  };
  const result = await db.collection("bookings").insertOne(booking);
  res.json(result);
});

// GET user's bookings
router.get("/my", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const bookings = await db
    .collection("bookings")
    .find({ userEmail: req.user.email })
    .toArray();
  res.json(bookings);
});

// GET vendor's requested bookings
router.get("/vendor", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const bookings = await db
    .collection("bookings")
    .find({ vendorEmail: req.user.email })
    .toArray();
  res.json(bookings);
});

// PATCH accept/reject booking (vendor)
router.patch("/:id/status", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const { status } = req.body;
  const result = await db
    .collection("bookings")
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status } });
  res.json(result);
});

// DELETE cancel booking (user, only if pending)
router.delete("/:id", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const booking = await db
    .collection("bookings")
    .findOne({ _id: new ObjectId(req.params.id) });
  if (booking.status !== "pending")
    return res.status(400).json({ message: "Can only cancel pending bookings" });
  const result = await db
    .collection("bookings")
    .deleteOne({ _id: new ObjectId(req.params.id) });
  res.json(result);
});

module.exports = router;