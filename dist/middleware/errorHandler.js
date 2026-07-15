import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";
export function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message,
            ...(err.details !== undefined ? { details: err.details } : {}),
        });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({
            message: "Validation failed",
            details: err.flatten(),
        });
        return;
    }
    // MongoDB BSON ObjectId errors (invalid hex / wrong length)
    if (err instanceof Error &&
        (err.name === "BSONError" ||
            err.name === "BSONTypeError" ||
            /ObjectId/i.test(err.message))) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
}
export function notFoundHandler(req, _res, next) {
    next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
}
//# sourceMappingURL=errorHandler.js.map