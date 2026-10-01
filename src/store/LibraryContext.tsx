import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Book, LibraryEntry, ReadingStatus } from "../types";

interface LibraryContextValue {
  entries: LibraryEntry[];
  has: (id: string) => boolean;
  addBook: (book: Book, status?: ReadingStatus) => void;
  removeBook: (id: string) => void;
  updateStatus: (id: string, status: ReadingStatus) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);
const STORAGE_KEY = "readtrack.library";

function loadEntries(): LibraryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LibraryEntry[]) : [];
  } catch {
    return [];
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<LibraryEntry[]>(loadEntries);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const has = useCallback(
    (id: string) => entries.some((e) => e.id === id),
    [entries],
  );

  const addBook = useCallback((book: Book, status: ReadingStatus = "want") => {
    setEntries((prev) => {
      if (prev.some((e) => e.id === book.id)) return prev;
      return [{ ...book, status, addedAt: Date.now() }, ...prev];
    });
  }, []);

  const removeBook = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateStatus = useCallback((id: string, status: ReadingStatus) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e)),
    );
  }, []);

  const value = useMemo(
    () => ({ entries, has, addBook, removeBook, updateStatus }),
    [entries, has, addBook, removeBook, updateStatus],
  );

  return <LibraryContext value={value}>{children}</LibraryContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
