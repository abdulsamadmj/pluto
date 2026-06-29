import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    WEB_URL:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional().default("http://localhost:5173"),
    VITE_SERVER_URL: z.string().min(1),
    // Public URL of this API (e.g. https://api.pluto.com). Optional in dev —
    // better-auth infers it from request headers when unset.
    BETTER_AUTH_URL: z.string().url().optional(),
    // Parent domain for sharing the session cookie across subdomains
    // (e.g. ".pluto.com" so app.pluto.com ↔ api.pluto.com). Leave unset in dev.
    COOKIE_DOMAIN: z.string().min(1).optional(),
  },

  /**
   * Makes sure you explicitly access **all** environment variables
   * from `server` and `client` in your `runtimeEnv`.
   */
  runtimeEnvStrict: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    WEB_URL: process.env.WEB_URL,
    VITE_SERVER_URL: process.env.VITE_SERVER_URL,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  },

  emptyStringAsUndefined: true,
});
