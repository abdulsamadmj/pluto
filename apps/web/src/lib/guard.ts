import { redirect } from "@tanstack/react-router";
import { authClient } from "../utils/auth-client";

/**
 * Route guard for protected pages. Used in a route's `beforeLoad`; redirects
 * unauthenticated visitors to the sign-in page, preserving where they were
 * headed so we can bounce them back after login.
 */
export async function requireAuth(href: string) {
  const { data } = await authClient.getSession();
  if (!data?.session) {
    throw redirect({ to: "/sign-in", search: { redirect: href } });
  }
  return { user: data.user };
}
