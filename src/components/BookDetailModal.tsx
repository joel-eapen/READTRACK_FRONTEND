import { useEffect, useRef, type ReactNode } from "react";
import type { Book } from "../types";
import "./BookDetailModal.css";

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  /** Optional actions (e.g. Add to Library) rendered in the footer. */
  actions?: ReactNode;
}

interface MetaRow {
  label: string;
  value: string;
}

export function BookDetailModal({ book, onClose, actions }: BookDetailModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!book) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [book, onClose]);

  if (!book) return null;

  const initials = book.title.slice(0, 2).toUpperCase();

  // Only include metadata the API actually provided.
  const rows: MetaRow[] = [
    { label: "Author", value: book.authors.join(", ") },
    book.isbn ? { label: "ISBN", value: book.isbn } : null,
    {
      label: "Total Pages",
      value:
        book.totalPages && book.totalPages > 0
          ? String(book.totalPages)
          : "Not available",
    },
    book.year ? { label: "Year", value: String(book.year) } : null,
  ].filter((r): r is MetaRow => r !== null);

  return (
    <div
      className="modal__overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          className="modal__close"
          onClick={onClose}
          aria-label="Close details"
        >
          ✕
        </button>

        <div className="modal__content">
          <div className="modal__cover">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={`Cover of ${book.title}`} />
            ) : (
              <span className="modal__placeholder" aria-hidden="true">
                {initials}
              </span>
            )}
          </div>

          <div className="modal__info">
            <h2 id="book-modal-title" className="modal__title">
              {book.title}
            </h2>

            <dl className="modal__meta">
              {rows.map((row) => (
                <div className="modal__meta-row" key={row.label}>
                  <dt className="modal__meta-label label-caps">{row.label}</dt>
                  <dd className="modal__meta-value">{row.value}</dd>
                </div>
              ))}
            </dl>

            {actions ? <div className="modal__actions">{actions}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
