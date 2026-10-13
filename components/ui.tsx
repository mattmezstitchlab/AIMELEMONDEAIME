import Link from "next/link";
import type { ReactNode } from "react";
import { CASE_STATUS_LABELS, CASE_STATUS_STYLES, COLOR_FAMILY_HINTS, COLOR_FAMILY_LABELS, type ColorFamily } from "@/lib/constants";
import { Icon } from "@/components/icon";

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

const TONE_CLASSES: Record<ColorFamily, { band: string; eyebrow: string; sub: string; rule: string }> = {
  demarche: { band: "bg-demarche text-white", eyebrow: "text-white/85", sub: "text-white/90", rule: "border-white/50" },
  terre: { band: "bg-terre text-white", eyebrow: "text-white/85", sub: "text-white/90", rule: "border-white/50" },
  arts: { band: "bg-arts text-white", eyebrow: "text-white/85", sub: "text-white/90", rule: "border-white/50" },
  savoirs: { band: "bg-savoirs text-encre", eyebrow: "text-encre/80", sub: "text-encre/85", rule: "border-encre/50" },
  encre: { band: "bg-encre text-white", eyebrow: "text-white/70", sub: "text-white/85", rule: "border-white/30" },
};

/** Forme propre à chaque famille : l'information ne repose jamais sur la seule couleur. */
const FAMILY_GLYPH: Record<ColorFamily, ReactNode> = {
  demarche: <rect x="3.5" y="3.5" width="9" height="9" />,
  terre: <circle cx="8" cy="8" r="4.5" />,
  arts: <path d="M8 3.5 L12.5 12.5 L3.5 12.5 Z" />,
  savoirs: <path d="M8 2.5 L13.5 8 L8 13.5 L2.5 8 Z" />,
  encre: <rect x="3" y="7" width="10" height="2" />,
};

const FAMILY_CHIP: Record<ColorFamily, string> = {
  demarche: "bg-demarche text-white",
  terre: "bg-terre text-white",
  arts: "bg-arts text-white",
  savoirs: "bg-savoirs text-encre",
  encre: "bg-encre text-white",
};

/** Repère de famille : une forme (et son libellé, à côté) identifie la catégorie. */
export function FamilyMark({ family, chip = false }: { family: ColorFamily; chip?: boolean }) {
  return (
    <span className={`inline-grid h-6 w-6 shrink-0 place-items-center rounded-[4px] ${chip ? FAMILY_CHIP[family] : ""}`} aria-hidden="true">
      <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" focusable="false">{FAMILY_GLYPH[family]}</svg>
    </span>
  );
}

/**
 * Héros typographique, sans image : fond de couleur, titre dominant, alignement à gauche,
 * grille de 12 colonnes. La famille est signalée par une forme et un libellé.
 */
export function Hero({
  tone = "encre",
  eyebrow,
  title,
  subtitle,
  actions,
  footer,
  size = "lg",
  children,
}: {
  tone?: ColorFamily;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  size?: "xl" | "lg" | "md";
  children?: ReactNode;
}) {
  const t = TONE_CLASSES[tone];
  const padding = size === "xl" ? "pb-20 pt-10 md:pb-28 md:pt-14" : size === "lg" ? "pb-16 pt-10 md:pb-22 md:pt-12" : "pb-12 pt-8 md:pb-16 md:pt-10";
  return (
    <section className={`relative isolate overflow-hidden ${t.band}`}>
      <div className={`animate-fade-up mx-auto w-full max-w-7xl px-6 lg:px-8 ${padding}`}>
        <header className={`flex items-center gap-3 border-t-2 pt-4 text-xs font-semibold uppercase tracking-[0.16em] ${t.rule} ${t.eyebrow}`}>
          {tone !== "encre" && <FamilyMark family={tone} />}
          {eyebrow}
        </header>
        <h1 className="mt-12 max-w-5xl text-[clamp(3rem,9vw,8.5rem)] font-bold leading-[0.92] tracking-[-0.04em]">{title}</h1>
        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6 lg:col-start-7">
            {subtitle && <p className={`text-lg leading-relaxed sm:text-xl ${t.sub}`}>{subtitle}</p>}
            {actions && <div className="mt-9 flex flex-wrap gap-3">{actions}</div>}
            {children}
          </div>
        </div>
      </div>
      {footer && <div className={`relative mx-auto w-full max-w-7xl border-t-2 px-6 pb-12 pt-8 lg:px-8 ${t.rule}`}>{footer}</div>}
    </section>
  );
}

/** Légende des quatre familles : forme, numéro, libellé et rôle. Le repère se lit sans couleur. */
export function CategoryLegend() {
  const families: ColorFamily[] = ["demarche", "terre", "arts", "savoirs"];
  return (
    <section aria-labelledby="reperes-titre" className="border-t-2 border-encre pt-6">
      <h2 id="reperes-titre" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Repères</h2>
      <ol className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {families.map((f, i) => (
          <li key={f} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <FamilyMark family={f} chip />
              <span className="text-sm font-bold tabular-nums text-slate-500">0{i + 1}</span>
            </div>
            <p className="text-xl font-bold leading-tight text-encre">{COLOR_FAMILY_LABELS[f]}</p>
            <p className="text-sm leading-relaxed text-slate-600">{COLOR_FAMILY_HINTS[f]}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Bandeau de titre des espaces connectés (membre, gestionnaire, administration). Sans image. */
export function SectionTitle({
  eyebrow,
  title,
  description,
  tone = "encre",
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: ColorFamily;
  actions?: ReactNode;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <section className={`relative isolate -mx-4 -mt-6 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-2xl ${t.band}`}>
      <div className="animate-fade-up flex flex-col justify-between gap-6 px-6 py-10 sm:px-10 sm:py-12 md:flex-row md:items-end">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] ${t.eyebrow}`}>
              {tone !== "encre" && <FamilyMark family={tone} />}
              {eyebrow}
            </p>
          )}
          <h1 className="mt-5 text-4xl font-bold leading-[0.95] tracking-[-0.035em] sm:text-5xl lg:text-6xl">{title}</h1>
          {description && <p className={`mt-4 max-w-xl text-base sm:text-lg ${t.sub}`}>{description}</p>}
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
