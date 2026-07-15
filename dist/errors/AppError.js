export class AppError extends Error {
    statusCode;
    details;
    isOperational;
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace?.(this, this.constructor);
    }
}
//# sourceMappingURL=AppError.js.map