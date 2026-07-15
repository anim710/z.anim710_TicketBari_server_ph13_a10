import type { ObjectId } from "mongodb";

export type UserRole = "user" | "vendor" | "admin";

export interface JwtPayload {
  email: string;
  role: UserRole;
  name: string;
}

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  image?: string;
  provider?: "email" | "google";
  isFraud?: boolean;
  createdAt?: Date;
}

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface TicketDoc {
  _id?: ObjectId;
  title: string;
  from: string;
  to: string;
  transportType: string;
  price: number;
  quantity: number;
  departureDate?: Date;
  perks?: string[];
  image?: string;
  vendorName: string;
  vendorEmail: string;
  verificationStatus: VerificationStatus;
  isAdvertised: boolean;
  isHidden: boolean;
  createdAt: Date;
}

export type BookingStatus = "pending" | "accepted" | "rejected" | "paid";

export interface BookingDoc {
  _id?: ObjectId;
  ticketId: string;
  ticketTitle?: string;
  vendorEmail: string;
  userEmail: string;
  userName: string;
  quantity?: number;
  departureDate?: Date | string;
  status: BookingStatus;
  createdAt: Date;
}

export interface TransactionDoc {
  _id?: ObjectId;
  userEmail: string;
  bookingId: string;
  ticketId: string;
  transactionId: string;
  amount: number;
  ticketTitle?: string;
  paidAt: Date;
}
