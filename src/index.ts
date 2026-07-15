import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import connectDB from "./lib/db.js";
import auth from "./lib/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import stripeWebhook from "./routes/stripeWebhook.js";

const app = express();

app.use(
  cors({
    origin: [env.CLIENT_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// BetterAuth — MUST come before express.json()
app.all("/api/auth/better/*splat", toNodeHandler(auth));

// Stripe webhook — MUST come before express.json() with raw body
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "TicketBari server running ✅", time: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
