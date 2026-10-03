import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { BookDetailModal } from "../components/BookDetailModal";
import { Badge, Button, Input, Select } from "../components/ui";
import { useLibrary } from "../store/LibraryContext";
import { useBookDetail } from "../services/useBookDetail";
import {
  STATUS_META,
  STATUS_OPTIONS,
  type LibraryEntry,
  type ReadingStatus,
} from "../types";
import "./Library.css";

type Filter = "all" | ReadingStatus;

/**
 * The single-book editing surface shown inside the detail modal. Contains the
 * full update logic for one book — status and reading progress — persisting to
 * the backend (PATCH /api/books/:id) via the library context. Also exposes
 * remove. Owns its own saving/error state.
 */
function BookEditor({
  entry,
  loadingDetail,
  detailError,
  onRemoved,
}: {
  entry: LibraryEntry;
  loadingDetail: boolean;
  detailError: string;
  onRemoved: () => void;
}) {
  const { updateStatus, updateProgress, updateTotalPages, removeBook } =
    useLibrary();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [totalPagesDraft, setTotalPagesDraft] = useState(
    entry.totalPages != null && entry.totalPages > 0
      ? String(entry.totalPages)
      : "",
  );
  // Whether the total-pages field is actively being edited.
  const [editingTotal, setEditingTotal] = useState(false);
  const [pagesDraft, setPagesDraft] = useState(
    entry.pagesRead != null ? String(entry.pagesRead) : "",
  );
  const [percentDraft, setPercentDraft] = useState(
    entry.percentRead != null ? String(entry.percentRead) : "",
  );
  // Which progress field is actively being edited. Editing one locks the
  // other (the backend accepts only one of pagesRead/percentRead per request).
  const [progressMode, setProgressMode] = useState<"pages" | "percent" | null>(
    null,
  );

  const canTrackProgress = Boolean(entry.totalPages && entry.totalPages > 0);
  const percent = entry.percentRead ?? 0;
  const total = entry.totalPages ?? 0;

  // Live previews mirroring the backend's rounding:
  //   percent = round(pages / total * 100), pages = round(percent / 100 * total)
  const parsedPages = Number(pagesDraft.trim());
  const livePercentFromPages =
    total > 0 && pagesDraft.trim() !== "" && Number.isFinite(parsedPages)
      ? Math.min(100, Math.max(0, Math.round((parsedPages / total) * 100)))
      : 0;

  const parsedPercent = Number(percentDraft.trim());
  const livePagesFromPercent =
    total > 0 && percentDraft.trim() !== "" && Number.isFinite(parsedPercent)
      ? Math.min(
          total,
          Math.max(0, Math.round((parsedPercent / 100) * total)),
        )
      : 0;

  const handleStatus = async (status: ReadingStatus) => {
    if (status === entry.status) return;
    setError("");
    setSaving(true);
    try {
      await updateStatus(entry.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update status.");
    } finally {
      setSaving(false);
    }
  };

  const onTotalPagesChange = (value: string) => {
    setTotalPagesDraft(value);
    setEditingTotal(value.trim() !== "");
    setError("");
  };

  const resetTotalPages = () => {
    setTotalPagesDraft(
      entry.totalPages != null && entry.totalPages > 0
        ? String(entry.totalPages)
        : "",
    );
    setEditingTotal(false);
    setError("");
  };

  const saveTotalPages = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    const totalPages = Number(totalPagesDraft.trim());
    if (!Number.isInteger(totalPages) || totalPages < 1) {
      setError("Enter a whole number of pages (1 or more).");
      return;
    }
    if (totalPages === entry.totalPages) {
      setEditingTotal(false);
      return;
    }

    // Updating the total page count resets pages read to 0 on the backend.
    // For a finished book this is especially surprising (it drops from
    // complete back to 0), so confirm before proceeding.
    if (entry.status === "finished") {
      const ok = window.confirm(
        "This book is marked as finished. Updating the total pages will reset " +
          "its pages read to 0, so it will no longer show as fully read. " +
          "You'll need to set the pages read or status again. Continue?",
      );
      if (!ok) return;
    }

    setError("");
    setSaving(true);
    try {
      await updateTotalPages(entry.id, totalPages);
      setEditingTotal(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't update total pages.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onPagesChange = (value: string) => {
    setPagesDraft(value);
    setProgressMode(value.trim() === "" ? null : "pages");
    setError("");
  };

  const onPercentChange = (value: string) => {
    setPercentDraft(value);
    setProgressMode(value.trim() === "" ? null : "percent");
    setError("");
  };

  const resetProgress = () => {
    setPagesDraft(entry.pagesRead != null ? String(entry.pagesRead) : "");
    setPercentDraft(entry.percentRead != null ? String(entry.percentRead) : "");
    setProgressMode(null);
    setError("");
  };

  const saveProgress = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    if (!progressMode) return;

    if (progressMode === "pages") {
      const pagesRead = Number(pagesDraft.trim());
      if (!Number.isInteger(pagesRead) || pagesRead < 0) {
        setError("Enter a whole number of pages (0 or more).");
        return;
      }
      if (entry.totalPages && pagesRead > entry.totalPages) {
        setError(`Pages read can't exceed ${entry.totalPages}.`);
        return;
      }
      if (pagesRead === entry.pagesRead) {
        setProgressMode(null);
        return;
      }
      setError("");
      setSaving(true);
      try {
        await updateProgress(entry.id, { pagesRead });
        setProgressMode(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Couldn't update progress.",
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    // progressMode === "percent"
    const percentRead = Number(percentDraft.trim());
    if (!Number.isInteger(percentRead) || percentRead < 0 || percentRead > 100) {
      setError("Enter a whole percentage between 0 and 100.");
      return;
    }
    if (percentRead === entry.percentRead) {
      setProgressMode(null);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateProgress(entry.id, { percentRead });
      setProgressMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update progress.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setError("");
    setSaving(true);
    try {
      await removeBook(entry.id);
      onRemoved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't remove this book.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="library__editor">
      <div className="library__editor-row">
        <Badge tone={STATUS_META[entry.status].tone}>
          {STATUS_META[entry.status].label}
        </Badge>
        {loadingDetail ? (
          <span className="label-caps">Refreshing…</span>
        ) : null}
      </div>

      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={entry.status}
        disabled={saving}
        onChange={(e) => handleStatus(e.target.value as ReadingStatus)}
      />

      <form onSubmit={saveTotalPages} className="library__total-group">
        {!canTrackProgress ? (
          <div className="library__total-warning" role="alert">
            <Badge tone="warning">No total pages</Badge>
            <p className="library__total-warning-text">
              This book has no total page count. Enter the number of pages
              below to enable progress tracking. You can also update it later
              if the figure looks incorrect.
            </p>
          </div>
        ) : null}

        <Input
          label="Total pages"
          type="number"
          min={1}
          inputMode="numeric"
          value={totalPagesDraft}
          disabled={saving}
          onChange={(e) => onTotalPagesChange(e.target.value)}
          hint={
            canTrackProgress
              ? "Edit the book's page count if it looks incorrect"
              : "Set a page count to track reading progress"
          }
        />
        {editingTotal ? (
          <>
            {entry.status === "finished" ? (
              <div className="library__total-warning" role="alert">
                <Badge tone="warning">Heads up</Badge>
                <p className="library__total-warning-text">
                  This book is finished. Saving a new total page count will
                  reset its pages read to 0, so it will no longer show as fully
                  read.
                </p>
              </div>
            ) : null}
            <div className="library__editor-row">
              <Button
                type="submit"
                size="sm"
                loading={saving}
                disabled={saving}
              >
                Save total pages
              </Button>
              <Button
                type="button"
                variant="neutral"
                size="sm"
                disabled={saving}
                onClick={resetTotalPages}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : null}
      </form>

      {canTrackProgress ? (
        <form onSubmit={saveProgress} className="library__progress-group">
          <Input
            label={`Pages read / ${entry.totalPages}`}
            type="number"
            min={0}
            max={entry.totalPages}
            inputMode="numeric"
            value={pagesDraft}
            disabled={saving || progressMode === "percent"}
            onChange={(e) => onPagesChange(e.target.value)}
            hint={
              progressMode === "pages"
                ? `→ ${livePercentFromPages}% (preview)`
                : `${percent}% complete`
            }
          />

          <Input
            label="Percent read"
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            value={percentDraft}
            disabled={saving || progressMode === "pages"}
            onChange={(e) => onPercentChange(e.target.value)}
            hint={
              progressMode === "percent"
                ? `→ ${livePagesFromPercent} / ${entry.totalPages} pages (preview)`
                : "0–100%"
            }
          />

          <div className="library__editor-row">
            <Button
              type="submit"
              size="sm"
              loading={saving}
              disabled={saving || progressMode === null}
            >
              Save progress
            </Button>
            {progressMode !== null ? (
              <Button
                type="button"
                variant="neutral"
                size="sm"
                disabled={saving}
                onClick={resetProgress}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : (
        <p className="library__no-progress label-caps">
          Set a total page count above to track progress
        </p>
      )}

      {error || detailError ? (
        <p className="library__item-error label-caps" role="alert">
          {error || detailError}
        </p>
      ) : null}

      <Button
        variant="danger"
        size="sm"
        fullWidth
        loading={saving}
        disabled={saving}
        onClick={handleRemove}
      >
        Remove from Library
      </Button>
    </div>
  );
}

export function Library() {
  const {
    entries,
    loading,
    error,
    page,
    totalPages,
    totalDocuments,
    goToPage,
    refetch,
    mergeEntry,
  } = useLibrary();
  const [filter, setFilter] = useState<Filter>("all");
  const fetchDetail = useBookDetail();
  // The book shown in the detail/edit modal (by id), plus fresh-fetch state.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Always render the modal from the live context entry so status/progress
  // updates (which mutate context state) are reflected immediately.
  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId],
  );

  const openDetail = async (entry: LibraryEntry) => {
    // Show what we already have immediately, then refresh from the backend
    // (GET /api/books/:id) for the authoritative values.
    setSelectedId(entry.id);
    setDetailError("");
    if (!entry.backendId) return;

    setDetailLoading(true);
    try {
      const fresh = await fetchDetail(entry.backendId);
      // Fold the authoritative server values into context so the modal
      // (which renders from context) and the grid both reflect them.
      mergeEntry(fresh);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "Couldn't load book details.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetailError("");
  };

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
                onSelect={() => openDetail(entry)}
                badge={
                  <Badge tone={STATUS_META[entry.status].tone}>
                    {STATUS_META[entry.status].label}
                  </Badge>
                }
                footer={
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => openDetail(entry)}
                  >
                    View & Update
                  </Button>
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

      <BookDetailModal
        book={selected}
        onClose={closeDetail}
        actions={
          selected ? (
            <BookEditor
              key={`${selected.id}:${selected.pagesRead ?? ""}:${selected.percentRead ?? ""}:${selected.status}:${selected.totalPages ?? ""}`}
              entry={selected}
              loadingDetail={detailLoading}
              detailError={detailError}
              onRemoved={closeDetail}
            />
          ) : null
        }
      />
    </div>
  );
}
