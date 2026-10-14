import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getCurrentUser, getSession } from "@/lib/auth";
import { getAssistantSummary } from "@/lib/journey-queries";
import { getYearEvents } from "@/lib/annee-queries";
import { AssistantWidget } from "@/components/assistant/assistant";
import type { AssistantRole } from "@/lib/assistant/registry";

/**
 * Adresse publique du site : sert aux URL canoniques, au sitemap et aux
 * aperçus de partage. À définir en production (`NEXT_PUBLIC_SITE_URL`) ;
 * à défaut, l’adresse locale évite un avertissement de build.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_DESCRIPTION =
  "Le fil s’était perdu : démarches civiles, mariage, transmissions entre générations et entraide de proximité. Des repères clairs pour les moments de vie. Prototype indépendant, non affilié à un organisme public.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "AIME® — Le Monde Aime · mariage, transmissions et entraide de proximité",
  description: SITE_DESCRIPTION,
  applicationName: "AIME® — Le Monde Aime",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AIME® — Le Monde Aime",
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "AIME® — Le Monde Aime",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "AIME® — Le Monde Aime : le fil s’était perdu, on le reprend." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIME® — Le Monde Aime",
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
};
/** Barre du navigateur : elle reprend le fond papier du site. */
export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const role: AssistantRole = user ? (user.role as AssistantRole) : "visiteur";
  // Assistant personnalisé (niveau 1) : résumé en lecture seule des démarches
  // du membre. En cas de base injoignable, l’assistant reste générique.
  const summary = user?.role === "membre" ? await getAssistantSummary(user.id).catch(() => null) : null;
  // Même source que la page « Mon année à préparer » : l’assistant raconte
  // l’année du membre depuis exactement les mêmes dates (sérialisées).
  const yearEvents = user?.role === "membre"
    ? await getYearEvents(user.id, user.birthDate).then((es) => es.map((e) => ({ ...e, date: e.date.toISOString() }))).catch(() => null)
    : null;
  // Assistant niveau 2 : les écritures confirmées ne sont proposées qu’à un
  // membre réel — jamais à la visite guidée, qui reste en lecture seule.
  const canAct = user?.role === "membre" && (await getSession())?.demo !== true;
  return (
    <html lang="fr">
      <body className="min-h-screen bg-canvas text-ink-2 antialiased">
        <a href="#contenu-principal" className="skip-link">
          Aller au contenu principal
        </a>
        {children}
        <AssistantWidget role={role} userName={user?.fullName ?? null} summary={summary} canAct={canAct} yearEvents={yearEvents} />
      </body>
    </html>
  );
}
