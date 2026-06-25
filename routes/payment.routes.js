const express = require("express");
const router = express.Router();
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { ObjectId } = require("mongodb");

// Create payment intent
router.post("/create-payment-intent", verifyJWT, async (req, res) => {
  const { amount } = req.body; // amount in BDT (we convert to paisa)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "bdt",
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});

// Save transaction after payment success
router.post("/save", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const { bookingId, ticketId, transactionId, amount, ticketTitle } = req.body;

  // Save transaction
  await db.collection("transactions").insertOne({
    userEmail: req.user.email,
    bookingId,
    ticketId,
    transactionId,
    amount,
    ticketTitle,
    paidAt: new Date(),
  });

  // Update booking status to paid
  await db
    .collection("bookings")
    .updateOne({ _id: new ObjectId(bookingId) }, { $set: { status: "paid" } });

  // Reduce ticket quantity
  const booking = await db
    .collection("bookings")
    .findOne({ _id: new ObjectId(bookingId) });
  await db
    .collection("tickets")
    .updateOne(
      { _id: new ObjectId(ticketId) },
      { $inc: { quantity: -booking.quantity } }
    );

  res.json({ message: "Payment saved" });
});

// GET user transactions
router.get("/my", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const transactions = await db
    .collection("transactions")
    .find({ userEmail: req.user.email })
    .toArray();
  res.json(transactions);
});

module.exports = router;