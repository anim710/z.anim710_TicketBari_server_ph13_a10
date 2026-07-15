import { Router } from "express";
import { AppError } from "../errors/AppError.js";
import connectDB from "../lib/db.js";
import { parseObjectId } from "../lib/objectId.js";
import verifyJWT from "../middleware/verifyJWT.js";
import { verifyAdmin } from "../middleware/verifyRole.js";
import { validate } from "../middleware/validate.js";
import { objectIdParamSchema, verifyTicketSchema } from "../schemas/index.js";
import type { TicketDoc } from "../types/models.js";

const router = Router();

// GET all tickets for admin
router.get("/tickets", verifyJWT, verifyAdmin, async (_req, res) => {
  const db = await connectDB();
  const tickets = await db.collection("tickets").find().toArray();
  res.json(tickets);
});

// PATCH approve or reject ticket
router.patch(
  "/tickets/:id/verify",
  verifyJWT,
  verifyAdmin,
  validate({ params: objectIdParamSchema, body: verifyTicketSchema }),
  async (req, res) => {
    const { verificationStatus } = req.body as {
      verificationStatus: "approved" | "rejected" | "pending";
    };
    const ticketId = parseObjectId(req.params.id, "ticket id");

    const db = await connectDB();
    const result = await db
      .collection("tickets")
      .updateOne({ _id: ticketId }, { $set: { verificationStatus } });
    res.json(result);
  }
);

// PATCH toggle advertise
router.patch(
  "/tickets/:id/advertise",
  verifyJWT,
  verifyAdmin,
  validate({ params: objectIdParamSchema }),
  async (req, res) => {
    const ticketId = parseObjectId(req.params.id, "ticket id");

    const db = await connectDB();
    const ticket = await db.collection<TicketDoc>("tickets").findOne({ _id: ticketId });
    if (!ticket) throw new AppError(404, "Ticket not found");

    if (!ticket.isAdvertised) {
      const count = await db
        .collection("tickets")
        .countDocuments({ isAdvertised: true });
      if (count >= 6) {
        throw new AppError(400, "Max 6 advertised tickets allowed");
      }
    }

    const result = await db
      .collection("tickets")
      .updateOne({ _id: ticketId }, { $set: { isAdvertised: !ticket.isAdvertised } });
    res.json(result);
  }
);

export default router;
