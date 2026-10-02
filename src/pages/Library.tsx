import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { Badge, Button, Select } from "../components/ui";
import { useLibrary } from "../store/LibraryContext";
import {
  STATUS_META,
  STATUS_OPTIONS,
  type ReadingStatus,
} from "../types";
import "./Library.css";

type Filter = "all" | ReadingStatus;

export function Library() {
  const {
    entries,
    updateStatus,
    removeBook,
    loading,
    error,
    page,
    totalPages,
    totalDocuments,
    goToPage,
    refetch,
  } = useLibrary();
  const [filter, setFilter] = useState<Filter>("all");

  // Counts reflect the current page of results (the backend paginates).
  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: entries.length,
      want_to_read: 0,
      current_read: 0,
      finished: 0,
    };
    for (const e of entries) base[e.status] += 1;
    return base;
  }, [entries]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? entries
        : entries.filter((e) => e.status === filter),
    [entries, filter],
  );

  const filters: Filter[] = ["all", "want_to_read", "current_read", "finished"];

  const isEmpty = !loading && !error && entries.length === 0;

  return (
    <div className="library">
      <header className="library__head">
        <h1>My Library</h1>
        <p className="library__sub">
          {totalDocuments} {totalDocuments === 1 ? "book" : "books"} tracked
        </p>
      </header>

      {error ? (
        <div className="library__error" role="alert">
          <p className="label-caps">{error}</p>
          <Button variant="neutral" size="sm" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : null}

      {loading && entries.length === 0 ? (
        <p className="library__loading label-caps">Loading your library…</p>
      ) : null}

      {isEmpty ? (
        <div className="library__empty">
          <p className="library__empty-title">Your library is empty.</p>
          <p className="library__empty-text">
            Search for books and add them to start tracking.
          </p>
          <Link to="/search">
            <Button size="lg">Search Books</Button>
          </Link>
        </div>
      ) : entries.length > 0 ? (
        <>
          <div className="library__filters" role="tablist" aria-label="Filter by status">
            {filters.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                className={`library__filter label-caps ${
                  filter === f ? "is-active" : ""
                }`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : STATUS_META[f].label} ({counts[f]})
              </button>
            ))}
          </div>

          <div className="library__grid">
            {visible.map((entry) => (
              <BookCard
                key={entry.id}
                book={entry}
                badge={
                  <Badge tone={STATUS_META[entry.status].tone}>
                    {STATUS_META[entry.status].label}
                  </Badge>
                }
                footer={
                  <>
                    <Select
                      label="Status"
                      options={STATUS_OPTIONS}
                      value={entry.status}
                      onChange={(e) =>
                        updateStatus(
                          entry.id,
                          e.target.value as ReadingStatus,
                        )
                      }
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      fullWidth
                      onClick={() => removeBook(entry.id)}
                    >
                      Remove
                    </Button>
                  </>
                }
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav className="library__pager" aria-label="Library pages">
              <Button
                variant="neutral"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => goToPage(page - 1)}
              >
                ← Prev
              </Button>
              <span className="library__page-info label-caps">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="neutral"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => goToPage(page + 1)}
              >
                Next →
              </Button>
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
