import { useCallback } from "react";
import { useApi } from "./api";

/**
 * Hook exposing a function that revokes/deletes an API key by its Mongo _id
 * (DELETE /api/api-keys/:id). Requires an authenticated Clerk session; the
 * token is attached by useApi().
 *
 * The backend soft-deletes (sets revokedAt and clears the hash).
 *
 * NOTE: two backend issues still affect this flow:
 *  1. GET /api/api-keys excludes _id (`.select("-_id ...")`), so the list has
 *     no id to pass here until that is included.
 *  2. The delete controller sets revokedAt/apiHashed but never calls
 *     `apiKey.save()` nor sends a response, so the change isn't persisted and
 *     the request hangs. Needs `await apiKey.save()` + a JSON response.
 */
export function useDeleteApiKey() {
  const api = useApi();

  return useCallback(
    async (id: string): Promise<void> => {
      if (!id) {
        throw new Error("This key can't be revoked — missing its id.");
      }

      await api<unknown>(`/api/api-keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    [api],
  );
}
