import Link from "next/link";
import type { ReactNode } from "react";
import { SidebarLink, BottomNavLink } from "@/components/nav-link";
import { Logo } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { DisplayPreferences } from "@/components/display-preferences";

export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

/**
 * Coquille des espaces connectés (membre, équipe, administration).
 * Registre Cal.com « application » : fond papier, barre latérale blanche
 * délimitée par une hairline, entrées en pastilles, contenus en cartes.
 */
export function AppShell({
  children,
  navItems,
  roleLabel,
  userName,
  homeHref,
  notificationCount,
  officeName,
  mobileItems,
  demo = false,
}: {
  children: ReactNode;
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  homeHref: string;
  notificationCount?: number;
  officeName?: string | null;
  mobileItems?: NavItem[];
  /** Session de visite guidée : lecture seule, bandeau explicatif affiché. */
  demo?: boolean;
}) {
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-subtle">
      <div className="flex flex-1">
        <aside className="sticky top-0 hidden h-screen w-[17.5rem] shrink-0 flex-col border-r border-line bg-canvas px-3.5 py-6 md:flex">
          <Link href={homeHref} className="mb-7 px-2.5" aria-label="Accueil de l’espace">
            <Logo withMark />
          </Link>
          <p className="mb-2 px-3 font-display text-[11px] uppercase tracking-[0.14em] text-ink-4">{roleLabel}</p>
          <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-0.5">
            {navItems.map((item) => (
              <SidebarLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="mt-6 rounded-card bg-subtle p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-medium text-canvas">{initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{userName}</p>
                {officeName && <p className="truncate text-xs text-ink-3">{officeName}</p>}
              </div>
              {typeof notificationCount === "number" && notificationCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-canvas"
                  aria-label={`${notificationCount} notifications non lues`}
                >
                  <Icon name="bell" className="h-3 w-3" />
                  {notificationCount}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-0.5 border-t border-line pt-2">
              <Link href="/deconnexion" className="flex items-center gap-2 rounded-control px-2 py-2 text-sm text-ink-2 transition hover:bg-canvas hover:text-ink">
                <Icon name="logout" className="h-4 w-4" />
                Se déconnecter
              </Link>
              <DisplayPreferences mode="sidebar" />
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur-xl md:hidden">
            <Link href={homeHref} aria-label="Accueil de l’espace">
              <Logo size="sm" withMark />
            </Link>
            <div className="flex items-center gap-2">
              {typeof notificationCount === "number" && notificationCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-1 text-[11px] font-medium text-canvas"
                  aria-label={`${notificationCount} notifications non lues`}
                >
                  <Icon name="bell" className="h-3 w-3" />
                  {notificationCount}
                </span>
              )}
              <DisplayPreferences mode="mobile" />
              <Link
                href="/deconnexion"
                className="grid h-9 w-9 place-items-center rounded-control text-ink-2 ring-1 ring-line transition hover:bg-muted"
                aria-label="Se déconnecter"
              >
                <Icon name="logout" className="h-4 w-4" />
              </Link>
            </div>
          </header>
          <main id="contenu-principal" className="flex-1 px-4 py-6 pb-28 sm:px-6 md:pb-10 lg:px-10 lg:py-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-5">
              {demo && (
                <p
                  role="status"
                  className="flex flex-wrap items-center gap-2 rounded-card bg-muted px-4 py-3 text-sm text-ink ring-1 ring-ink"
                >
                  <strong>Visite guidée — lecture seule.</strong> Vous parcourez la vraie interface avec un compte de démonstration : les boutons d&apos;action sont inactifs.
                  <Link href="/deconnexion" className="font-semibold underline underline-offset-4">Quitter la visite</Link>
                </p>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>

      <nav
        aria-label="Navigation principale mobile"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        {(mobileItems ?? navItems).map((item) => (
          <BottomNavLink key={item.href} {...item} />
        ))}
      </nav>
    </div>
  );
}
