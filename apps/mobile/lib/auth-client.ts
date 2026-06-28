import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { SERVER_URL } from "./env";

// Native auth client: stores the session token in SecureStore and attaches it
// to API requests (no browser cookies on RN). The scheme matches app.config.ts
// and the server's trustedOrigins.
export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  plugins: [
    expoClient({
      scheme: "warranty",
      storagePrefix: "warranty",
      storage: SecureStore,
    }),
  ],
});

/**
 * Mirrors the web app's useSession: adds an `isInitialPending` flag so screens
 * can show a splash/loading state until the first session check resolves.
 */
export const useSession = () => {
  const { data, isPending, error, refetch } = authClient.useSession();
  const [isInitialPending, setIsInitialPending] = useState(true);

  useEffect(() => {
    if (error || data || !isPending) {
      setIsInitialPending(false);
    }
  }, [data, error, isPending]);

  return {
    data,
    isInitialPending,
    isPending,
    error,
    refetch,
    isAuthenticated: !!data?.user,
  };
};

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
