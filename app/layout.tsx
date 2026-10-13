import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getCurrentUser, getSession } from "@/lib/auth";
import { getAssistantSummary } from "@/lib/journey-queries";
import { getYearEvents } from "@/lib/annee-queries";
import { AssistantWidget } from "@/components/assistant/assistant";
import type { AssistantRole } from "@/lib/assistant/registry";

export const metadata: Metadata = {
  title: "AIME® — Le Monde Aime · La terre, les arts et les générations",
  description:
    "Trouvez près de vous de quoi vivre, créer et transmettre. Un seul espace pour vos projets, vos échanges et l'accompagnement de vos démarches. Prototype indépendant, non affilié à un organisme public.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const role: AssistantRole = user ? (user.role as AssistantRole) : "visiteur";
  // Assistant personnalisé (niveau 1) : résumé en lecture seule des démarches
  // du membre. En cas de base injoignable, l'assistant reste générique.
  const summary = user?.role === "membre" ? await getAssistantSummary(user.id).catch(() => null) : null;
  // Même source que la page « Mon année à préparer » : l'assistant raconte
  // l'année du membre depuis exactement les mêmes dates (sérialisées).
  const yearEvents = user?.role === "membre"
    ? await getYearEvents(user.id, user.birthDate).then((es) => es.map((e) => ({ ...e, date: e.date.toISOString() }))).catch(() => null)
    : null;
  // Assistant niveau 2 : les écritures confirmées ne sont proposées qu'à un
  // membre réel — jamais à la visite guidée, qui reste en lecture seule.
  const canAct = user?.role === "membre" && (await getSession())?.demo !== true;
  return (
    <html lang="fr">
      <body className="bg-white text-slate-900 antialiased">
        <a href="#contenu-principal" className="skip-link">
          Aller au contenu principal
        </a>
        {children}
        <AssistantWidget role={role} userName={user?.fullName ?? null} summary={summary} canAct={canAct} yearEvents={yearEvents} />
      </body>
    </html>
  );
}
