import { Router } from "express";
import { AppError } from "../errors/AppError.js";
import connectDB from "../lib/db.js";
import { parseObjectId } from "../lib/objectId.js";
import verifyJWT from "../middleware/verifyJWT.js";
import { validate } from "../middleware/validate.js";
import { bookingStatusSchema, createBookingSchema, objectIdParamSchema, } from "../schemas/index.js";
const router = Router();
// POST create booking
router.post("/", verifyJWT, validate({ body: createBookingSchema }), async (req, res) => {
    const db = await connectDB();
    const booking = {
        ...req.body,
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
router.patch("/:id/status", verifyJWT, validate({ params: objectIdParamSchema, body: bookingStatusSchema }), async (req, res) => {
    const db = await connectDB();
    const { status } = req.body;
    const bookingId = parseObjectId(req.params.id, "booking id");
    const booking = await db
        .collection("bookings")
        .findOne({ _id: bookingId });
    if (!booking)
        throw new AppError(404, "Booking not found");
    if (booking.vendorEmail !== req.user.email) {
        throw new AppError(403, "Not allowed");
    }
    if (booking.status !== "pending") {
        throw new AppError(400, "Only pending bookings can be updated");
    }
    const result = await db
        .collection("bookings")
        .updateOne({ _id: bookingId }, { $set: { status } });
    res.json(result);
});
// DELETE cancel booking (owner user, only if pending)
router.delete("/:id", verifyJWT, validate({ params: objectIdParamSchema }), async (req, res) => {
    const db = await connectDB();
    const bookingId = parseObjectId(req.params.id, "booking id");
    const booking = await db
        .collection("bookings")
        .findOne({ _id: bookingId });
    if (!booking)
        throw new AppError(404, "Booking not found");
    if (booking.userEmail !== req.user.email) {
        throw new AppError(403, "Not allowed");
    }
    if (booking.status !== "pending") {
        throw new AppError(400, "Can only cancel pending bookings");
    }
    const result = await db.collection("bookings").deleteOne({ _id: bookingId });
    res.json(result);
});
export default router;
//# sourceMappingURL=booking.routes.js.map