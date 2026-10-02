import { useCallback } from "react";
import { useApi } from "./api";

/** Backend wraps payloads as { success, statusCode, message, data }. */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** POST /api/api-keys returns the plaintext key exactly once. */
interface CreateApiKeyPayload {
  key: string;
}

/**
 * Hook exposing a function that creates a new API key for the current user
 * (POST /api/api-keys). Requires an authenticated Clerk session; the token is
 * attached by useApi().
 *
 * The backend returns the plaintext key ONCE — it stores only a hash and
 * cannot show the key again. Callers must surface it immediately and never
 * persist it.
 */
export function useCreateApiKey() {
  const api = useApi();

  return useCallback(
    async (name: string): Promise<string> => {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error("Give the key a name so you can identify it later.");
      }

      const res = await api<ApiEnvelope<CreateApiKeyPayload>>("/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: trimmed }),
      });

      const key = res.data?.key;
      if (!key) {
        throw new Error("The server didn't return a key. Try again.");
      }

      return key;
    },
    [api],
  );
}
