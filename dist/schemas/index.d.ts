import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const googleSaveSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodString;
    image: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ticketListQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    sort: z.ZodOptional<z.ZodEnum<{
        low: "low";
        high: "high";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const createTicketSchema: z.ZodObject<{
    title: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
    transportType: z.ZodString;
    price: z.ZodCoercedNumber<unknown>;
    quantity: z.ZodCoercedNumber<unknown>;
    departureDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    perks: z.ZodOptional<z.ZodArray<z.ZodString>>;
    image: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const updateTicketSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export declare const objectIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const createBookingSchema: z.ZodObject<{
    ticketId: z.ZodString;
    vendorEmail: z.ZodOptional<z.ZodString>;
    ticketTitle: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    departureDate: z.ZodOptional<z.ZodUnion<readonly [z.ZodCoercedDate<unknown>, z.ZodString]>>;
}, z.core.$loose>;
export declare const bookingStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        rejected: "rejected";
        accepted: "accepted";
    }>;
}, z.core.$strip>;
export declare const userRoleSchema: z.ZodObject<{
    role: z.ZodEnum<{
        user: "user";
        vendor: "vendor";
        admin: "admin";
    }>;
}, z.core.$strip>;
export declare const verifyTicketSchema: z.ZodObject<{
    verificationStatus: z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        rejected: "rejected";
    }>;
}, z.core.$strip>;
export declare const checkoutSchema: z.ZodObject<{
    bookingId: z.ZodString;
}, z.core.$strip>;
