import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";
import connectDB from "../lib/db.js";
import verifyJWT from "../middleware/verifyJWT.js";
import { validate } from "../middleware/validate.js";
import { googleSaveSchema, loginSchema, registerSchema, } from "../schemas/index.js";
const router = Router();
function createToken(user) {
    const payload = {
        email: user.email,
        role: user.role || "user",
        name: user.name,
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}
// POST /api/auth/register
router.post("/register", validate({ body: registerSchema }), async (req, res) => {
    const { name, email, password } = req.body;
    const db = await connectDB();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
        throw new AppError(409, "Email already registered");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        name,
        email,
        password: hashedPassword,
        role: "user",
        image: "",
        provider: "email",
        createdAt: new Date(),
    };
    await db.collection("users").insertOne(newUser);
    const token = createToken(newUser);
    res.status(201).json({
        message: "Registered successfully",
        token,
        user: { name, email, role: "user", image: "" },
    });
});
// POST /api/auth/login
router.post("/login", validate({ body: loginSchema }), async (req, res) => {
    const { email, password } = req.body;
    const db = await connectDB();
    const user = await db.collection("users").findOne({ email });
    if (!user) {
        throw new AppError(401, "No account found with this email");
    }
    if (user.provider === "google") {
        throw new AppError(401, "This email uses Google login. Please click 'Continue with Google'");
    }
    if (!user.password) {
        throw new AppError(401, "Incorrect password");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError(401, "Incorrect password");
    }
    if (user.isFraud) {
        throw new AppError(403, "Account suspended");
    }
    const token = createToken(user);
    res.json({
        message: "Login successful",
        token,
        user: {
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image || "",
        },
    });
});
// POST /api/auth/google-save
router.post("/google-save", validate({ body: googleSaveSchema }), async (req, res) => {
    const { name, email, image } = req.body;
    const db = await connectDB();
    const existing = await db.collection("users").findOne({ email });
    const set = {
        name: name || existing?.name || "Google User",
        image: image || existing?.image || "",
    };
    if (!existing?.provider)
        set.provider = "google";
    // Must not put role in both $set and $setOnInsert — Mongo rejects conflicting paths.
    if (!existing?.role)
        set.role = "user";
    await db.collection("users").updateOne({ email }, { $set: set, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    const user = await db.collection("users").findOne({ email });
    if (!user) {
        throw new AppError(500, "Failed to load user after Google save");
    }
    if (user.isFraud) {
        throw new AppError(403, "Account suspended");
    }
    const token = createToken(user);
    res.json({
        message: "Google login successful",
        token,
        user: {
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image || "",
        },
    });
});
// GET /api/auth/me
router.get("/me", verifyJWT, async (req, res) => {
    const db = await connectDB();
    const user = await db.collection("users").findOne({ email: req.user.email }, { projection: { password: 0 } });
    if (!user) {
        throw new AppError(404, "User not found");
    }
    res.json(user);
});
export default router;
//# sourceMappingURL=auth.routes.js.map