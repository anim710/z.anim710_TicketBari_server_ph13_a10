import type { Request, Response } from "express";
export declare function stripeWebhook(req: Request, res: Response): Promise<void>;
export default stripeWebhook;
