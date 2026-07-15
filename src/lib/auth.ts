import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

// Separate client just for BetterAuth
const client = new MongoClient(env.MONGODB_URI);

const isHttps = env.BETTER_AUTH_URL.startsWith("https://");

export const auth = betterAuth({
  database: mongodbAdapter(client.db(env.DB_NAME), { client }),

  // Reuse our existing `users` collection instead of letting BetterAuth
  // create a separate `user` collection (avoids duplicate user records).
  user: {
    modelName: "users",
  },

  // Email/password is handled by our own custom routes with JWT
  emailAndPassword: {
    enabled: false,
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  // Cross-origin (Vercel ↔ Render): signed state cookie often never sticks.
  // DB verification of the OAuth `state` param still provides CSRF protection.
  account: {
    skipStateCookieCheck: true,
    storeStateStrategy: "database",
  },

  secret: env.BETTER_AUTH_SECRET,
  // Prefer the public frontend origin (with Next rewrite) so Google redirect_uri
  // and cookies stay same-site. Fallback remains the API URL if unset.
  baseURL: env.BETTER_AUTH_URL,
  // basePath matches the server mount and the client authClient basePath,
  // so the generated redirect_uri is /api/auth/better/callback/google.
  basePath: "/api/auth/better",

  trustedOrigins: [env.CLIENT_URL],

  onAPIError: {
    errorURL: `${env.CLIENT_URL}/login`,
  },

  advanced: {
    // Production: session cookies must be sent on credentialed requests from Vercel.
    // Local HTTP: keep default Lax so localhost:3000 ↔ :5000 still works.
    ...(isHttps
      ? {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        }
      : {}),
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
  },
});

export default auth;
