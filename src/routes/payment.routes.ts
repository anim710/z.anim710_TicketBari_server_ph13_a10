import { Router } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";
import connectDB from "../lib/db.js";
import { parseObjectId } from "../lib/objectId.js";
import verifyJWT from "../middleware/verifyJWT.js";
import { validate } from "../middleware/validate.js";
import { checkoutSchema } from "../schemas/index.js";
import type { BookingDoc, TicketDoc } from "../types/models.js";

const router = Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Create a Stripe Checkout Session for an accepted booking.
router.post(
  "/create-checkout-session",
  verifyJWT,
  validate({ body: checkoutSchema }),
  async (req, res) => {
    const db = await connectDB();
    const { bookingId } = req.body as { bookingId: string };
    const bookingObjId = parseObjectId(bookingId, "booking id");

    const booking = await db
      .collection<BookingDoc>("bookings")
      .findOne({ _id: bookingObjId });
    if (!booking) throw new AppError(404, "Booking not found");

    if (booking.userEmail !== req.user!.email) {
      throw new AppError(403, "Not allowed");
    }

    if (booking.status === "paid") {
      throw new AppError(400, "Booking already paid");
    }

    if (booking.status !== "accepted") {
      throw new AppError(400, "Booking is not accepted yet");
    }

    if (booking.departureDate && new Date(booking.departureDate) < new Date()) {
      throw new AppError(400, "Departure time has passed");
    }

    let ticket: TicketDoc | null;
    try {
      ticket = await db
        .collection<TicketDoc>("tickets")
        .findOne({ _id: parseObjectId(String(booking.ticketId), "ticket reference") });
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(400, "Invalid ticket reference");
    }
    if (!ticket) throw new AppError(404, "Ticket not found");

    const quantity = booking.quantity || 1;
    if (ticket.quantity < quantity) {
      throw new AppError(400, "Not enough seats left");
    }

    const product = await stripe.products.create({
      name: ticket.title,
      metadata: { ticketId: String(ticket._id) },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(ticket.price * 100),
      currency: "bdt",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price.id, quantity }],
      success_url: `${env.CLIENT_URL}/payment-result?status=success&bookingId=${bookingId}`,
      cancel_url: `${env.CLIENT_URL}/payment-result?status=cancel&bookingId=${bookingId}`,
      customer_email: booking.userEmail,
      metadata: {
        bookingId: String(booking._id),
        ticketId: String(ticket._id),
        userEmail: booking.userEmail,
        ticketTitle: ticket.title,
      },
    });

    res.json({ url: session.url });
  }
);

// GET user transactions
router.get("/my", verifyJWT, async (req, res) => {
  const db = await connectDB();
  const transactions = await db
    .collection("transactions")
    .find({ userEmail: req.user!.email })
    .toArray();
  res.json(transactions);
});

export default router;
