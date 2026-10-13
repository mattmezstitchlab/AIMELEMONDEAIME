import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getSession } from "@/lib/auth";
import { ensureDeadlineNotifications } from "@/lib/journey-queries";
import { AppShell, type NavItem } from "@/components/app-shell";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const NAV: NavItem[] = [
  { href: "/espace", label: "Mon aperçu", icon: "home", exact: true },
  { href: "/espace/demarches", label: "Mes démarches", icon: "demarches" },
  { href: "/espace/annee", label: "Mon année", icon: "calendar" },
  { href: "/espace/echanges", label: "Mes échanges & projets", icon: "echanges" },
  { href: "/espace/documents", label: "Mes documents", icon: "documents" },
  { href: "/espace/profil", label: "Mon profil", icon: "user" },
  { href: "/le-monde-aime", label: "La carte", icon: "pin" },
];

const MOBILE: NavItem[] = [
  { href: "/espace", label: "Mon espace", icon: "home", exact: true },
  { href: "/espace/demarches", label: "Démarches", icon: "demarches" },
  { href: "/espace/annee", label: "Année", icon: "calendar" },
  { href: "/le-monde-aime", label: "Carte", icon: "pin" },
  { href: "/le-monde-aime?onglet=publier", label: "Publier", icon: "filePlus" },
  { href: "/espace/echanges", label: "Échanges", icon: "echanges" },
];

export default async function EspaceLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "membre") redirect("/connexion");
  // Échéances de parcours proches : créer les notifications manquantes avant
  // de compter les non-lues (ne doit jamais empêcher l'affichage de l'espace).
  await ensureDeadlineNotifications(user.id).catch(() => 0);
  const unread = await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
  return (
    <AppShell navItems={NAV} mobileItems={MOBILE} roleLabel="Mon espace AIME®" userName={user.displayName ?? user.fullName} homeHref="/espace" notificationCount={unread.length} officeName={user.profileCity ?? user.city} demo={(await getSession())?.demo === true}>
      {children}
    </AppShell>
  );
}
