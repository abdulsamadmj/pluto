import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "../env";
import { db } from "./db/index";
import * as schema from "./db/schema";

// Deep-link scheme used by the Expo app (must match apps/mobile app.config.ts).
const MOBILE_SCHEME = "warranty://";

// Explicit annotation: the expo() plugin makes the inferred type reference
// pnpm-internal paths (zod/better-call), which TS can't emit portably (TS2742).
export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    // Demo app — no email server wired up, so accounts are usable immediately.
    requireEmailVerification: false,
    // Mocked reset flow: the token is surfaced to the client instead of emailed.
    sendResetPassword: async ({ url, token }) => {
      console.log(`[mock email] password reset link: ${url} (token: ${token})`);
    },
  },
  // Enables native (Expo) clients: bearer-token sessions + deep-link callbacks.
  plugins: [expo()],
  trustedOrigins: [env.WEB_URL, MOBILE_SCHEME],
});

type AuthStatus =
  | "IsAuthenticated"
  | "IsNotAuthenticated"
  | "IsMaybeAuthenticated";

/**
 * Represents the authentication status of an application's routes.
 * This type is used to enforce type safety for route authentication requirements.
 *
 * @typedef {string} AuthStatus
 * @property {"IsAuthenticated"} IsAuthenticated - All routes require authentication
 * @property {"IsNotAuthenticated"} IsNotAuthenticated - No routes require authentication
 * @property {"IsMaybeAuthenticated"} IsMaybeAuthenticated - Some routes may require authentication
 *
 * @example
 * // All routes require auth
 * const app = new Hono<HonoAppContext<"IsAuthenticated">>();
 *
 * // Some routes may require auth (default)
 * const app = new Hono<HonoAppContext<"IsMaybeAuthenticated">>();
 *
 * // No routes require auth
 * const app = new Hono<HonoAppContext<"IsNotAuthenticated">>();
 */
export type HonoAppContext<
  Authenticated extends AuthStatus = "IsMaybeAuthenticated",
> = {
  Variables: {
    user: Authenticated extends "IsAuthenticated"
      ? typeof auth.$Infer.Session.user
      : Authenticated extends "IsNotAuthenticated"
        ? null
        : typeof auth.$Infer.Session.user | null;
    session: Authenticated extends "IsAuthenticated"
      ? typeof auth.$Infer.Session.session
      : Authenticated extends "IsNotAuthenticated"
        ? null
        : typeof auth.$Infer.Session.session | null;
  };
};
