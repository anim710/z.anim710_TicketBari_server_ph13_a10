const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const { MongoClient } = require("mongodb");

// Separate client just for BetterAuth
const client = new MongoClient(process.env.MONGODB_URI);

const auth = betterAuth({
  database: mongodbAdapter(client.db(process.env.DB_NAME)),

  // We do NOT enable emailAndPassword here
  // Email/password is handled by our own custom routes with JWT
  emailAndPassword: {
    enabled: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.CLIENT_URL || "http://localhost:3000",

  trustedOrigins: [
    process.env.CLIENT_URL || "http://localhost:3000",
  ],
});

module.exports = auth;