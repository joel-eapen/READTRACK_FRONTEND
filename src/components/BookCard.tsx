import type { Book } from "../types";
import "./BookCard.css";

interface BookCardProps {
  book: Book;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
}

export function BookCard({ book, footer, badge }: BookCardProps) {
  const initials = book.title.slice(0, 2).toUpperCase();

  return (
    <article className="book-card">
      <div className="book-card__cover">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            loading="lazy"
          />
        ) : (
          <span className="book-card__placeholder" aria-hidden="true">
            {initials}
          </span>
        )}
        {badge ? <div className="book-card__badge">{badge}</div> : null}
      </div>
      <div className="book-card__body">
        <h3 className="book-card__title">{book.title}</h3>
        <p className="book-card__authors">{book.authors.join(", ")}</p>
        {book.year ? (
          <p className="book-card__year label-caps">{book.year}</p>
        ) : null}
        {footer ? <div className="book-card__footer">{footer}</div> : null}
      </div>
    </article>
  );
}
