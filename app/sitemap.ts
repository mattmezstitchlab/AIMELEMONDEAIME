import type { MetadataRoute } from "next";

/**
 * Pages publiques indexables. Les espaces personnels (Mon espace, back-office,
 * administration) et les liens à jeton sont volontairement exclus : ils
 * répondent par une redirection tant que les comptes sont fermés.
 */
const PAGES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/accompagnement", priority: 0.9, changeFrequency: "weekly" },
  { path: "/le-monde-aime", priority: 0.9, changeFrequency: "daily" },
  { path: "/informations", priority: 0.8, changeFrequency: "weekly" },
  { path: "/decouvrir", priority: 0.7, changeFrequency: "monthly" },
  { path: "/annuaire", priority: 0.6, changeFrequency: "monthly" },
  { path: "/vision", priority: 0.5, changeFrequency: "monthly" },
  { path: "/mon-espace", priority: 0.4, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const lastModified = new Date();
  return PAGES.map((page) => ({
    url: `${base}${page.path === "/" ? "" : page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
