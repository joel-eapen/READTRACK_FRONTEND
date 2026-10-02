import { useCallback } from "react";
import { useApi } from "./api";

/** Backend wraps payloads as { success, statusCode, message, data }. */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * API key metadata returned by GET /api/api-keys. The backend excludes the
 * _id and the hashed secret, so no sensitive value is ever exposed here.
 */
export interface ApiKeyMeta {
  /**
   * Mongo _id — required to revoke a key via DELETE /api/api-keys/:id.
   * NOTE: the backend GET currently excludes _id (`.select("-_id ...")`), so
   * this is optional until that is fixed; the UI disables revoke when absent.
   */
  _id?: string;
  name?: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiKeysPayload {
  apiKeys: ApiKeyMeta[];
}

/**
 * Hook exposing a function that lists the current user's API keys
 * (GET /api/api-keys). Requires an authenticated Clerk session; the token is
 * attached by useApi().
 *
 * Returns metadata only — never the key value (which is shown once at creation).
 */
export function useApiKeys() {
  const api = useApi();

  return useCallback(async (): Promise<ApiKeyMeta[]> => {
    const res = await api<ApiEnvelope<ApiKeysPayload>>("/api/api-keys");
    return res.data?.apiKeys ?? [];
  }, [api]);
}
