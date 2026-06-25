require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./lib/db");

const authRoutes = require("./routes/auth.routes");
const ticketRoutes = require("./routes/ticket.routes");
const bookingRoutes = require("./routes/booking.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

app.use(cors({ origin: [process.env.CLIENT_URL], credentials: true }));
app.use(express.json());

// Connect DB on startup
connectDB();

app.get("/", (req, res) => res.send("TicketBari server running ✅"));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));