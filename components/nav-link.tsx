"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

function useActive(href: string, exact?: boolean) {
  const pathname = usePathname() ?? "";
  // Un lien paramétré (?onglet=…) n’est jamais marqué actif : plusieurs entrées
  // partagent la même route.
  if (href.includes("?")) return false;
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

/** Entrée de barre latérale : pastille grise à l’état actif (registre Cal.com). */
export function SidebarLink({ href, label, icon, exact }: { href: string; label: string; icon: IconName; exact?: boolean }) {
  const active = useActive(href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm transition ${
        active ? "bg-muted font-medium text-ink shadow-rested" : "text-ink-2 hover:bg-subtle hover:text-ink"
      }`}
    >
      <Icon name={icon} className={`h-4 w-4 ${active ? "text-ink" : "text-ink-4 group-hover:text-ink-2"}`} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/** Entrée de barre inférieure (mobile). */
export function BottomNavLink({ href, label, icon, exact }: { href: string; label: string; icon: IconName; exact?: boolean }) {
  const active = useActive(href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10.5px] font-medium ${
        active ? "text-ink" : "text-ink-3"
      }`}
    >
      <span className={`grid h-7 w-11 place-items-center rounded-full ${active ? "bg-muted" : ""}`}>
        <Icon name={icon} className="h-[19px] w-[19px]" strokeWidth={active ? 2 : 1.6} />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
