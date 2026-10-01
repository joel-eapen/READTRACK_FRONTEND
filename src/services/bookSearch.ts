import type { Book } from "../types";

const MOCK_BOOKS: Book[] = [
  {
    id: "mock-1",
    title: "House of Leaves",
    authors: ["Mark Z. Danielewski"],
    year: 2000,
  },
  {
    id: "mock-2",
    title: "Brutalism: Architecture of the Concrete",
    authors: ["Peter Chadwick"],
    year: 2016,
  },
  {
    id: "mock-3",
    title: "The Design of Everyday Things",
    authors: ["Don Norman"],
    year: 1988,
  },
  {
    id: "mock-4",
    title: "Infinite Jest",
    authors: ["David Foster Wallace"],
    year: 1996,
  },
  {
    id: "mock-5",
    title: "Grid Systems in Graphic Design",
    authors: ["Josef Müller-Brockmann"],
    year: 1981,
  },
];

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

/**
 * Search books. Tries the Open Library API; if the network is unavailable
 * (offline/dev), falls back to a local mock dataset filtered by query.
 */
export async function searchBooks(query: string): Promise<Book[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
      q,
    )}&limit=20&fields=key,title,author_name,first_publish_year,cover_i`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const data: { docs: OpenLibraryDoc[] } = await res.json();
    return data.docs.map((doc) => ({
      id: doc.key,
      title: doc.title,
      authors: doc.author_name ?? ["Unknown"],
      year: doc.first_publish_year,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : undefined,
    }));
  } catch {
    const lower = q.toLowerCase();
    return MOCK_BOOKS.filter(
      (b) =>
        b.title.toLowerCase().includes(lower) ||
        b.authors.some((a) => a.toLowerCase().includes(lower)),
    );
  }
}
