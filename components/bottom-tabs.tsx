"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

const TABS: Array<{ key: string; href: string; label: string; icon: IconName }> = [
  { key: "explorer", href: "/le-monde-aime", label: "Explorer", icon: "search" },
  { key: "publier", href: "/le-monde-aime?onglet=publier", label: "Publier", icon: "filePlus" },
  { key: "liens", href: "/espace", label: "Mon espace", icon: "home" },
];

/** Navigation mobile commune : Explorer, Publier, Mes liens. */
export function BottomTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const onglet = params.get("onglet");
  const inApp = pathname.startsWith("/le-monde-aime");
  const active = !inApp ? "" : onglet === "publier" ? "publier" : onglet === "liens" || pathname !== "/le-monde-aime" ? "liens" : "explorer";
  return (
    <nav aria-label="Navigation mobile Le Monde Aime" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-black/[0.06] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? "page" : undefined}
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold ${active === tab.key ? "text-emerald-800" : "text-slate-500"}`}
        >
          <Icon name={tab.icon} className="h-[22px] w-[22px]" strokeWidth={active === tab.key ? 2 : 1.6} />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
