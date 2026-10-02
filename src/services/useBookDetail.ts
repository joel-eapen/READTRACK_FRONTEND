import { useCallback } from "react";
import { useApi } from "./api";
import type { LibraryEntry, ReadingStatus } from "../types";

/** Raw book shape returned by GET /api/books/:id (userId stripped). */
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

function mapEntry(item: BackendBook): LibraryEntry {
  const addedAt = item.createdAt ? Date.parse(item.createdAt) : Date.now();

  return {
    id: item.externalId,
    title: item.title,
    authors: item.author ? [item.author] : ["Unknown"],
    coverUrl: item.coverImg,
    isbn: item.isbn,
    totalPages: item.totalPages,
    status: toStatus(item.status),
    addedAt: Number.isNaN(addedAt) ? Date.now() : addedAt,
    backendId: item._id,
    pagesRead: item.pagesRead,
    percentRead: item.percentRead,
  };
}

/**
 * Hook exposing a function that fetches a single library book by its Mongo
 * _id (GET /api/books/:id). Requires an authenticated Clerk session; the token
 * is attached by useApi().
 *
 * NOTE: The backend currently registers this route as "/books:id" (no slash),
 * so the effective path is `/api/books:id`. This client targets the intended
 * `/api/books/:id`; if the backend route isn't fixed these calls will 404.
 */
export function useBookDetail() {
  const api = useApi();

  return useCallback(
    async (backendId: string): Promise<LibraryEntry> => {
      if (!backendId) {
        throw new Error("A book id is required to fetch its details.");
      }

      const res = await api<ApiEnvelope<BackendBook>>(
        `/api/books/${encodeURIComponent(backendId)}`,
      );

      if (!res.data) {
        throw new Error("Book not found.");
      }

      return mapEntry(res.data);
    },
    [api],
  );
}
