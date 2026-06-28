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
    // Trust the token, not the client body, for the booking owner.
    userEmail: req.user.email,
    userName: req.user.name,
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

// PATCH accept/reject booking (owner vendor only)
router.patch("/:id/status", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status))
    return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'" });

  let bookingId;
  try {
    bookingId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: "Invalid booking id" });
  }

  const booking = await db.collection("bookings").findOne({ _id: bookingId });
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (booking.vendorEmail !== req.user.email)
    return res.status(403).json({ message: "Not allowed" });

  if (booking.status !== "pending")
    return res.status(400).json({ message: "Only pending bookings can be updated" });

  const result = await db
    .collection("bookings")
    .updateOne({ _id: bookingId }, { $set: { status } });
  res.json(result);
});

// DELETE cancel booking (owner user, only if pending)
router.delete("/:id", verifyJWT, async (req, res) => {
  const db = await connectDB();
  let bookingId;
  try {
    bookingId = new ObjectId(req.params.id);
  } catch {
    return res.status(400).json({ message: "Invalid booking id" });
  }

  const booking = await db.collection("bookings").findOne({ _id: bookingId });
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (booking.userEmail !== req.user.email)
    return res.status(403).json({ message: "Not allowed" });

  if (booking.status !== "pending")
    return res.status(400).json({ message: "Can only cancel pending bookings" });

  const result = await db.collection("bookings").deleteOne({ _id: bookingId });
  res.json(result);
});

module.exports = router;