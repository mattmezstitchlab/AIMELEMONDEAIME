import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Espaces privés et liens à jeton : jamais indexés. */
const PRIVATE = ["/espace", "/back-office", "/admin", "/api", "/connexion", "/inscription", "/rsvp", "/invitation", "/partage-mariage"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
