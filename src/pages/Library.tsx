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
  const { entries, updateStatus, removeBook } = useLibrary();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: entries.length,
      want: 0,
      reading: 0,
      finished: 0,
      dnf: 0,
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

  const filters: Filter[] = ["all", "want", "reading", "finished", "dnf"];

  return (
    <div className="library">
      <header className="library__head">
        <h1>My Library</h1>
        <p className="library__sub">
          {entries.length} {entries.length === 1 ? "book" : "books"} tracked
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="library__empty">
          <p className="library__empty-title">Your library is empty.</p>
          <p className="library__empty-text">
            Search for books and add them to start tracking.
          </p>
          <Link to="/search">
            <Button size="lg">Search Books</Button>
          </Link>
        </div>
      ) : (
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
        </>
      )}
    </div>
  );
}
