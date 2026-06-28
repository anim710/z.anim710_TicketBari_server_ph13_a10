require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { toNodeHandler } = require("better-auth/node");
const connectDB = require("./lib/db");

// Routes
const authRoutes    = require("./routes/auth.routes");
const ticketRoutes  = require("./routes/ticket.routes");
const bookingRoutes = require("./routes/booking.routes");
const userRoutes    = require("./routes/user.routes");
const adminRoutes   = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");
const stripeWebhook = require("./routes/stripeWebhook");

const app = express();

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── BetterAuth — handles Google OAuth routes ──────────────────
// Mounted at /api/auth/better/* via toNodeHandler. This MUST come before
// express.json() because BetterAuth reads the raw request body itself.
const auth = require("./lib/auth");
app.all("/api/auth/better/*splat", toNodeHandler(auth));

// ── Stripe webhook ────────────────────────────────────────────
// MUST come before express.json() and use the raw body parser so the
// Stripe signature can be verified against the unparsed payload.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// JSON body parsing for our own routes (after the BetterAuth handler)
app.use(express.json());

// ── Connect MongoDB ───────────────────────────────────────────
connectDB();

// ── Health check ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "TicketBari server running ✅", time: new Date() });
});

// ── Our custom API routes ─────────────────────────────────────
app.use("/api/auth",     authRoutes);    // register, login, google-save, me
app.use("/api/tickets",  ticketRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/payments", paymentRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});