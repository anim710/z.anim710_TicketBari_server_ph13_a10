import Stripe from "stripe";
import { env } from "../config/env.js";
import connectDB from "../lib/db.js";
import { ObjectId } from "mongodb";
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
// Stripe webhook handler. MUST be mounted with express.raw (NOT express.json)
// so the raw body is available for signature verification.
// Intentionally returns 500 on processing failure so Stripe retries.
export async function stripeWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    if (!sig || Array.isArray(sig)) {
        res.status(400).send("Webhook Error: missing stripe-signature");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Webhook signature verification failed:", message);
        res.status(400).send(`Webhook Error: ${message}`);
        return;
    }
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { bookingId, ticketId, userEmail, ticketTitle } = session.metadata || {};
        try {
            const db = await connectDB();
            let bookingObjId;
            try {
                bookingObjId = new ObjectId(bookingId);
            }
            catch {
                // Bad metadata — acknowledge so Stripe doesn't keep retrying.
                res.json({ received: true });
                return;
            }
            const booking = await db
                .collection("bookings")
                .findOne({ _id: bookingObjId });
            // Idempotency: skip if already processed or missing.
            if (!booking || booking.status === "paid") {
                res.json({ received: true });
                return;
            }
            await db.collection("transactions").insertOne({
                userEmail: userEmail || booking.userEmail,
                bookingId,
                ticketId,
                transactionId: session.payment_intent || session.id,
                amount: (session.amount_total || 0) / 100,
                ticketTitle: ticketTitle || booking.ticketTitle,
                paidAt: new Date(),
            });
            await db
                .collection("bookings")
                .updateOne({ _id: bookingObjId }, { $set: { status: "paid" } });
            try {
                await db.collection("tickets").updateOne({ _id: new ObjectId(ticketId) }, { $inc: { quantity: -(booking.quantity || 1) } });
            }
            catch {
                /* invalid ticket id — booking is still marked paid */
            }
        }
        catch (err) {
            console.error("Webhook processing error:", err);
            // Return 500 so Stripe retries delivery.
            res.status(500).json({ message: "Webhook processing failed" });
            return;
        }
    }
    res.json({ received: true });
}
export default stripeWebhook;
//# sourceMappingURL=stripeWebhook.js.map