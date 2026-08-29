/**
 * Display order is the array order. Adding a category is one entry here;
 * categories with no templates are skipped by the index at build time.
 */
export const CATEGORIES = [
  { id: "clothing", name: "Online clothing stores" },
  { id: "shops", name: "Online shops" },
  { id: "portfolios", name: "Portfolios" },
  { id: "landing", name: "Landing pages" },
  { id: "dashboards", name: "Dashboards" },
  { id: "ai-chat", name: "AI chat" },
  { id: "messaging", name: "Messaging apps" },
  { id: "mobile", name: "Mobile apps" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [
  CategoryId,
  ...CategoryId[],
];

const NAMES = new Map<string, string>(CATEGORIES.map((c) => [c.id, c.name]));

export function categoryName(id: string): string {
  return NAMES.get(id) ?? id;
}
