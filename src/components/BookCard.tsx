import type { Book } from "../types";
import "./BookCard.css";

interface BookCardProps {
  book: Book;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
  /** When provided, the cover and title become a button that opens details. */
  onSelect?: (book: Book) => void;
}

export function BookCard({ book, footer, badge, onSelect }: BookCardProps) {
  const initials = book.title.slice(0, 2).toUpperCase();
  const clickable = Boolean(onSelect);

  const cover = (
    <>
      {book.coverUrl ? (
        <img src={book.coverUrl} alt={`Cover of ${book.title}`} loading="lazy" />
      ) : (
        <span className="book-card__placeholder" aria-hidden="true">
          {initials}
        </span>
      )}
      {badge ? <div className="book-card__badge">{badge}</div> : null}
    </>
  );

  return (
    <article className="book-card">
      {clickable ? (
        <button
          type="button"
          className="book-card__cover book-card__cover--clickable"
          onClick={() => onSelect?.(book)}
          aria-label={`View details for ${book.title}`}
        >
          {cover}
        </button>
      ) : (
        <div className="book-card__cover">{cover}</div>
      )}

      <div className="book-card__body">
        {clickable ? (
          <button
            type="button"
            className="book-card__title book-card__title--clickable"
            onClick={() => onSelect?.(book)}
          >
            {book.title}
          </button>
        ) : (
          <h3 className="book-card__title">{book.title}</h3>
        )}
        <p className="book-card__authors">{book.authors.join(", ")}</p>
        {book.year ? (
          <p className="book-card__year label-caps">{book.year}</p>
        ) : null}
        {footer ? <div className="book-card__footer">{footer}</div> : null}
      </div>
    </article>
  );
}
