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
import { useUpdateBook, type BookUpdate } from "../services/useUpdateBook";
import { useDeleteBook } from "../services/useDeleteBook";
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
  /**
   * Delete a book from the backend (DELETE /api/books/:id) and remove it from
   * the library. Removes optimistically and restores the book if the request
   * fails. Rejects on failure.
   */
  removeBook: (id: string) => Promise<void>;
  /** Merge an authoritative entry (e.g. from GET /api/books/:id) into state. */
  mergeEntry: (entry: LibraryEntry) => void;
  /**
   * Persist a status change to the backend (PATCH /api/books/:id). Updates
   * optimistically and reverts if the request fails. Rejects on failure.
   */
  updateStatus: (id: string, status: ReadingStatus) => Promise<void>;
  /**
   * Persist reading progress to the backend (PATCH /api/books/:id). Provide
   * exactly one of pagesRead / percentRead. Updates optimistically and reverts
   * if the request fails. Rejects on failure.
   */
  updateProgress: (
    id: string,
    progress: { pagesRead?: number; percentRead?: number },
  ) => Promise<void>;
  /**
   * Persist a new total page count to the backend (PATCH /api/books/:id,
   * sent as `TotalPages`). Updates optimistically and reverts if the request
   * fails. Rejects on failure.
   */
  updateTotalPages: (id: string, totalPages: number) => Promise<void>;
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
  const persistUpdate = useUpdateBook();
  const persistDelete = useDeleteBook();

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

  const removeBook = useCallback(
    async (id: string) => {
      const target = entries.find((e) => e.id === id);
      if (!target) return;

      // Optimistically remove so the UI responds instantly, then persist.
      const snapshot = entries;
      setEntries((prev) => prev.filter((e) => e.id !== id));

      try {
        await persistDelete(target);
        setTotalDocuments((n) => Math.max(0, n - 1));
      } catch (err) {
        // Restore the prior snapshot on failure.
        setEntries(snapshot);
        throw err;
      }
    },
    [entries, persistDelete],
  );

  // Merge a freshly-fetched entry (e.g. from GET /api/books/:id) into state so
  // consumers reading from context reflect the authoritative server values.
  const mergeEntry = useCallback((entry: LibraryEntry) => {
    setEntries((prev) =>
      prev.some((e) => e.id === entry.id)
        ? prev.map((e) => (e.id === entry.id ? { ...e, ...entry } : e))
        : prev,
    );
  }, []);

  // Shared optimistic PATCH /api/books/:id helper. Applies `optimistic` to the
  // matching entry immediately, calls the backend, reconciles with the server
  // response on success, and reverts to the prior snapshot on failure.
  const applyPatch = useCallback(
    async (
      id: string,
      update: BookUpdate,
      optimistic: (entry: LibraryEntry) => LibraryEntry,
    ) => {
      const target = entries.find((e) => e.id === id);
      if (!target) return;

      const snapshot = target;
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? optimistic(e) : e)),
      );

      try {
        const updated = await persistUpdate(target, update);
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? updated : e)),
        );
      } catch (err) {
        // Revert the optimistic change.
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? snapshot : e)),
        );
        throw err;
      }
    },
    [entries, persistUpdate],
  );

  const updateStatus = useCallback(
    (id: string, status: ReadingStatus) =>
      applyPatch(id, { status }, (e) => ({ ...e, status })),
    [applyPatch],
  );

  const updateProgress = useCallback(
    (
      id: string,
      progress: { pagesRead?: number; percentRead?: number },
    ) =>
      applyPatch(id, progress, (e) => ({ ...e, ...progress })),
    [applyPatch],
  );

  const updateTotalPages = useCallback(
    (id: string, totalPages: number) =>
      applyPatch(id, { totalPages }, (e) => ({ ...e, totalPages })),
    [applyPatch],
  );

  const value = useMemo(
    () => ({
      entries,
      has,
      addBook,
      removeBook,
      mergeEntry,
      updateStatus,
      updateProgress,
      updateTotalPages,
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
      mergeEntry,
      updateStatus,
      updateProgress,
      updateTotalPages,
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
