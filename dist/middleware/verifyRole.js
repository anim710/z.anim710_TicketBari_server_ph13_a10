import { AppError } from "../errors/AppError.js";
export function verifyAdmin(req, _res, next) {
    if (req.user?.role !== "admin") {
        throw new AppError(403, "Admin only");
    }
    next();
}
export function verifyVendor(req, _res, next) {
    if (req.user?.role !== "vendor") {
        throw new AppError(403, "Vendors only");
    }
    next();
}
//# sourceMappingURL=verifyRole.js.map