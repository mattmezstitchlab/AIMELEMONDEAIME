"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

/** Navigation mobile du site public, centrée sur les étapes du mariage. */
const TABS: Array<{ key: string; label: string; href: string; icon: IconName }> = [
  { key: "accueil", label: "Accueil", href: "/", icon: "home" },
  { key: "parcours", label: "Parcours", href: "/accompagnement?besoin=mariage", icon: "demarches" },
  { key: "guides", label: "Guides", href: "/informations/mariage", icon: "book" },
  { key: "espace", label: "Mon espace", href: "/mon-espace", icon: "user" },
];

function activeKey(pathname: string): string {
  if (pathname === "/") return "accueil";
  if (pathname.startsWith("/accompagnement")) return "parcours";
  if (pathname.startsWith("/informations") || pathname.startsWith("/guides")) return "guides";
  if (pathname.startsWith("/espace") || pathname.startsWith("/connexion") || pathname.startsWith("/inscription")) return "espace";
  return "";
}

export function BottomTabs() {
  const pathname = usePathname() ?? "";
  const active = activeKey(pathname);
  return (
    <nav
      aria-label="Navigation principale mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${isActive ? "text-ink" : "text-ink-3"}`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full ${isActive ? "bg-muted" : ""}`}>
                <Icon name={tab.icon} className="h-[19px] w-[19px]" strokeWidth={isActive ? 2 : 1.6} />
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
