import { Hono } from "hono";

import { cors } from "hono/cors";
import { env } from "../env";
import { auth, type HonoAppContext } from "./auth";
import { devices } from "./routes/devices";
import { notifications } from "./routes/notifications";
import { stats } from "./routes/stats";

const app = new Hono<HonoAppContext>()
  // ------------------------------------------------------------
  // CORS
  // ------------------------------------------------------------
  .use(
    "*",
    cors({
      // "warranty://" is the Expo app's Origin on native requests.
      origin: [env.WEB_URL, "warranty://"],
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    })
  )
  // ------------------------------------------------------------
  // AUTH
  // ------------------------------------------------------------
  .use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return next();
  })
  .on(["POST", "GET"], "/api/auth/*", (c) => {
    const raw = c.req.raw;

    // Native (Expo) clients have no standard `Origin` header; the better-auth
    // expo client sends it as a custom `Expo-Origin` header instead. better-auth's
    // CSRF check ("Missing or null Origin") triggers whenever a `Cookie` header is
    // present (the client always sends one, even empty) and no `Origin`/`Referer`
    // is set. Mirror `Expo-Origin` into `Origin` so the check validates it against
    // trustedOrigins (which includes the "warranty://" scheme).
    const hasOrigin = raw.headers.get("origin") || raw.headers.get("referer");
    const expoOrigin = raw.headers.get("expo-origin");

    if (!hasOrigin && expoOrigin) {
      const headers = new Headers(raw.headers);
      headers.set("origin", expoOrigin);

      const isBodyless = raw.method === "GET" || raw.method === "HEAD";
      const request = new Request(raw.url, {
        method: raw.method,
        headers,
        body: isBodyless ? undefined : raw.body,
        // `duplex` is required by undici when streaming a request body.
        ...(isBodyless ? {} : { duplex: "half" }),
      } as RequestInit);

      return auth.handler(request);
    }

    return auth.handler(raw);
  })
  .get("/", (c) => c.json({ message: "Hello World" }, 200))
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/devices", devices)
  .route("/stats", stats)
  .route("/notifications", notifications);

export default app;

export type AppType = typeof app;
