import { useCallback } from "react";
import { useApi } from "./api";
import type { LibraryEntry, ReadingStatus } from "../types";

/** Raw book shape returned by PATCH /api/books/:id (userId stripped on reads). */
interface BackendBook {
  _id: string;
  externalId: string;
  title: string;
  author?: string;
  coverImg?: string;
  isbn?: string;
  status?: ReadingStatus;
  totalPages?: number;
  pagesRead?: number;
  percentRead?: number;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Backend wraps payloads as { success, statusCode, message, data }. */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Fields accepted by PATCH /api/books/:id. The backend accepts at most one of
 * `pagesRead` / `percentRead` per request (sending both is a 400), and derives
 * the other value plus startedAt/finishedAt side effects from `status`.
 */
export interface BookUpdate {
  status?: ReadingStatus;
  pagesRead?: number;
  percentRead?: number;
}

const VALID_STATUSES: ReadingStatus[] = [
  "want_to_read",
  "current_read",
  "finished",
];

function toStatus(status: string | undefined): ReadingStatus {
  return status && VALID_STATUSES.includes(status as ReadingStatus)
    ? (status as ReadingStatus)
    : "want_to_read";
}

/**
 * Merge the backend's updated book onto the existing library entry, keeping
 * fields the PATCH response doesn't change (e.g. addedAt).
 */
function applyUpdate(prev: LibraryEntry, item: BackendBook): LibraryEntry {
  return {
    ...prev,
    id: item.externalId ?? prev.id,
    title: item.title ?? prev.title,
    authors: item.author ? [item.author] : prev.authors,
    coverUrl: item.coverImg ?? prev.coverUrl,
    isbn: item.isbn ?? prev.isbn,
    totalPages: item.totalPages ?? prev.totalPages,
    status: item.status ? toStatus(item.status) : prev.status,
    pagesRead: item.pagesRead ?? prev.pagesRead,
    percentRead: item.percentRead ?? prev.percentRead,
    backendId: item._id ?? prev.backendId,
  };
}

/**
 * Hook exposing a function that updates a library book on the backend
 * (PATCH /api/books/:id) with a status and/or reading-progress change.
 * Requires an authenticated Clerk session; the token is attached by useApi().
 *
 * `entry` must carry a backendId (the Mongo _id); the externalId is not a
 * valid route param. Returns the merged LibraryEntry reflecting the backend.
 *
 * NOTE: The backend currently registers this route as "/books:id" (no slash),
 * so the effective path is `/api/books:id`. This client targets the intended
 * `/api/books/:id`; if the backend route isn't fixed these calls will 404.
 */
export function useUpdateBook() {
  const api = useApi();

  return useCallback(
    async (entry: LibraryEntry, update: BookUpdate): Promise<LibraryEntry> => {
      if (!entry.backendId) {
        throw new Error(
          "This book can't be updated yet — reload your library and try again.",
        );
      }

      if (update.pagesRead !== undefined && update.percentRead !== undefined) {
        throw new Error("Provide either pages read or percent read, not both.");
      }

      const res = await api<ApiEnvelope<BackendBook>>(
        `/api/books/${encodeURIComponent(entry.backendId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(update),
        },
      );

      return res.data ? applyUpdate(entry, res.data) : { ...entry, ...update };
    },
    [api],
  );
}
