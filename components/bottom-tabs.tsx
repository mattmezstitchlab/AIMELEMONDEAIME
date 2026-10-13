"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

/**
 * Dock public pour mobile : les cinq entrées principales du produit, en un
 * seul endroit, au pouce. Sur ordinateur, l'en-tête et le pied de page
 * portent la navigation (le dock est masqué dès md). L'espace connecté a
 * sa propre navigation basse (AppShell) ; ce dock ne s'affiche que via
 * PublicShell. L'assistant reste au-dessus du dock (bottom-20 sur mobile).
 */
const TABS: Array<{ key: string; label: string; href: string; icon: IconName }> = [
  { key: "accueil", label: "Accueil", href: "/", icon: "home" },
  { key: "informer", label: "S'informer", href: "/informations", icon: "book" },
  { key: "carte", label: "Carte", href: "/le-monde-aime", icon: "pin" },
  { key: "publier", label: "Publier", href: "/le-monde-aime?onglet=publier", icon: "filePlus" },
  { key: "espace", label: "Mon espace", href: "/espace", icon: "user" },
];

function activeKey(pathname: string, onglet: string | null): string {
  if (pathname === "/") return "accueil";
  if (pathname.startsWith("/informations") || pathname.startsWith("/guides")) return "informer";
  if (pathname.startsWith("/le-monde-aime")) return onglet === "publier" ? "publier" : "carte";
  if (pathname.startsWith("/espace") || pathname.startsWith("/connexion") || pathname.startsWith("/inscription")) return "espace";
  return "";
}

export function BottomTabs() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const active = activeKey(pathname, searchParams?.get("onglet") ?? null);
  return (
    <nav aria-label="Navigation principale mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 text-[11px] font-medium ${isActive ? "text-emerald-800" : "text-slate-500"}`}
            >
              <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive ? "bg-emerald-50" : ""}`}>
                <Icon name={tab.icon} className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.6} />
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
