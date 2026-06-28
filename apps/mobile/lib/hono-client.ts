// Type-only import of the server's app type — erased at bundle time, so no
// server code ships in the app. Requires the server to be built (dist/src/hc.d.ts).
import { type AppType, type Client } from "@repo/server/hc";
import { hc } from "hono/client";
import { authClient } from "./auth-client";
import { SERVER_URL } from "./env";

const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);

// The Better-Auth Expo plugin exposes the session as a Cookie header value,
// which we attach to every RPC request.
export const client = hcWithType(SERVER_URL, {
  headers: (): Record<string, string> => {
    const cookie = authClient.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
});
