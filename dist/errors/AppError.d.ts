export declare class AppError extends Error {
    readonly statusCode: number;
    readonly details?: unknown;
    readonly isOperational: boolean;
    constructor(statusCode: number, message: string, details?: unknown);
}
