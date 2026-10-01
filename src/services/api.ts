import { useAuth } from "@clerk/clerk-react";
import { useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Returns a fetch wrapper that calls the READTRACK backend with the
 * current user's Clerk session token in the Authorization header.
 *
 * The backend (@clerk/express clerkMiddleware + requireAuth) reads this
 * Bearer token and resolves req.auth / getAuth(req).userId.
 */
export function useApi() {
  const { getToken } = useAuth();

  const api = useCallback(
    async <T = unknown>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      const headers = new Headers(init.headers);
      headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const res = await fetch(`${API_URL}${path}`, { ...init, headers });

      if (!res.ok) {
        let message = `Request failed: ${res.status}`;
        try {
          const body = await res.json();
          message = body?.message ?? message;
        } catch {
          // non-JSON error body; keep default message
        }
        throw new Error(message);
      }

      return (await res.json()) as T;
    },
    [getToken],
  );

  return api;
}
