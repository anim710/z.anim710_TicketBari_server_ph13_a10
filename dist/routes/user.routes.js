import { Router } from "express";
import { AppError } from "../errors/AppError.js";
import connectDB from "../lib/db.js";
import { parseObjectId } from "../lib/objectId.js";
import verifyJWT from "../middleware/verifyJWT.js";
import { verifyAdmin } from "../middleware/verifyRole.js";
import { validate } from "../middleware/validate.js";
import { objectIdParamSchema, userRoleSchema } from "../schemas/index.js";
const router = Router();
// GET all users (admin)
router.get("/", verifyJWT, verifyAdmin, async (_req, res) => {
    const db = await connectDB();
    const users = await db
        .collection("users")
        .find({}, { projection: { password: 0 } })
        .toArray();
    res.json(users);
});
// PATCH change user role (admin)
router.patch("/:id/role", verifyJWT, verifyAdmin, validate({ params: objectIdParamSchema, body: userRoleSchema }), async (req, res) => {
    const { role } = req.body;
    const userId = parseObjectId(req.params.id, "user id");
    const db = await connectDB();
    const result = await db
        .collection("users")
        .updateOne({ _id: userId }, { $set: { role } });
    res.json(result);
});
// PATCH mark vendor as fraud (admin)
router.patch("/:id/fraud", verifyJWT, verifyAdmin, validate({ params: objectIdParamSchema }), async (req, res) => {
    const userId = parseObjectId(req.params.id, "user id");
    const db = await connectDB();
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user)
        throw new AppError(404, "User not found");
    await db
        .collection("tickets")
        .updateMany({ vendorEmail: user.email }, { $set: { isHidden: true } });
    await db.collection("users").updateOne({ _id: userId }, { $set: { isFraud: true } });
    res.json({ message: "Marked as fraud" });
});
export default router;
//# sourceMappingURL=user.routes.js.map