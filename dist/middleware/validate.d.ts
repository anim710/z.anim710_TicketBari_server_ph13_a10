import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
type Schemas = {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
};
export declare function validate(schemas: Schemas): (req: Request, _res: Response, next: NextFunction) => void;
export {};
