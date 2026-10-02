import { useCallback } from "react";
import { useApi } from "./api";
import type { LibraryEntry } from "../types";

/**
 * Hook exposing a function that deletes a library book on the backend
 * (DELETE /api/books/:id). Requires an authenticated Clerk session; the token
 * is attached by useApi().
 *
 * `entry` must carry a backendId (the Mongo _id); the externalId is not a
 * valid route param. Resolves once the backend confirms deletion; rejects if
 * the request fails.
 *
 * NOTE: The backend currently registers the books :id routes as "/books:id"
 * (no slash), so the effective path may be `/api/books:id`. This client
 * targets the intended `/api/books/:id`; if the backend route isn't fixed
 * these calls will 404.
 */
export function useDeleteBook() {
  const api = useApi();

  return useCallback(
    async (entry: LibraryEntry): Promise<void> => {
      if (!entry.backendId) {
        throw new Error(
          "This book can't be deleted yet — reload your library and try again.",
        );
      }

      await api<unknown>(
        `/api/books/${encodeURIComponent(entry.backendId)}`,
        {
          method: "DELETE",
        },
      );
    },
    [api],
  );
}
