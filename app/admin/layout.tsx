import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: "dashboard", exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "users" },
  { href: "/admin/bureaux", label: "Bureaux", icon: "building" },
  { href: "/admin/contenus", label: "Contenus", icon: "news" },
  { href: "/admin/organismes", label: "Organismes", icon: "building" },
  { href: "/admin/le-monde-aime", label: "Signalements locaux", icon: "shield" },
  { href: "/back-office", label: "Back-office", icon: "dossiers" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "administrateur") {
    redirect("/connexion");
  }

  return (
    <AppShell navItems={NAV} roleLabel="Administration" userName={user.fullName} homeHref="/admin" officeName="Administrateur national">
      {children}
    </AppShell>
  );
}
