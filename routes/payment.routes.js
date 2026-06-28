const express = require("express");
const router = express.Router();
const connectDB = require("../lib/db");
const verifyJWT = require("../middleware/verifyJWT");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { ObjectId } = require("mongodb");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Create a Stripe Checkout Session for an accepted booking.
// A fresh Product + Price is generated per checkout, with the unit price
// pulled from the ticket in the database.
router.post("/create-checkout-session", verifyJWT, async (req, res) => {
  try {
    const db = await connectDB();
    const { bookingId } = req.body;

    let bookingObjId;
    try {
      bookingObjId = new ObjectId(bookingId);
    } catch {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await db.collection("bookings").findOne({ _id: bookingObjId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only the booking owner can pay for it.
    if (booking.userEmail !== req.user.email)
      return res.status(403).json({ message: "Not allowed" });

    if (booking.status === "paid")
      return res.status(400).json({ message: "Booking already paid" });

    if (booking.status !== "accepted")
      return res.status(400).json({ message: "Booking is not accepted yet" });

    if (booking.departureDate && new Date(booking.departureDate) < new Date())
      return res.status(400).json({ message: "Departure time has passed" });

    // Authoritative price comes from the ticket in the database.
    let ticket;
    try {
      ticket = await db
        .collection("tickets")
        .findOne({ _id: new ObjectId(booking.ticketId) });
    } catch {
      return res.status(400).json({ message: "Invalid ticket reference" });
    }
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const quantity = booking.quantity || 1;
    if (ticket.quantity < quantity)
      return res.status(400).json({ message: "Not enough seats left" });

    // 1. Create a Product for this ticket purchase.
    const product = await stripe.products.create({
      name: ticket.title,
      metadata: { ticketId: String(ticket._id) },
    });

    // 2. Create a Price (unit price from DB) tied to the product.
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(ticket.price * 100), // BDT -> paisa
      currency: "bdt",
    });

    // 3. Create the Checkout Session.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price.id, quantity }],
      success_url: `${CLIENT_URL}/payment-result?status=success&bookingId=${bookingId}`,
      cancel_url: `${CLIENT_URL}/payment-result?status=cancel&bookingId=${bookingId}`,
      customer_email: booking.userEmail,
      metadata: {
        bookingId: String(booking._id),
        ticketId: String(ticket._id),
        userEmail: booking.userEmail,
        ticketTitle: ticket.title,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    res.status(500).json({ message: "Could not create checkout session" });
  }
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
