require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./lib/db");

// Routes
const authRoutes    = require("./routes/auth.routes");
const ticketRoutes  = require("./routes/ticket.routes");
const bookingRoutes = require("./routes/booking.routes");
const userRoutes    = require("./routes/user.routes");
const adminRoutes   = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");

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

app.use(express.json());

// ── Connect MongoDB ───────────────────────────────────────────
connectDB();

// ── BetterAuth — handles Google OAuth routes ──────────────────
// Mounts at /api/auth/better/* so it doesn't clash with our routes
const auth = require("./lib/auth");
app.all("/api/auth/better/{*splat}", (req, res) => {
  // 1. Determine the host protocol (http or https) dynamically
  const protocol = req.protocol; 
  const host = req.get("host"); // returns "localhost:5000"

  // 2. Rewrite path so BetterAuth sees it without the /better prefix
  const rewrittenPath = req.url.replace("/api/auth/better", "/api/auth");

  // 3. Fix: Re-construct a complete, absolute URL so BetterAuth's internal `new URL()` doesn't crash
  req.url = `${protocol}://${host}${rewrittenPath}`;

  return auth.handler(req, res);
});

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