import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

/*
 * Briques du site public : encre et papier, aucune couleur décorative.
 *
 *  · `HeroCard`  — la carte d'ouverture : un titre display, un chapô, un portrait ;
 *  · `ActionRow` — la carte d'action : un intitulé et un bouton pilule noir ;
 *  · `Panel`     — une carte qui contient un aperçu d'interface ;
 *  · `LinkRow`   — une ligne de texte sobre, pour les listes longues.
 *
 * Le rythme vient des surfaces (blanc, gris très clair) et des contours fins,
 * jamais de la teinte. Les couleurs sémantiques d'état restent réservées aux
 * informations qui en ont besoin (alerte, succès).
 */

export function HeroCard({
  title,
  subtitle,
  eyebrow,
  image,
  imageAlt = "",
  footer,
}: {
  title: ReactNode;
  subtitle: string;
  eyebrow?: string;
  /** Portrait affiché à droite de la carte (WebP, 620 × 775). */
  image?: { src: string; srcSet?: string; type?: string };
  imageAlt?: string;
  footer?: ReactNode;
}) {
  return (
    <section className="animate-fade-up rounded-[1.5rem] bg-subtle p-5 ring-1 ring-line sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch sm:gap-7">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            {eyebrow && <p className="nav-tiny text-ink-3">{eyebrow}</p>}
            {/*
             * Le titre se rétracte avec la largeur de l'écran : deux lignes,
             * jamais trois, du plus petit téléphone au grand écran.
             */}
            <h1 className="mt-2.5 text-[clamp(1.55rem,6.2vw,3.25rem)] leading-[1.0] tracking-[-0.03em] text-ink sm:mt-3">
              {title}
            </h1>
            <p className="mt-2.5 max-w-md text-[14.5px] leading-relaxed text-ink-2 sm:mt-3 sm:text-[15px]">{subtitle}</p>
          </div>
          {footer && <div className="mt-5">{footer}</div>}
        </div>

        {image && (
          <div className="shrink-0 sm:w-[9.5rem]">
            <picture>
              <source srcSet={image.srcSet} type={image.type} />
              <img
                src={image.src}
                alt={imageAlt}
                width={620}
                height={775}
                className="h-[8.25rem] w-full rounded-[1.25rem] object-cover ring-1 ring-line sm:h-full sm:min-h-[11rem]"
                loading="eager"
              />
            </picture>
          </div>
        )}
      </div>
    </section>
  );
}

/** Carte d'action : un intitulé et un bouton pilule noir. */
export function ActionRow({
  title,
  hint,
  href,
  label,
  icon = "arrow",
}: {
  title: string;
  hint?: string;
  href: string;
  label: string;
  icon?: IconName;
}) {
  return (
    <Link href={href} className="action-row justify-between">
      <span className="min-w-0">
        <span className="block text-[clamp(1.3rem,5vw,1.6rem)] leading-tight tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </span>
        {hint && <span className="mt-1 block text-sm text-ink-3">{hint}</span>}
      </span>
      <span className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-canvas">
        {label}
        <Icon name={icon} className="h-4 w-4" />
      </span>
    </Link>
  );
}

/**
 * Carte qui contient un aperçu d'interface. L'aperçu porte sa propre surface
 * claire, pour se détacher du fond de la carte.
 */
export function Panel({
  label,
  detail,
  children,
  className = "",
  wide = false,
}: {
  label?: string;
  detail?: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <section className={`flex flex-col rounded-[1.5rem] bg-subtle p-5 ring-1 ring-line ${wide ? "sm:col-span-2" : ""} ${className}`}>
      {label && (
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <h3 className="text-lg leading-tight tracking-[-0.02em] text-ink">{label}</h3>
          {detail && <span className="nav-tiny text-ink-4">{detail}</span>}
        </header>
      )}
      <div className="flex flex-1 items-start justify-center">{children}</div>
    </section>
  );
}

/** Ligne sobre pour les listes longues (guides, thèmes, ressources). */
export function LinkRow({
  href,
  title,
  meta,
  external = false,
}: {
  href: string;
  title: string;
  meta?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span className="min-w-0">
        <span className="block truncate text-[15px] text-ink">{title}</span>
        {meta && <span className="mt-0.5 block truncate text-xs text-ink-3">{meta}</span>}
      </span>
      <Icon
        name={external ? "external" : "arrow"}
        className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </>
  );

  const className =
    "group flex items-center justify-between gap-4 border-b border-line py-3.5 transition last:border-b-0";

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/**
 * En-tête de page publique (hors accueil) : étiquette, titre, chapô, actions.
 */
export function PageIntro({
  eyebrow,
  title,
  text,
  actions,
  image,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  actions?: ReactNode;
  image?: string;
}) {
  return (
    <section className="animate-fade-up border-b border-line pb-8">
      {eyebrow && <p className="nav-tiny text-ink-3">{eyebrow}</p>}
      <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-[2.25rem] leading-[1.02] tracking-[-0.03em] text-ink sm:text-[2.75rem]">{title}</h1>
          {text && <p className="mt-4 text-[15px] leading-relaxed text-ink-3">{text}</p>}
        </div>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- visuel local
          <img src={image} alt="" className="h-28 w-full rounded-[1.25rem] object-cover ring-1 ring-line sm:h-28 sm:w-40" />
        )}
      </div>
      {actions && <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>}
    </section>
  );
}

/** Titre de section du site public. */
export function TileHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-[1.75rem] leading-tight tracking-[-0.02em] text-ink">
      {children}
    </h2>
  );
}
