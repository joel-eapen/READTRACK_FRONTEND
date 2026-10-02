import { useCallback } from "react";
import { useApi } from "./api";
import type { LibraryEntry, ReadingStatus } from "../types";

/** Raw book item shape returned by GET /api/books (userId stripped by backend). */
interface BackendLibraryBook {
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

interface BackendPagination {
  pageNumber: number;
  limitNumber: number;
  totalDocuments: number;
  totalPages: number;
}

/** Backend wraps payloads as { success, statusCode, message, data }. */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface LibraryPayload {
  books: BackendLibraryBook[];
  pagination: BackendPagination;
}

export interface LibraryPage {
  entries: LibraryEntry[];
  page: number;
  limit: number;
  totalDocuments: number;
  totalPages: number;
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

function mapEntry(item: BackendLibraryBook): LibraryEntry {
  // Prefer createdAt for ordering/display; fall back to now if absent.
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
 * Hook exposing a fetch function for the user's library
 * (GET /api/books?page=&limit=). Requires an authenticated Clerk session;
 * the token is attached by useApi().
 *
 * The backend requires page and limit to be positive integers.
 */
export function useLibraryBooks() {
  const api = useApi();

  return useCallback(
    async (page = 1, limit = 20): Promise<LibraryPage> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const res = await api<ApiEnvelope<LibraryPayload>>(
        `/api/books?${params.toString()}`,
      );

      const books = res.data?.books ?? [];
      const pagination = res.data?.pagination;

      return {
        entries: books.map(mapEntry),
        page: pagination?.pageNumber ?? page,
        limit: pagination?.limitNumber ?? limit,
        totalDocuments: pagination?.totalDocuments ?? books.length,
        totalPages: pagination?.totalPages ?? 1,
      };
    },
    [api],
  );
}
