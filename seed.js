// seed.js — run once: node seed.js
require("dotenv").config();
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME);

  // ── Clear existing data ──────────────────────────────────
  await db.collection("users").deleteMany({});
  await db.collection("tickets").deleteMany({});

  // ── Seed Users ───────────────────────────────────────────
  const adminPass  = await bcrypt.hash("admin123",  10);
  const vendorPass = await bcrypt.hash("vendor123", 10);
  const userPass   = await bcrypt.hash("user123",   10);

  await db.collection("users").insertMany([
    {
      name: "Super Admin",
      email: "admin@ticketbari.com",
      password: adminPass,
      role: "admin",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      provider: "email",
      isFraud: false,
      createdAt: new Date(),
    },
    {
      name: "Karim Vendor",
      email: "vendor@ticketbari.com",
      password: vendorPass,
      role: "vendor",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=vendor",
      provider: "email",
      isFraud: false,
      createdAt: new Date(),
    },
    {
      name: "Nusrat User",
      email: "user@ticketbari.com",
      password: userPass,
      role: "user",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
      provider: "email",
      isFraud: false,
      createdAt: new Date(),
    },
  ]);
  console.log("✅ Users seeded");

  // ── Seed Tickets ─────────────────────────────────────────
  const tickets = [
    {
      title: "Green Line Paribahan — Dhaka to Chittagong",
      from: "Dhaka", to: "Chittagong",
      transportType: "Bus",
      price: 450, quantity: 40,
      departureDate: new Date("2025-12-15T22:00:00Z"),
      perks: ["AC", "Charging Port", "Snacks"],
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: true, isHidden: false,
      createdAt: new Date("2025-07-01"),
    },
    {
      title: "Parabat Express — Dhaka to Sylhet",
      from: "Dhaka", to: "Sylhet",
      transportType: "Train",
      price: 380, quantity: 80,
      departureDate: new Date("2025-12-16T07:40:00Z"),
      perks: ["AC", "Breakfast", "WiFi"],
      image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: true, isHidden: false,
      createdAt: new Date("2025-07-02"),
    },
    {
      title: "Sundarban Launch — Dhaka to Barisal",
      from: "Dhaka", to: "Barisal",
      transportType: "Launch",
      price: 320, quantity: 120,
      departureDate: new Date("2025-12-17T20:00:00Z"),
      perks: ["AC", "Blanket", "Breakfast"],
      image: "https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: true, isHidden: false,
      createdAt: new Date("2025-07-03"),
    },
    {
      title: "Biman Bangladesh — Dhaka to Cox's Bazar",
      from: "Dhaka", to: "Cox's Bazar",
      transportType: "Plane",
      price: 4500, quantity: 150,
      departureDate: new Date("2025-12-20T09:30:00Z"),
      perks: ["AC", "Breakfast", "WiFi", "Blanket"],
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: true, isHidden: false,
      createdAt: new Date("2025-07-04"),
    },
    {
      title: "Shyamoli Paribahan — Dhaka to Rajshahi",
      from: "Dhaka", to: "Rajshahi",
      transportType: "Bus",
      price: 600, quantity: 45,
      departureDate: new Date("2025-12-18T21:30:00Z"),
      perks: ["AC", "Charging Port"],
      image: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: false, isHidden: false,
      createdAt: new Date("2025-07-05"),
    },
    {
      title: "Sundarban Express — Dhaka to Khulna",
      from: "Dhaka", to: "Khulna",
      transportType: "Train",
      price: 420, quantity: 60,
      departureDate: new Date("2025-12-19T08:00:00Z"),
      perks: ["AC", "Snacks"],
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: true, isHidden: false,
      createdAt: new Date("2025-07-06"),
    },
    {
      title: "Saint Martin Travels — Chittagong to Cox's Bazar",
      from: "Chittagong", to: "Cox's Bazar",
      transportType: "Bus",
      price: 280, quantity: 35,
      departureDate: new Date("2025-12-21T07:00:00Z"),
      perks: ["AC"],
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: false, isHidden: false,
      createdAt: new Date("2025-07-07"),
    },
    {
      title: "US-Bangla Airlines — Dhaka to Sylhet",
      from: "Dhaka", to: "Sylhet",
      transportType: "Plane",
      price: 3200, quantity: 180,
      departureDate: new Date("2025-12-22T11:00:00Z"),
      perks: ["AC", "Breakfast", "WiFi"],
      image: "https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: true, isHidden: false,
      createdAt: new Date("2025-07-08"),
    },
    {
      title: "Ena Transport — Dhaka to Comilla",
      from: "Dhaka", to: "Comilla",
      transportType: "Bus",
      price: 200, quantity: 50,
      departureDate: new Date("2025-12-23T06:00:00Z"),
      perks: ["AC"],
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: false, isHidden: false,
      createdAt: new Date("2025-07-09"),
    },
    {
      title: "Tista Express — Dhaka to Rangpur",
      from: "Dhaka", to: "Rangpur",
      transportType: "Train",
      price: 550, quantity: 90,
      departureDate: new Date("2025-12-24T19:00:00Z"),
      perks: ["AC", "Breakfast"],
      image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600",
      vendorName: "Karim Vendor", vendorEmail: "vendor@ticketbari.com",
      verificationStatus: "approved", isAdvertised: false, isHidden: false,
      createdAt: new Date("2025-07-10"),
    },
  ];

  await db.collection("tickets").insertMany(tickets);
  console.log("✅ Tickets seeded (10 tickets)");

  console.log("\n🎉 Seed complete! Test credentials:");
  console.log("   Admin:  admin@ticketbari.com  / admin123");
  console.log("   Vendor: vendor@ticketbari.com / vendor123");
  console.log("   User:   user@ticketbari.com   / user123");

  await client.close();
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});