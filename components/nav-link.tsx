"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";

function useActive(href: string, exact?: boolean) {
  const pathname = usePathname();
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function SidebarLink({ href, label, icon, exact }: { href: string; label: string; icon: IconName; exact?: boolean }) {
  const active = useActive(href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition ${
        active ? "bg-emerald-800 text-white shadow-sm" : "text-slate-700 hover:bg-black/[0.04]"
      }`}
    >
      <Icon name={icon} className={`h-5 w-5 ${active ? "text-white" : "text-emerald-600"}`} />
      {label}
    </Link>
  );
}

export function BottomNavLink({ href, label, icon, exact }: { href: string; label: string; icon: IconName; exact?: boolean }) {
  const active = useActive(href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10.5px] font-medium ${
        active ? "text-emerald-700" : "text-slate-500"
      }`}
    >
      <Icon name={icon} className="h-[22px] w-[22px]" strokeWidth={active ? 2 : 1.6} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
