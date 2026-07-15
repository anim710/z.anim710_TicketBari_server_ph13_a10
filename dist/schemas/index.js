import { z } from "zod";
export const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});
export const googleSaveSchema = z.object({
    name: z.string().optional(),
    email: z.string().email(),
    image: z.string().optional(),
});
export const ticketListQuerySchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    type: z.string().optional(),
    sort: z.enum(["low", "high"]).optional(),
    page: z.coerce.number().int().positive().default(1),
});
export const createTicketSchema = z
    .object({
    title: z.string().min(1),
    from: z.string().min(1),
    to: z.string().min(1),
    transportType: z.string().min(1),
    price: z.coerce.number().positive(),
    quantity: z.coerce.number().int().positive(),
    departureDate: z.coerce.date().optional(),
    perks: z.array(z.string()).optional(),
    image: z.string().optional(),
})
    .passthrough();
export const updateTicketSchema = z.record(z.string(), z.unknown());
export const objectIdParamSchema = z.object({
    id: z.string().min(1),
});
export const createBookingSchema = z
    .object({
    ticketId: z.string().min(1),
    vendorEmail: z.string().email().optional(),
    ticketTitle: z.string().optional(),
    quantity: z.coerce.number().int().positive().optional(),
    departureDate: z.union([z.coerce.date(), z.string()]).optional(),
})
    .passthrough();
export const bookingStatusSchema = z.object({
    status: z.enum(["accepted", "rejected"]),
});
export const userRoleSchema = z.object({
    role: z.enum(["user", "vendor", "admin"]),
});
export const verifyTicketSchema = z.object({
    verificationStatus: z.enum(["approved", "rejected", "pending"]),
});
export const checkoutSchema = z.object({
    bookingId: z.string().min(1),
});
//# sourceMappingURL=index.js.map