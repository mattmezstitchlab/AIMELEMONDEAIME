import type { MetadataRoute } from "next";

/** Espaces privés et liens à jeton : jamais indexés. */
const PRIVATE = ["/espace", "/back-office", "/admin", "/api", "/connexion", "/inscription", "/rsvp", "/invitation", "/partage-mariage"];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }],
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
