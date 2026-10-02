import { useCallback } from "react";
import { useApi } from "./api";
import type { Book, ReadingStatus } from "../types";

/**
 * Raw book item shape the backend persists / returns from POST /api/books.
 * Mirrors the field conventions used by the search endpoint
 * (externalId, author, coverImg) so a searched book can be saved as-is.
 */
interface BackendBook {
  id?: string;
  externalId: string;
  title: string;
  author?: string;
  coverImg?: string;
  isbn?: string;
  totalPages?: number;
  year?: number;
  status?: ReadingStatus;
}

/** Backend wraps payloads as { success, statusCode, message, data }. */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Request body sent to POST /api/books. */
interface AddBookBody {
  externalId: string;
  title: string;
  author?: string;
  coverImg?: string;
  isbn?: string;
  totalPages?: number;
  year?: number;
  status: ReadingStatus;
}

function toBody(book: Book, status: ReadingStatus): AddBookBody {
  return {
    externalId: book.id,
    title: book.title,
    author: book.authors.length ? book.authors.join(", ") : undefined,
    coverImg: book.coverUrl,
    isbn: book.isbn,
    totalPages: book.totalPages,
    year: book.year,
    status,
  };
}

/** Map the backend representation back to the frontend Book shape. */
function fromBackend(item: BackendBook, fallback: Book): Book {
  return {
    id: item.externalId ?? item.id ?? fallback.id,
    title: item.title ?? fallback.title,
    authors: item.author ? [item.author] : fallback.authors,
    coverUrl: item.coverImg ?? fallback.coverUrl,
    isbn: item.isbn ?? fallback.isbn,
    totalPages: item.totalPages ?? fallback.totalPages,
    year: item.year ?? fallback.year,
  };
}

/**
 * Hook exposing a function that persists a book to the READTRACK backend
 * (POST /api/books). Requires an authenticated Clerk session; the token is
 * attached by useApi().
 *
 * Returns the persisted Book as reflected by the backend (falling back to the
 * input when the backend echoes a partial payload).
 */
export function useAddBook() {
  const api = useApi();

  return useCallback(
    async (book: Book, status: ReadingStatus = "want_to_read"): Promise<Book> => {
      const res = await api<ApiEnvelope<BackendBook>>("/api/books", {
        method: "POST",
        body: JSON.stringify(toBody(book, status)),
      });

      return res.data ? fromBackend(res.data, book) : book;
    },
    [api],
  );
}
