import { Hono } from "hono";

import { cors } from "hono/cors";
import { env } from "../env";
import { auth, type HonoAppContext } from "./auth";
import { devices } from "./routes/devices";
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
    return auth.handler(c.req.raw);
  })
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/devices", devices)
  .route("/stats", stats);

export default app;

export type AppType = typeof app;
