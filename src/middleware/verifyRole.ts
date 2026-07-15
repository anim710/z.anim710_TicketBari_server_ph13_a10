import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

export function verifyAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    throw new AppError(403, "Admin only");
  }
  next();
}

export function verifyVendor(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== "vendor") {
    throw new AppError(403, "Vendors only");
  }
  next();
}
