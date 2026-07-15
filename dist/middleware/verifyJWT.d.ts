import type { NextFunction, Request, Response } from "express";
export declare function verifyJWT(req: Request, _res: Response, next: NextFunction): void;
export default verifyJWT;
