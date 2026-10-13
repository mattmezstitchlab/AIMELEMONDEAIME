import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";
import { getOfficeById, getUnreadNotifications } from "@/lib/queries";

const NAV: NavItem[] = [
  { href: "/back-office", label: "Tableau de bord", icon: "dashboard", exact: true },
  { href: "/back-office/dossiers", label: "Dossiers", icon: "dossiers" },
  { href: "/back-office/rendez-vous", label: "Rendez-vous", icon: "calendar" },
  { href: "/back-office/messages", label: "Messages", icon: "echanges" },
];

export default async function BackOfficeLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "gestionnaire" && user.role !== "administrateur")) {
    redirect("/connexion");
  }
  const office = await getOfficeById(user.officeId);
  const unread = await getUnreadNotifications(user.id);
  const nav = user.role === "administrateur" ? [...NAV, { href: "/admin", label: "Administration", icon: "shield" as const }] : NAV;

  return (
    <AppShell
      navItems={nav}
      roleLabel="Équipe d'accompagnement AIME®"
      userName={user.fullName}
      homeHref="/back-office"
      officeName={office?.name ?? "Tous les bureaux"}
      notificationCount={unread.length}
    >
      {children}
    </AppShell>
  );
}
