export type ReadingStatus = "want_to_read" | "current_read" | "finished";

export interface Book {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  coverUrl?: string;
  isbn?: string;
  totalPages?: number;
}

export interface LibraryEntry extends Book {
  status: ReadingStatus;
  addedAt: number;
}

export const STATUS_META: Record<
  ReadingStatus,
  { label: string; tone: "secondary" | "primary" | "success" | "danger" }
> = {
  want_to_read: { label: "Want to Read", tone: "secondary" },
  current_read: { label: "Reading", tone: "primary" },
  finished: { label: "Finished", tone: "success" },
};

export const STATUS_OPTIONS = (
  Object.keys(STATUS_META) as ReadingStatus[]
).map((value) => ({ value, label: STATUS_META[value].label }));
