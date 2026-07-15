import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
// Separate client just for BetterAuth
const client = new MongoClient(env.MONGODB_URI);
export const auth = betterAuth({
    database: mongodbAdapter(client.db(env.DB_NAME)),
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
    secret: env.BETTER_AUTH_SECRET,
    // baseURL must be the SERVER's own URL so the Google redirect_uri points back here.
    baseURL: env.BETTER_AUTH_URL,
    // basePath matches the server mount and the client authClient basePath,
    // so the generated redirect_uri is /api/auth/better/callback/google.
    basePath: "/api/auth/better",
    trustedOrigins: [env.CLIENT_URL],
});
export default auth;
//# sourceMappingURL=auth.js.map