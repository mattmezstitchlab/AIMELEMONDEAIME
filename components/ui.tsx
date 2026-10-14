import Link from "next/link";
import type { ReactNode } from "react";
import { CASE_STATUS_LABELS, CASE_STATUS_STYLES } from "@/lib/constants";
import { Icon, type IconName } from "@/components/icon";

/* ------------------------------------------------------------------ */
/* Marque                                                             */
/* ------------------------------------------------------------------ */

/** Marque carrée (favicon, espaces connectés). Monochrome, comme le reste. */
export function LogoMark({ className = "h-9 w-9", tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  const bg = tone === "light" ? "rgba(255,255,255,0.16)" : "#111110";
  const fg = tone === "light" ? "#ffffff" : "#ffffff";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="9" fill={bg} />
      <path
        d="M20 31c0-8 0-12 7-17-1 7-3 10-7 12m0 5c0-8 0-12-7-17 1 7 3 10 7 12"
        fill="none"
        stroke={fg}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="10.5" r="2.2" fill={fg} />
    </svg>
  );
}

/**
 * Wordmark « AIME® » : Cal Sans, sans icône, comme le logo Cal.com.
 * `light` s’utilise sur les surfaces sombres (pied de page).
 */
export function Logo({ light = false, size = "md", withMark = false }: { light?: boolean; size?: "sm" | "md"; withMark?: boolean }) {
  const wordmark = size === "sm" ? "text-lg" : "text-xl";
  return (
    <span className="flex items-center gap-2.5">
      {withMark && <LogoMark className={size === "sm" ? "h-7 w-7" : "h-8 w-8"} tone={light ? "light" : "ink"} />}
      <span className="flex items-baseline gap-1">
        <span
          className={`font-display ${wordmark} leading-none tracking-[-0.01em] ${light ? "text-canvas" : "text-ink"}`}
        >
          AIME
        </span>
        <span className={`text-[9px] font-medium leading-none ${light ? "text-canvas/60" : "text-ink-4"}`}>®</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Mise en page                                                       */
/* ------------------------------------------------------------------ */

/**
 * Conteneur du site public : une colonne étroite et centrée, comme le modèle
 * de référence. `wide` n’est utilisé que par les pages qui alignent des grilles
 * denses (organismes, annuaire).
 */
export function Container({ children, className = "", wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={`mx-auto w-full ${wide ? "max-w-[56rem]" : "max-w-[46rem]"} px-5 sm:px-6 ${className}`}>{children}</div>;
}

/** Titre de section : étiquette, titre display, chapô. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  actions,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  actions?: ReactNode;
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl text-ink sm:text-4xl">{title}</h2>
      {description && <p className={`mt-4 text-base leading-relaxed text-ink-3 ${centered ? "mx-auto" : ""}`}>{description}</p>}
      {actions && <div className={`mt-7 flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}>{actions}</div>}
    </div>
  );
}

/**
 * En-tête de page publique (hors accueil).
 *
 * Langage du modèle de référence : une seule colonne, un titre display serré,
 * un chapô court, des actions alignées à gauche. Pas de dégradé, pas de bordure
 * décorative : la page commence par du texte, puis des tuiles.
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  actions,
  media,
  size = "lg",
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
  size?: "xl" | "lg" | "md";
  children?: ReactNode;
}) {
  const padding = size === "xl" ? "pt-8 pb-10 sm:pt-12" : size === "lg" ? "pt-6 pb-9 sm:pt-8" : "pt-5 pb-7";
  const titleSize =
    size === "xl"
      ? "text-[2.5rem] leading-[1.0] sm:text-[3.25rem]"
      : size === "lg"
        ? "text-[2.25rem] leading-[1.02] sm:text-[2.75rem]"
        : "text-[1.85rem] leading-[1.05] sm:text-[2.1rem]";

  return (
    <section className="bg-canvas">
      <Container className={`animate-fade-up ${padding}`} wide>
        <div className={media ? "grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-12" : ""}>
          <div className="max-w-2xl">
            {eyebrow && <p className="nav-tiny text-ink-3">{eyebrow}</p>}
            <h1 className={`mt-3 tracking-[-0.03em] text-ink ${titleSize}`}>{title}</h1>
            {subtitle && <p className="mt-4 text-[15px] leading-relaxed text-ink-3 sm:text-base">{subtitle}</p>}
            {actions && <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>}
            {children}
          </div>
          {media && <div className="animate-fade-up delay-2">{media}</div>}
        </div>
      </Container>
    </section>
  );
}

/**
 * Bandeau d’en-tête des espaces connectés (membre, gestionnaire, admin).
 * Une plaque blanche sobre : étiquette, titre, description, actions.
 */
export function SectionTitle({
  eyebrow,
  title,
  description,
  actions,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
  gradient?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel relative overflow-hidden px-6 py-6 sm:px-8 sm:py-7 ${className}`}>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-2 text-2xl text-ink sm:text-3xl">{title}</h1>
          {description && <p className="mt-2.5 text-sm leading-relaxed text-ink-3">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Contenants                                                         */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = "",
  as: Element = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li" | "section";
}) {
  return <Element className={`panel p-6 ${className}`}>{children}</Element>;
}

/** Carte plate (fond gris) : le pendant cal.com des blocs de fonctionnalités. */
export function FlatCard({
  children,
  className = "",
  as: Element = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  return <Element className={`rounded-card bg-muted p-6 ${className}`}>{children}</Element>;
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: IconName }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-3">{label}</p>
        {icon && <Icon name={icon} className="h-4 w-4 text-ink-4" />}
      </div>
      <p className="mt-3 font-display text-3xl leading-none text-ink">{value}</p>
      {hint && <p className="mt-2 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action, icon = "sparkles" }: { title: string; description?: string; action?: ReactNode; icon?: IconName }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-subtle px-6 py-14 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-canvas ring-1 ring-line">
        <Icon name={icon} className="h-5 w-5 text-ink-3" />
      </span>
      <p className="mt-4 text-base font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function FeatureIcon({ name, label, text }: { name: IconName; label: string; text?: string }) {
  return (
    <div className="flex flex-col items-start">
      <span className="grid h-10 w-10 place-items-center rounded-control bg-canvas ring-1 ring-line">
        <Icon name={name} className="h-5 w-5 text-ink" />
      </span>
      <p className="mt-4 text-base font-medium text-ink">{label}</p>
      {text && <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{text}</p>}
    </div>
  );
}

/** Encart d’information (remplace les bandeaux colorés ad hoc). */
export function Notice({
  tone = "info",
  title,
  children,
  icon,
  className = "",
}: {
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
  title?: string;
  children: ReactNode;
  icon?: IconName;
  className?: string;
}) {
  const tones: Record<string, { wrap: string; icon: string }> = {
    // Aucune couleur : l'intention se lit au contraste et à l'icône.
    info: { wrap: "bg-muted text-ink-2 ring-line", icon: "alert" },
    success: { wrap: "bg-muted text-ink ring-line", icon: "check" },
    warning: { wrap: "bg-muted text-ink ring-ink", icon: "alert" },
    danger: { wrap: "bg-canvas text-ink ring-ink", icon: "alert" },
    neutral: { wrap: "bg-muted text-ink-2 ring-line", icon: "alert" },
  };
  const style = tones[tone] ?? tones.neutral;
  const iconName = icon ?? (style.icon as IconName);
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`flex gap-3 rounded-control px-4 py-3 text-sm ring-1 ${style.wrap} ${className}`}>
      <Icon name={iconName} className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Étiquettes                                                         */
/* ------------------------------------------------------------------ */

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ink" | "outline" }) {
  const styles = {
    neutral: "bg-muted text-ink-2",
    ink: "bg-ink text-canvas",
    outline: "bg-canvas text-ink-2 ring-1 ring-line",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-display text-[11px] leading-none tracking-[0.02em] ${styles[tone]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, onDark = false }: { status: string; onDark?: boolean }) {
  const style = CASE_STATUS_STYLES[status] ?? "bg-muted text-ink-2 ring-line";
  const label = CASE_STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${style} ${onDark ? "bg-canvas/95" : ""}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Boutons                                                            */
/* ------------------------------------------------------------------ */

const CONTROL_BASE =
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium transition duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const SIZES = {
  sm: "h-9 px-3",
  md: "h-10 px-4",
  lg: "h-11 px-5 text-[15px]",
} as const;

export type ButtonSize = keyof typeof SIZES;

const VARIANTS = {
  /* Action primaire : noir profond, comme le CTA Cal.com. */
  primary: "bg-ink text-canvas hover:opacity-90 active:opacity-95",
  /* Action secondaire : blanc, anneau discret. */
  secondary: "bg-canvas text-ink-2 ring-1 ring-line hover:bg-subtle hover:text-ink",
  /* Action tertiaire : fantôme. */
  ghost: "text-ink-2 hover:bg-muted",
  /* Actions posées sur un fond encre (bandeaux, entêtes d'espace). */
  inverse: "bg-canvas text-ink hover:bg-canvas/90",
  outlineInverse: "text-canvas ring-1 ring-canvas/30 hover:bg-canvas/10",
  /* Action destructive. */
  danger: "bg-ink text-canvas hover:opacity-90",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

function controlClasses(variant: ButtonVariant, size: ButtonSize, className: string) {
  return `${CONTROL_BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
}

export function PrimaryButton({
  children,
  type = "button",
  className = "",
  size = "md",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize }) {
  return (
    <button type={type} className={controlClasses("primary", size, className)} {...rest}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  type = "button",
  className = "",
  size = "md",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize }) {
  return (
    <button type={type} className={controlClasses("secondary", size, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  className = "",
  variant = "primary",
  size = "md",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const cls = controlClasses(variant, size, className);
  // Les ancres internes (#section) ne passent pas par le routeur.
  if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Formulaires                                                        */
/* ------------------------------------------------------------------ */

const FIELD_BASE =
  "w-full rounded-control bg-canvas text-sm text-ink placeholder:text-ink-4 ring-1 ring-line transition focus:ring-2 focus:ring-ink disabled:bg-muted disabled:text-ink-3";

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-sm font-medium text-ink-2">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-ink-3">{hint}</span>}
    </label>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-10 px-3 ${FIELD_BASE} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`px-3 py-2.5 ${FIELD_BASE} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`h-10 px-3 pr-8 ${FIELD_BASE} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  name,
  hint,
  help,
  children,
  className = "",
}: {
  label: string;
  name?: string;
  hint?: string;
  help?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name} hint={hint}>
        {label}
      </Label>
      <div className="mt-2">{children ?? <Input id={name} name={name} />}</div>
      {help && <p className="mt-2 text-xs leading-relaxed text-ink-3">{help}</p>}
    </div>
  );
}

export function Checkbox({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={`flex items-start gap-3 text-sm text-ink-2 ${className}`}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border-line text-ink accent-ink" {...props} />
      <span className="leading-relaxed">{label}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Formats                                                            */
/* ------------------------------------------------------------------ */

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Jours entiers écoulés depuis une date (ancienneté d’un dossier, d’une attente…). */
export function daysSince(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

export function formatAmount(value: string | number) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}
