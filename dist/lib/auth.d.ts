export declare const auth: import("better-auth").Auth<{
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    user: {
        modelName: "users";
    };
    emailAndPassword: {
        enabled: false;
    };
    socialProviders: {
        google: {
            clientId: string;
            clientSecret: string;
        };
    };
    secret: string;
    baseURL: string;
    basePath: string;
    trustedOrigins: string[];
}>;
export default auth;
