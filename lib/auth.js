const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const { MongoClient } = require("mongodb");

// Separate client just for BetterAuth
const client = new MongoClient(process.env.MONGODB_URI);

const auth = betterAuth({
  database: mongodbAdapter(client.db(process.env.DB_NAME)),

  // Reuse our existing `users` collection instead of letting BetterAuth
  // create a separate `user` collection (avoids duplicate user records).
  user: {
    modelName: "users",
  },

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
  // baseURL must be the SERVER's own URL so the Google redirect_uri points back here.
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  // basePath matches the server mount and the client authClient basePath,
  // so the generated redirect_uri is /api/auth/better/callback/google.
  basePath: "/api/auth/better",

  trustedOrigins: [
    process.env.CLIENT_URL || "http://localhost:3000",
  ],
});

module.exports = auth;