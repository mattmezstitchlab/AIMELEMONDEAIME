import Link from "next/link";
import type { ReactNode } from "react";
import { CASE_STATUS_LABELS, CASE_STATUS_STYLES } from "@/lib/constants";
import { Icon } from "@/components/icon";
import { MeshGradientBackground, type HeroGradientTheme } from "@/components/mesh-gradient-background";

export function Logo({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className={box} aria-hidden="true">
        <rect width="40" height="40" rx="10" fill={light ? "rgba(255,255,255,0.18)" : "#171715"} />
        <path d="M20 31c0-8 0-12 7-17-1 7-3 10-7 12m0 5c0-8 0-12-7-17 1 7 3 10 7 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="10.5" r="2.2" fill="#fff" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={`text-xl font-bold tracking-[0.12em] ${light ? "text-white" : "text-[#1d1d1f]"}`}>AIME<sup className="ml-0.5 text-[10px] font-semibold tracking-normal">®</sup></span>
        <span className={`mt-1 text-[10px] font-medium uppercase tracking-[0.14em] ${light ? "text-white/70" : "text-slate-500"}`}>Le Monde Aime</span>
      </span>
    </span>
  );
}

/** Grand visuel immersif plein écran pour les pages publiques. */
export function Hero({
  image,
  gradient,
  eyebrow,
  title,
  subtitle,
  actions,
  size = "lg",
  children,
}: {
  /** Existing photo asset retained as a fallback; the image files are intentionally left in place during the shader test. */
  image: string;
  gradient?: HeroGradientTheme;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  size?: "xl" | "lg" | "md";
  children?: ReactNode;
}) {
  const height = size === "xl" ? "min-h-[92vh]" : size === "lg" ? "min-h-[72vh]" : "min-h-[52vh]";
  return (
    <section className={`relative isolate flex ${height} items-end overflow-hidden bg-[#0f1a14] md:items-center`}>
      {gradient ? (
        <MeshGradientBackground theme={gradient} />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="animate-hero-zoom absolute inset-0 z-0 h-full w-full object-cover" />
        </>
      )}
      <div className="hero-overlay absolute inset-0 z-10" />
      <div className="hero-overlay-bottom absolute inset-0 z-10 md:hidden" />
      <div className="animate-fade-up relative z-20 mx-auto w-full max-w-7xl px-6 pb-16 pt-40 md:py-32 lg:px-8">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
              {eyebrow}
            </p>
          )}
          <h1 className="text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">{title}</h1>
          {subtitle && <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">{subtitle}</p>}
          {actions && <div className="mt-9 flex flex-wrap gap-3">{actions}</div>}
          {children}
        </div>
      </div>
    </section>
  );
}

/** Bandeau visuel immersif pour les espaces connectés (membre, gestionnaire, admin). */
export function SectionTitle({
  eyebrow,
  title,
  description,
  image = "/images/hero-espace.jpg",
  gradient,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
  gradient?: HeroGradientTheme;
  actions?: ReactNode;
}) {
  return (
    <section className="relative isolate -mx-4 -mt-6 overflow-hidden bg-[#0f1a14] sm:mx-0 sm:mt-0 sm:rounded-2xl">
      {gradient ? (
        <MeshGradientBackground theme={gradient} />
      ) : (
        // The original image stays available as a fallback and remains in public/images.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="animate-hero-zoom absolute inset-0 z-0 h-full w-full object-cover" />
      )}
      <div className="hero-overlay absolute inset-0 z-10" />
      <div className="animate-fade-up relative z-20 flex min-h-[260px] flex-col justify-end gap-5 px-6 py-8 sm:min-h-[300px] sm:px-10 sm:py-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">{eyebrow}</p>}
          <h1 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
          {description && <p className="mt-3 max-w-xl text-base text-white/85 sm:text-lg">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </section>
  );
}

export function StatusBadge({ status, onDark = false }: { status: string; onDark?: boolean }) {
  const style = CASE_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 border-slate-200";
  const label = CASE_STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style} ${
        onDark ? "shadow-sm" : ""
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function FeatureIcon({ name, label, text }: { name: Parameters<typeof Icon>[0]["name"]; label: string; text?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon name={name} className="h-14 w-14 text-emerald-500" />
      <p className="mt-5 text-lg font-medium text-[#1d1d1f]">{label}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-[#fafaf9] px-6 py-14 text-center">
      <Icon name="sparkles" className="mx-auto h-10 w-10 text-emerald-500" />
      <p className="mt-3 text-base font-semibold text-slate-800">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

const primaryClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export function PrimaryButton({ children, type = "button", className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`${primaryClasses} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, type = "button", className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-[15px] font-semibold text-slate-800 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({ href, children, className = "", variant = "primary" }: { href: string; children: ReactNode; className?: string; variant?: "primary" | "ghost" }) {
  const cls =
    variant === "ghost"
      ? "inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
      : primaryClasses;
  return (
    <Link href={href} className={`${cls} ${className}`}>
      {children}
    </Link>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      {children}
    </span>
  );
}

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Jours entiers écoulés depuis une date (ancienneté d'un dossier, d'une attente…). */
export function daysSince(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

export function formatAmount(value: string | number) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}
