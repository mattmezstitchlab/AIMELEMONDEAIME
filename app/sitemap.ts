import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { openCircuits } from "@/lib/circuits";

/**
 * Pages publiques indexables. Les espaces personnels (Mon espace, back-office,
 * administration) et les liens à jeton sont volontairement exclus : ils
 * répondent par une redirection tant que les comptes sont fermés.
 */
/**
 * Les circuits ouverts sont des pages publiques : le plan du site les nomme,
 * et il les lit dans le catalogue — un circuit ajouté demain s'y inscrit seul.
 */
const CIRCUIT_PATHS = [
  { path: "/circuits", priority: 0.9, changeFrequency: "weekly" as const },
  ...openCircuits().map((circuit) => ({
    path: `/circuits/${circuit.key}`,
    priority: 0.7,
    changeFrequency: "weekly" as const,
  })),
];

const PAGES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/territoire", priority: 0.7, changeFrequency: "monthly" },
  { path: "/carte-des-liens", priority: 0.8, changeFrequency: "monthly" },
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/prestataires", priority: 0.8, changeFrequency: "monthly" },
  { path: "/invites", priority: 0.7, changeFrequency: "monthly" },
  { path: "/accompagnement", priority: 0.9, changeFrequency: "weekly" },
  { path: "/le-monde-aime", priority: 0.9, changeFrequency: "daily" },
  { path: "/informations", priority: 0.8, changeFrequency: "weekly" },
  { path: "/decouvrir", priority: 0.7, changeFrequency: "monthly" },
  { path: "/annuaire", priority: 0.6, changeFrequency: "monthly" },
  { path: "/vision", priority: 0.5, changeFrequency: "monthly" },
  { path: "/le-tour", priority: 0.8, changeFrequency: "monthly" },
  { path: "/mon-espace", priority: 0.4, changeFrequency: "monthly" },
  ...CIRCUIT_PATHS,
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map((page) => ({
    url: `${SITE_URL}${page.path === "/" ? "" : page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
