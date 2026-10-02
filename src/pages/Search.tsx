import { useCallback, useState, type FormEvent } from "react";
import { BookCard } from "../components/BookCard";
import { BookDetailModal } from "../components/BookDetailModal";
import { Badge, Button, Input } from "../components/ui";
import { useBookSearch } from "../services/useBookSearch";
import { useLibrary } from "../store/LibraryContext";
import type { Book } from "../types";
import "./Search.css";

const PAGE_SIZE = 20;

export function Search() {
  const { has, addBook } = useLibrary();
  const searchBooks = useBookSearch();

  const [query, setQuery] = useState("");
  // The term that produced the current results (so pagination keeps the query).
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Book | null>(null);
  // id of the book currently being saved to the backend (for button spinner).
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState("");

  const handleAdd = useCallback(
    async (book: Book): Promise<boolean> => {
      setAddError("");
      setAddingId(book.id);
      try {
        await addBook(book);
        return true;
      } catch (err) {
        setAddError(
          err instanceof Error
            ? err.message
            : `Couldn't add "${book.title}". Try again.`,
        );
        return false;
      } finally {
        setAddingId(null);
      }
    },
    [addBook],
  );

  const runSearch = useCallback(
    async (term: string, nextPage: number) => {
      setLoading(true);
      setError("");
      try {
        const res = await searchBooks(term, nextPage, PAGE_SIZE);
        setResults(res.books);
        setPage(res.page);
        setHasMore(res.hasMore);
        setActiveQuery(term);
        setSearched(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [searchBooks],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    runSearch(q, 1);
  };

  return (
    <div className="search">
      <header className="search__head">
        <h1>Search Books</h1>
        <p className="search__sub">Find a title and add it to your library.</p>
      </header>

      <form className="search__bar" onSubmit={handleSubmit} role="search">
        <Input
          label="Search"
          placeholder="Title, author, keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search books"
        />
        <Button type="submit" size="lg" loading={loading}>
          Search
        </Button>
      </form>

      {error ? (
        <p className="search__error label-caps" role="alert">
          {error}
        </p>
      ) : null}

      {addError ? (
        <p className="search__error label-caps" role="alert">
          {addError}
        </p>
      ) : null}

      {searched && !loading && results.length === 0 && !error ? (
        <p className="search__empty label-caps">
          No books found. Try different keywords.
        </p>
      ) : null}

      <div className="search__grid">
        {results.map((book) => {
          const inLibrary = has(book.id);
          return (
            <BookCard
              key={book.id}
              book={book}
              onSelect={setSelected}
              footer={
                inLibrary ? (
                  <Badge tone="success">In Library</Badge>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    loading={addingId === book.id}
                    disabled={addingId !== null}
                    onClick={() => handleAdd(book)}
                  >
                    + Add to Library
                  </Button>
                )
              }
            />
          );
        })}
      </div>

      {searched && results.length > 0 ? (
        <nav className="search__pager" aria-label="Search results pages">
          <Button
            variant="neutral"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => runSearch(activeQuery, page - 1)}
          >
            ← Prev
          </Button>
          <span className="search__page-info label-caps">Page {page}</span>
          <Button
            variant="neutral"
            size="sm"
            disabled={!hasMore || loading}
            onClick={() => runSearch(activeQuery, page + 1)}
          >
            Next →
          </Button>
        </nav>
      ) : null}

      <BookDetailModal
        book={selected}
        onClose={() => setSelected(null)}
        actions={
          selected ? (
            has(selected.id) ? (
              <Badge tone="success">In Library</Badge>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                loading={addingId === selected.id}
                disabled={addingId !== null}
                onClick={async () => {
                  const target = selected;
                  const ok = await handleAdd(target);
                  if (ok) {
                    setSelected((cur) =>
                      cur?.id === target.id ? null : cur,
                    );
                  }
                }}
              >
                + Add to Library
              </Button>
            )
          ) : null
        }
      />
    </div>
  );
}
