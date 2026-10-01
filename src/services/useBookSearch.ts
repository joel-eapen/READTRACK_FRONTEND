import { useCallback } from "react";
import { useApi } from "./api";
import type { Book } from "../types";

/** Raw book item shape returned by the backend /api/search endpoint. */
interface BackendSearchItem {
  externalId: string;
  title: string;
  author?: string;
  coverImg?: string;
  isbn?: string;
  totalPages?: number;
}

interface BackendPagination {
  pageNumber: number;
  limitNumber: number;
}

/** Backend wraps payloads as { success, statusCode, message, data } */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface SearchPayload {
  data: BackendSearchItem[] | null;
  pagination: BackendPagination;
}

export interface SearchResult {
  books: Book[];
  page: number;
  limit: number;
  /** True when a full page of results came back (likely more pages). */
  hasMore: boolean;
}

function mapItem(item: BackendSearchItem): Book {
  return {
    id: item.externalId,
    title: item.title,
    authors: item.author ? [item.author] : ["Unknown"],
    coverUrl: item.coverImg,
    isbn: item.isbn,
    totalPages: item.totalPages,
  };
}

/**
 * Hook exposing a search function backed by the READTRACK API
 * (GET /api/search?q=&page=&limit=). Requires an authenticated Clerk
 * session; the token is attached by useApi().
 */
export function useBookSearch() {
  const api = useApi();

  return useCallback(
    async (query: string, page = 1, limit = 20): Promise<SearchResult> => {
      const q = query.trim();
      if (!q) return { books: [], page, limit, hasMore: false };

      const params = new URLSearchParams({
        q,
        page: String(page),
        limit: String(limit),
      });

      const res = await api<ApiEnvelope<SearchPayload>>(
        `/api/search?${params.toString()}`,
      );

      const items = res.data?.data ?? [];
      const books = items.map(mapItem);

      return {
        books,
        page: res.data?.pagination?.pageNumber ?? page,
        limit: res.data?.pagination?.limitNumber ?? limit,
        hasMore: books.length >= limit,
      };
    },
    [api],
  );
}
