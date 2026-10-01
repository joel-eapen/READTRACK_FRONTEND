import { useState, type FormEvent } from "react";
import { BookCard } from "../components/BookCard";
import { Badge, Button, Input } from "../components/ui";
import { searchBooks } from "../services/bookSearch";
import { useLibrary } from "../store/LibraryContext";
import type { Book } from "../types";
import "./Search.css";

export function Search() {
  const { has, addBook } = useLibrary();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const books = await searchBooks(q);
      setResults(books);
      setSearched(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search">
      <header className="search__head">
        <h1>Search Books</h1>
        <p className="search__sub">Find a title and add it to your library.</p>
      </header>

      <form className="search__bar" onSubmit={handleSearch} role="search">
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

      {error ? <p className="search__error label-caps">{error}</p> : null}

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
              footer={
                inLibrary ? (
                  <Badge tone="success">In Library</Badge>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => addBook(book)}
                  >
                    + Add to Library
                  </Button>
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
}
