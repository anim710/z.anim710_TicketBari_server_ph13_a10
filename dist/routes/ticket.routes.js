import { Router } from "express";
import { AppError } from "../errors/AppError.js";
import connectDB from "../lib/db.js";
import { parseObjectId } from "../lib/objectId.js";
import verifyJWT from "../middleware/verifyJWT.js";
import { verifyVendor } from "../middleware/verifyRole.js";
import { validate } from "../middleware/validate.js";
import { createTicketSchema, objectIdParamSchema, ticketListQuerySchema, updateTicketSchema, } from "../schemas/index.js";
const router = Router();
const IMMUTABLE_TICKET_FIELDS = [
    "verificationStatus",
    "vendorEmail",
    "vendorName",
    "isAdvertised",
    "isHidden",
    "createdAt",
    "_id",
];
function stripImmutableFields(body) {
    const cleaned = { ...body };
    for (const f of IMMUTABLE_TICKET_FIELDS) {
        delete cleaned[f];
    }
    return cleaned;
}
// GET all approved tickets (public) with search, filter, sort, pagination
router.get("/", validate({ query: ticketListQuerySchema }), async (req, res) => {
    const db = await connectDB();
    const { from, to, type, sort, page } = req.query;
    const limit = 9;
    const skip = (page - 1) * limit;
    const query = {
        verificationStatus: "approved",
        isHidden: { $ne: true },
    };
    if (from)
        query.from = { $regex: from, $options: "i" };
    if (to)
        query.to = { $regex: to, $options: "i" };
    if (type)
        query.transportType = type;
    const sortOption = {};
    if (sort === "low")
        sortOption.price = 1;
    if (sort === "high")
        sortOption.price = -1;
    const total = await db.collection("tickets").countDocuments(query);
    const tickets = await db
        .collection("tickets")
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray();
    res.json({ tickets, total, page, pages: Math.ceil(total / limit) });
});
// GET latest 8 tickets
router.get("/latest", async (_req, res) => {
    const db = await connectDB();
    const tickets = await db
        .collection("tickets")
        .find({ verificationStatus: "approved", isHidden: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray();
    res.json(tickets);
});
// GET advertised tickets (max 6)
router.get("/advertised", async (_req, res) => {
    const db = await connectDB();
    const tickets = await db
        .collection("tickets")
        .find({ isAdvertised: true, isHidden: { $ne: true } })
        .limit(6)
        .toArray();
    res.json(tickets);
});
// GET vendor's own tickets — must be before /:id
router.get("/vendor/my-tickets", verifyJWT, async (req, res) => {
    const db = await connectDB();
    const tickets = await db
        .collection("tickets")
        .find({ vendorEmail: req.user.email })
        .toArray();
    res.json(tickets);
});
// GET single ticket
router.get("/:id", validate({ params: objectIdParamSchema }), async (req, res) => {
    const db = await connectDB();
    const ticket = await db
        .collection("tickets")
        .findOne({ _id: parseObjectId(req.params.id) });
    if (!ticket)
        throw new AppError(404, "Not found");
    res.json(ticket);
});
// POST add ticket (vendor only)
router.post("/", verifyJWT, verifyVendor, validate({ body: createTicketSchema }), async (req, res) => {
    const db = await connectDB();
    const vendor = await db
        .collection("users")
        .findOne({ email: req.user.email });
    if (vendor?.isFraud)
        throw new AppError(403, "Account suspended");
    const body = stripImmutableFields(req.body);
    const ticket = {
        ...body,
        vendorEmail: req.user.email,
        vendorName: req.user.name,
        verificationStatus: "pending",
        isAdvertised: false,
        isHidden: false,
        createdAt: new Date(),
    };
    const result = await db.collection("tickets").insertOne(ticket);
    res.json(result);
});
// PATCH update ticket (owner vendor or admin)
router.patch("/:id", verifyJWT, validate({ params: objectIdParamSchema, body: updateTicketSchema }), async (req, res) => {
    const db = await connectDB();
    const ticketId = parseObjectId(req.params.id, "ticket id");
    const ticket = await db.collection("tickets").findOne({ _id: ticketId });
    if (!ticket)
        throw new AppError(404, "Ticket not found");
    const isOwner = ticket.vendorEmail === req.user.email;
    if (req.user.role !== "admin" && !isOwner) {
        throw new AppError(403, "Not allowed");
    }
    if (ticket.verificationStatus === "rejected" && req.user.role !== "admin") {
        throw new AppError(400, "Rejected tickets cannot be edited");
    }
    const body = stripImmutableFields(req.body);
    const result = await db
        .collection("tickets")
        .updateOne({ _id: ticketId }, { $set: body });
    res.json(result);
});
// DELETE ticket (owner vendor or admin)
router.delete("/:id", verifyJWT, validate({ params: objectIdParamSchema }), async (req, res) => {
    const db = await connectDB();
    const ticketId = parseObjectId(req.params.id, "ticket id");
    const ticket = await db.collection("tickets").findOne({ _id: ticketId });
    if (!ticket)
        throw new AppError(404, "Ticket not found");
    const isOwner = ticket.vendorEmail === req.user.email;
    if (req.user.role !== "admin" && !isOwner) {
        throw new AppError(403, "Not allowed");
    }
    if (ticket.verificationStatus === "rejected" && req.user.role !== "admin") {
        throw new AppError(400, "Rejected tickets cannot be deleted");
    }
    const result = await db.collection("tickets").deleteOne({ _id: ticketId });
    res.json(result);
});
export default router;
//# sourceMappingURL=ticket.routes.js.map