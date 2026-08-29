export const SITE = {
  name: "The Design Index",
  /** Update if a different .vercel.app subdomain is claimed at deploy time. */
  url: "https://rvnztolentino-the-design-index.vercel.app",
  description:
    "A hand-kept index of website and app templates. Every entry is a single self-contained HTML file, free to download and free to use.",
  repo: "https://github.com/rvnztolentino/the-design-index",
} as const;

/** Where "View source" points: the file as committed, on GitHub. */
export function sourceUrl(file: string): string {
  return `${SITE.repo}/blob/main/public${file}`;
}

export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}
