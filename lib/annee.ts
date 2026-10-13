/**
 * « Mon année à préparer » : agrégation pure des dates déjà présentes dans
 * l'espace de l'utilisateur. Aucune date n'est inventée ici — la seule
 * projection est l'anniversaire de l'utilisateur, récurrent chaque année.
 * Les échéances officielles (avec leur source) restent toujours distinctes
 * des rappels personnels calculés par les parcours.
 */

export type YearEventKind = "echeance" | "rappel" | "rendez-vous" | "projet" | "evenement" | "trajet" | "anniversaire";

export type YearEvent = {
  date: Date;
  kind: YearEventKind;
  label: string;
  detail?: string;
  href: string;
  /** Source affichée pour les échéances officielles — jamais pour les rappels. */
  source?: string | null;
};

export const YEAR_EVENT_LABELS: Record<YearEventKind, string> = {
  echeance: "Échéance officielle",
  rappel: "Rappel personnel",
  "rendez-vous": "Rendez-vous",
  projet: "Projet",
  evenement: "Événement",
  trajet: "Trajet",
  anniversaire: "Anniversaire",
};

/** Les kinds qui peuvent être « en retard » ; un projet passé n'est pas un retard. */
const OVERDUE_KINDS: ReadonlySet<YearEventKind> = new Set(["echeance", "rappel", "rendez-vous"]);

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Jours entiers entre une date et maintenant (négatif si la date est passée). */
export function daysBetween(date: Date, now: Date): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000);
}

/** « aujourd'hui », « demain », « dans 12 jours », « il y a 3 jours »… */
export function relativeLabel(date: Date, now: Date): string {
  const j = daysBetween(date, now);
  if (j === 0) return "aujourd'hui";
  if (j === 1) return "demain";
  if (j === -1) return "hier";
  return j > 0 ? `dans ${j} jours` : `il y a ${-j} jours`;
}

/**
 * Prochaine occurrence d'un anniversaire (format « YYYY-MM-DD » en base).
 * Le 29 février est fêté le 28 les années non bissextiles.
 */
export function nextBirthday(birthDate: string, from: Date): { date: Date; age: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Rejette les dates impossibles (31 avril, 30 février…) par allers-retours.
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) return null;
  const occurrence = (y: number) => {
    const bissextile = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const d = month === 2 && day === 29 && !bissextile ? 28 : day;
    return new Date(y, month - 1, d);
  };
  const thisYear = occurrence(from.getFullYear());
  const date = thisYear >= startOfDay(from) ? thisYear : occurrence(from.getFullYear() + 1);
  return { date, age: date.getFullYear() - year };
}

export type YearMonth = { key: string; label: string; events: YearEvent[] };

/**
 * Répartit les événements : retards (échéances, rappels et rendez-vous passés
 * et non terminés — les projets et événements passés, eux, disparaissent),
 * puis les 12 mois glissants à partir d'aujourd'hui.
 */
export function buildYear(events: YearEvent[], now: Date): { overdue: YearEvent[]; months: YearMonth[]; total: number } {
  const start = startOfDay(now);
  const end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  const byDate = (a: YearEvent, b: YearEvent) => a.date.getTime() - b.date.getTime() || a.label.localeCompare(b.label, "fr");
  const overdue = events.filter((e) => OVERDUE_KINDS.has(e.kind) && startOfDay(e.date) < start).sort(byDate);
  const upcoming = events
    .filter((e) => {
      const d = startOfDay(e.date);
      return d >= start && d < end;
    })
    .sort(byDate);
  const fmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
  const months: YearMonth[] = [];
  for (let i = 0; i < 12; i++) {
    const first = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const raw = fmt.format(first);
    months.push({
      key: `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`,
      label: raw.charAt(0).toUpperCase() + raw.slice(1),
      events: upcoming.filter((e) => e.date.getFullYear() === first.getFullYear() && e.date.getMonth() === first.getMonth()),
    });
  }
  return { overdue, months, total: overdue.length + upcoming.length };
}
