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
    account: {
        skipStateCookieCheck: true;
        storeStateStrategy: "database";
    };
    secret: string;
    baseURL: string;
    basePath: string;
    trustedOrigins: string[];
    onAPIError: {
        errorURL: string;
    };
    advanced: {
        ipAddress: {
            ipAddressHeaders: string[];
        };
        defaultCookieAttributes?: {
            sameSite: "none";
            secure: true;
        } | undefined;
    };
}>;
export default auth;
