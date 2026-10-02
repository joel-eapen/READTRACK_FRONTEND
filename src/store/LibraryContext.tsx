import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/clerk-react";
import { useAddBook } from "../services/useAddBook";
import { useLibraryBooks } from "../services/useLibraryBooks";
import type { Book, LibraryEntry, ReadingStatus } from "../types";

export const LIBRARY_PAGE_SIZE = 20;

interface LibraryContextValue {
  entries: LibraryEntry[];
  has: (id: string) => boolean;
  /**
   * Persist a book to the backend (POST /api/books) and add it to the
   * library. Resolves once the book is saved; rejects if the request fails.
   */
  addBook: (book: Book, status?: ReadingStatus) => Promise<void>;
  removeBook: (id: string) => void;
  updateStatus: (id: string, status: ReadingStatus) => void;
  // Backend-sourced state (GET /api/books).
  loading: boolean;
  error: string;
  page: number;
  totalPages: number;
  totalDocuments: number;
  /** Jump to a specific page (clamped to >= 1). */
  goToPage: (page: number) => void;
  /** Re-fetch the current page from the backend. */
  refetch: () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);
const STORAGE_KEY = "readtrack.library";

/** Map legacy localStorage status values onto the current backend-aligned set. */
const LEGACY_STATUS: Record<string, ReadingStatus> = {
  want: "want_to_read",
  reading: "current_read",
  // "dnf" was removed from the backend; fold it into "want_to_read".
  dnf: "want_to_read",
  finished: "finished",
};

function migrateStatus(status: unknown): ReadingStatus {
  if (typeof status === "string" && status in LEGACY_STATUS) {
    return LEGACY_STATUS[status];
  }
  if (status === "want_to_read" || status === "current_read" || status === "finished") {
    return status;
  }
  return "want_to_read";
}

/** Cached snapshot of the last-seen page, used for instant first paint. */
function loadEntries(): LibraryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LibraryEntry[];
    return parsed.map((e) => ({ ...e, status: migrateStatus(e.status) }));
  } catch {
    return [];
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const persistBook = useAddBook();
  const fetchLibrary = useLibraryBooks();

  const [entries, setEntries] = useState<LibraryEntry[]>(loadEntries);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Bumped by refetch() to re-trigger the load effect for the same page.
  const [reloadToken, setReloadToken] = useState(0);

  // Guards against stale responses updating state out of order.
  const requestIdRef = useRef(0);

  // Persist the current page snapshot so a reload paints instantly.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // Load the library from the backend whenever the page changes, the user
  // signs in, or a refetch is requested.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const requestId = ++requestIdRef.current;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchLibrary(page, LIBRARY_PAGE_SIZE);
        if (requestId !== requestIdRef.current) return; // stale
        setEntries(res.entries);
        setTotalPages(res.totalPages);
        setTotalDocuments(res.totalDocuments);
      } catch (err: unknown) {
        if (requestId !== requestIdRef.current) return; // stale
        setError(
          err instanceof Error
            ? err.message
            : "Couldn't load your library. Try again.",
        );
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    };

    void load();
  }, [isLoaded, isSignedIn, page, reloadToken, fetchLibrary]);

  const has = useCallback(
    (id: string) => entries.some((e) => e.id === id),
    [entries],
  );

  const goToPage = useCallback((next: number) => {
    setPage(Math.max(1, next));
  }, []);

  const refetch = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  const addBook = useCallback(
    async (book: Book, status: ReadingStatus = "want_to_read") => {
      // Already tracked locally — skip the network round-trip.
      if (entries.some((e) => e.id === book.id)) return;

      // Persist to the backend first; only update local state on success so
      // the UI never shows a book that failed to save.
      const saved = await persistBook(book, status);

      // Optimistically surface the new book, then reconcile with the backend
      // (which owns ordering/pagination) by refetching.
      setEntries((prev) => {
        if (prev.some((e) => e.id === saved.id)) return prev;
        return [{ ...saved, status, addedAt: Date.now() }, ...prev];
      });
      setTotalDocuments((n) => n + 1);
      refetch();
    },
    [entries, persistBook, refetch],
  );

  const removeBook = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateStatus = useCallback((id: string, status: ReadingStatus) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e)),
    );
  }, []);

  const value = useMemo(
    () => ({
      entries,
      has,
      addBook,
      removeBook,
      updateStatus,
      loading,
      error,
      page,
      totalPages,
      totalDocuments,
      goToPage,
      refetch,
    }),
    [
      entries,
      has,
      addBook,
      removeBook,
      updateStatus,
      loading,
      error,
      page,
      totalPages,
      totalDocuments,
      goToPage,
      refetch,
    ],
  );

  return <LibraryContext value={value}>{children}</LibraryContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
