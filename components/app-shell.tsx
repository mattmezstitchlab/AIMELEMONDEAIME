import Link from "next/link";
import type { ReactNode } from "react";
import { SidebarLink, BottomNavLink } from "@/components/nav-link";
import { logoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";

export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

export function AppShell({
  children,
  navItems,
  roleLabel,
  userName,
  homeHref,
  notificationCount,
  officeName,
  mobileItems,
}: {
  children: ReactNode;
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  homeHref: string;
  notificationCount?: number;
  officeName?: string | null;
  mobileItems?: NavItem[];
}) {
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf9]">
      <div className="flex flex-1">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-black/[0.06] bg-white/80 px-5 py-7 backdrop-blur-xl md:flex">
          <Link href={homeHref} className="mb-8 px-2" aria-label="Accueil de l'espace">
            <Logo />
          </Link>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{roleLabel}</p>
          <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => (
              <SidebarLink key={item.href} {...item} />
            ))}
          </nav>
          <div className="mt-6 rounded-2xl bg-[#fafaf9] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-800 text-sm font-semibold text-white">{initials}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
                {officeName && <p className="truncate text-xs text-slate-500">{officeName}</p>}
              </div>
              {typeof notificationCount === "number" && notificationCount > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-800 px-2 py-0.5 text-xs font-semibold text-white" aria-label={`${notificationCount} notifications non lues`}>
                  <Icon name="bell" className="h-3 w-3" />
                  {notificationCount}
                </span>
              )}
            </div>
            <form action={logoutAction} className="mt-3">
              <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-600 hover:bg-white">
                <Icon name="logout" className="h-4 w-4" />
                Se déconnecter
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 py-3 backdrop-blur-xl md:hidden">
            <Link href={homeHref} aria-label="Accueil de l'espace">
              <Logo size="sm" />
            </Link>
            <div className="flex items-center gap-2">
              {typeof notificationCount === "number" && notificationCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800 px-2 py-1 text-xs font-semibold text-white" aria-label={`${notificationCount} notifications non lues`}>
                  <Icon name="bell" className="h-3 w-3" />
                  {notificationCount}
                </span>
              )}
              <form action={logoutAction}>
                <button type="submit" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700" aria-label="Se déconnecter">
                  <Icon name="logout" className="h-4 w-4" />
                </button>
              </form>
            </div>
          </header>
          <main id="contenu-principal" className="flex-1 px-4 py-6 pb-28 sm:px-6 md:pb-10 lg:px-10 lg:py-8">
            <div className="mx-auto flex max-w-6xl flex-col">{children}</div>
          </main>
        </div>
      </div>

      <nav
        aria-label="Navigation principale mobile"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-black/[0.06] bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        {(mobileItems ?? navItems).map((item) => (
          <BottomNavLink key={item.href} {...item} />
        ))}
      </nav>
    </div>
  );
}
