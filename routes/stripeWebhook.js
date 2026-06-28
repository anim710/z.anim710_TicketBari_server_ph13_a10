const connectDB = require("../lib/db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { ObjectId } = require("mongodb");

// Stripe webhook handler. MUST be mounted with express.raw (NOT express.json)
// so the raw body is available for signature verification.
async function stripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { bookingId, ticketId, userEmail, ticketTitle } = session.metadata || {};

    try {
      const db = await connectDB();

      let bookingObjId;
      try {
        bookingObjId = new ObjectId(bookingId);
      } catch {
        // Bad metadata — acknowledge so Stripe doesn't keep retrying.
        return res.json({ received: true });
      }

      const booking = await db.collection("bookings").findOne({ _id: bookingObjId });

      // Idempotency: skip if already processed or missing.
      if (!booking || booking.status === "paid") {
        return res.json({ received: true });
      }

      // Save transaction.
      await db.collection("transactions").insertOne({
        userEmail: userEmail || booking.userEmail,
        bookingId,
        ticketId,
        transactionId: session.payment_intent || session.id,
        amount: (session.amount_total || 0) / 100,
        ticketTitle: ticketTitle || booking.ticketTitle,
        paidAt: new Date(),
      });

      // Mark booking paid.
      await db
        .collection("bookings")
        .updateOne({ _id: bookingObjId }, { $set: { status: "paid" } });

      // Decrement ticket quantity.
      try {
        await db
          .collection("tickets")
          .updateOne(
            { _id: new ObjectId(ticketId) },
            { $inc: { quantity: -(booking.quantity || 1) } }
          );
      } catch {
        /* invalid ticket id — booking is still marked paid */
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
      // Return 500 so Stripe retries delivery.
      return res.status(500).json({ message: "Webhook processing failed" });
    }
  }

  res.json({ received: true });
}

module.exports = stripeWebhook;
