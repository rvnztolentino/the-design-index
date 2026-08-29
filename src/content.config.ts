import { existsSync } from "node:fs";

import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";
import { CATEGORY_IDS } from "./lib/categories";

/**
 * The screenshot script writes lossless WebP when cwebp is available and PNG
 * otherwise, so resolve against what is actually committed. Falls back to the
 * PNG name when neither exists, which keeps the error a visible 404.
 */
function resolveThumbnail(id: string): string {
  for (const ext of ["webp", "png"]) {
    if (existsSync(`public/thumbnails/${id}.${ext}`)) {
      return `/thumbnails/${id}.${ext}`;
    }
  }
  return `/thumbnails/${id}.png`;
}

const templates = defineCollection({
  loader: file("src/data/templates.json", {
    /**
     * templates.json stays a plain array, which is the nicest thing to hand-edit.
     * Astro's file loader warns on an empty array but not on an empty object, so
     * hand it a record keyed by id. Same entries, no console noise when the
     * index is deliberately empty.
     */
    parser: (text) => {
      const rows = JSON.parse(text) as { id: string }[];
      const seen = new Set<string>();
      for (const row of rows) {
        if (seen.has(row.id)) {
          throw new Error(`Duplicate template id "${row.id}" in templates.json`);
        }
        seen.add(row.id);
      }
      return Object.fromEntries(rows.map((row) => [row.id, row]));
    },
  }),
  schema: z
    .object({
      /** Slug. Doubles as the default file and thumbnail name. */
      id: z.string().regex(/^[a-z0-9-]+$/),
      name: z.string(),
      description: z.string(),
      categories: z.array(z.enum(CATEGORY_IDS)).nonempty(),
      date: z.coerce.date(),
      createdBy: z.string(),
      recommended: z.boolean().default(false),
      /** Rank within the Recommended section. Lower shows first. */
      rank: z.number().int().positive().optional(),
      /**
       * Both default to the id; set them only to break the convention.
       * Constrained to a single-slash root-relative path, so a stray value can
       * never become a `javascript:`, an absolute URL, or a protocol-relative
       * `//host` href once it reaches an anchor.
       */
      file: z
        .string()
        .regex(/^\/(?!\/)[\w./-]+$/)
        .optional(),
      thumbnail: z
        .string()
        .regex(/^\/(?!\/)[\w./-]+$/)
        .optional(),
    })
    .transform((t) => ({
      ...t,
      file: t.file ?? `/templates/${t.id}.html`,
      thumbnail: t.thumbnail ?? resolveThumbnail(t.id),
    }))
    .refine((t) => t.recommended === (t.rank !== undefined), {
      message: "A recommended template needs a rank, and vice versa.",
    }),
});

export const collections = { templates };
