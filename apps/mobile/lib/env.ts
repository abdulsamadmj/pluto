// EXPO_PUBLIC_* vars are inlined at build time. Falls back to localhost for the
// simulator/web; set EXPO_PUBLIC_SERVER_URL to your LAN IP for a physical device.
export const SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:8080";
