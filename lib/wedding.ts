/**
 * Mariage, deuxième temps : liste d'invités (réponses suivies) et budget,
 * adossés au projet partagé du parcours « Nous nous marions ».
 * Module pur : constantes d'affichage, conversions et compteurs testables,
 * aucune lecture de base ni horloge.
 */

export const GUEST_STATUSES = [
  { value: "a_inviter", label: "À inviter" },
  { value: "invite", label: "Invitation envoyée" },
  { value: "confirme", label: "A confirmé" },
  { value: "peut_etre", label: "Peut-être" },
  { value: "decline", label: "Ne viendra pas" },
] as const;
export const GUEST_STATUS_VALUES = GUEST_STATUSES.map((s) => s.value) as readonly string[];
export const guestStatusLabel = (v: string) => GUEST_STATUSES.find((s) => s.value === v)?.label ?? v;

export const GUEST_GROUPS = [
  { value: "famille", label: "Famille" },
  { value: "amis", label: "Amis" },
  { value: "travail", label: "Travail" },
  { value: "autre", label: "Autre" },
] as const;
export const GUEST_GROUP_VALUES = GUEST_GROUPS.map((g) => g.value) as readonly string[];
export const guestGroupLabel = (v: string) => GUEST_GROUPS.find((g) => g.value === v)?.label ?? v;

export const BUDGET_CATEGORIES = [
  { value: "lieu", label: "Lieu et location" },
  { value: "repas", label: "Repas et boissons" },
  { value: "musique", label: "Musique et animation" },
  { value: "photo", label: "Photo et vidéo" },
  { value: "tenues", label: "Tenues et alliances" },
  { value: "decoration", label: "Fleurs et décoration" },
  { value: "papeterie", label: "Papeterie et faire-part" },
  { value: "ceremonie", label: "Cérémonies" },
  { value: "transport", label: "Transport et hébergement" },
  { value: "divers", label: "Divers" },
] as const;
export const BUDGET_CATEGORY_VALUES = BUDGET_CATEGORIES.map((c) => c.value) as readonly string[];
export const budgetCategoryLabel = (v: string) => BUDGET_CATEGORIES.find((c) => c.value === v)?.label ?? v;

export const MAX_GUESTS = 600;
export const MAX_BUDGET_ITEMS = 120;
const MAX_EUROS = 10_000_000;

/**
 * Conversion déterministe d'un montant saisi en centimes.
 * Accepte « 1200 », « 1 200 », « 1 200,50 », « 1200.5 » ; refuse tout le reste
 * (aucune interprétation approximative d'un montant d'argent).
 */
export function parseEuroToCents(raw: string): number | null {
  const clean = String(raw ?? "").replace(/[€\s\u00a0\u202f]/g, "").replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(clean)) return null;
  const cents = Math.round(Number(clean) * 100);
  if (!Number.isFinite(cents) || cents < 0 || cents > MAX_EUROS * 100) return null;
  return cents;
}

export function formatEuro(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

export type GuestLike = { persons: number; status: string };
export type GuestStats = {
  foyers: number;
  personnesListees: number;
  confirmees: number;
  declines: number;
  enAttente: number;
  aInviter: number;
};

/** Le nombre qui part au traiteur : les personnes confirmées, foyer par foyer. */
export function computeGuestStats(guests: GuestLike[]): GuestStats {
  const s: GuestStats = { foyers: guests.length, personnesListees: 0, confirmees: 0, declines: 0, enAttente: 0, aInviter: 0 };
  for (const g of guests) {
    const p = Math.max(0, Math.trunc(g.persons) || 0);
    s.personnesListees += p;
    if (g.status === "confirme") s.confirmees += p;
    else if (g.status === "decline") s.declines += p;
    else if (g.status === "a_inviter") s.aInviter += p;
    else s.enAttente += p;
  }
  return s;
}

export type BudgetItemLike = { estimatedCents: number; actualCents: number | null; settled: boolean };
export type BudgetStats = {
  postes: number;
  estimeCents: number;
  confirmeCents: number;
  regleCents: number;
  resteAReglerCents: number;
  enveloppeCents: number | null;
  ecartEnveloppeCents: number | null;
  depasseEnveloppe: boolean;
};

/** Estimé = ce qui est prévu ; confirmé = devis connus ; réglé = déjà payé (suivi, aucun paiement via AIME®). */
export function computeBudgetStats(items: BudgetItemLike[], envelopeCents: number | null): BudgetStats {
  let estime = 0;
  let confirme = 0;
  let regle = 0;
  for (const i of items) {
    estime += Math.max(0, i.estimatedCents || 0);
    if (i.actualCents !== null && i.actualCents !== undefined) {
      confirme += Math.max(0, i.actualCents);
      if (i.settled) regle += Math.max(0, i.actualCents);
    }
  }
  return {
    postes: items.length,
    estimeCents: estime,
    confirmeCents: confirme,
    regleCents: regle,
    resteAReglerCents: confirme - regle,
    enveloppeCents: envelopeCents,
    ecartEnveloppeCents: envelopeCents === null ? null : envelopeCents - estime,
    depasseEnveloppe: envelopeCents !== null && estime > envelopeCents,
  };
}

export function validateGuestInput(input: { name: string; persons: number; groupe: string; note: string }): { ok: true; name: string; persons: number; groupe: string; note: string } | { ok: false; error: string } {
  const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) return { ok: false, error: "Indiquez le nom de l'invité ou du foyer (2 à 120 caractères)." };
  const persons = Number(input.persons);
  if (!Number.isInteger(persons) || persons < 1 || persons > 20) return { ok: false, error: "Nombre de personnes du foyer : entre 1 et 20." };
  const groupe = GUEST_GROUP_VALUES.includes(input.groupe) ? input.groupe : "famille";
  const note = String(input.note ?? "").trim().slice(0, 200);
  return { ok: true, name, persons, groupe, note };
}

export function validateBudgetItemInput(input: { label: string; category: string; estimatedRaw: string; note: string }): { ok: true; label: string; category: string; estimatedCents: number; note: string } | { ok: false; error: string } {
  const label = String(input.label ?? "").trim().replace(/\s+/g, " ");
  if (label.length < 2 || label.length > 120) return { ok: false, error: "Décrivez le poste (2 à 120 caractères)." };
  const category = BUDGET_CATEGORY_VALUES.includes(input.category) ? input.category : "divers";
  const estimatedCents = parseEuroToCents(input.estimatedRaw);
  if (estimatedCents === null) return { ok: false, error: "Montant estimé illisible : écrivez par exemple 1 200 ou 1 200,50." };
  const note = String(input.note ?? "").trim().slice(0, 200);
  return { ok: true, label, category, estimatedCents, note };
}

export const MAX_TABLES = 40;

/** « 2027-06-19 » → « samedi 19 juin 2027 » ; chaîne vide si la date est illisible. */
export function formatWeddingDate(iso: string): string {
  const d = new Date(`${String(iso ?? "").slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** Date limite de réponse proposée par le rétroplanning : trois semaines avant (jalon J-21). */
export function replyByLabel(iso: string): string {
  const d = new Date(`${String(iso ?? "").slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() - 21);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export type TableLike = { id: number; name: string; capacity: number | null };
export type PlacedGuestLike = GuestLike & { id: number; tableId: number | null };
export type TableStats = {
  parTable: Array<{ tableId: number; foyers: number; personnes: number; capacite: number | null; depasse: boolean }>;
  placeesPersonnes: number;
  aPlacerFoyers: number;
  aPlacerPersonnes: number;
};

/** Seuls les foyers confirmés prennent place ; les autres statuts ne comptent ni comme placés, ni comme à placer. */
export function computeTableStats(tables: TableLike[], guests: PlacedGuestLike[]): TableStats {
  const parTable = tables.map((t) => {
    const placed = guests.filter((g) => g.status === "confirme" && g.tableId === t.id);
    const personnes = placed.reduce((n, g) => n + Math.max(0, Math.trunc(g.persons) || 0), 0);
    return { tableId: t.id, foyers: placed.length, personnes, capacite: t.capacity, depasse: t.capacity !== null && personnes > t.capacity };
  });
  const confirmesNonPlaces = guests.filter((g) => g.status === "confirme" && !tables.some((t) => t.id === g.tableId));
  return {
    parTable,
    placeesPersonnes: parTable.reduce((n, t) => n + t.personnes, 0),
    aPlacerFoyers: confirmesNonPlaces.length,
    aPlacerPersonnes: confirmesNonPlaces.reduce((n, g) => n + Math.max(0, Math.trunc(g.persons) || 0), 0),
  };
}

export function validateTableInput(input: { name: string; capacityRaw: string }): { ok: true; name: string; capacity: number | null } | { ok: false; error: string } {
  const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) return { ok: false, error: "Nom de la table : 2 à 60 caractères (ex. Table d'honneur, Les cousins)." };
  const raw = String(input.capacityRaw ?? "").trim();
  if (raw === "") return { ok: true, name, capacity: null };
  if (!/^\d{1,3}$/.test(raw)) return { ok: false, error: "Capacité : un nombre de places entier, ou rien si elle n'est pas fixée." };
  const capacity = Number(raw);
  if (capacity < 1 || capacity > 200) return { ok: false, error: "Capacité entre 1 et 200 places." };
  return { ok: true, name, capacity };
}

export type CatererGuest = { name: string; persons: number; note: string };

/** Résumé texte à transmettre au traiteur par ses propres moyens : AIME® le prépare, ne l'envoie jamais. */
export function buildCatererSummary(input: { dateIso: string; lieu: string; confirmes: CatererGuest[]; enAttentePersonnes: number; invitesEstimes: number }): string {
  const dateLabel = formatWeddingDate(input.dateIso) || "[date du mariage]";
  const total = input.confirmes.reduce((n, g) => n + Math.max(0, Math.trunc(g.persons) || 0), 0);
  const lines: string[] = [
    `Mariage du ${dateLabel}${input.lieu ? ` — ${input.lieu}` : ""}`,
    `Convives confirmés : ${total} personne(s), ${input.confirmes.length} foyer(s).`,
    "",
    "Détail des foyers confirmés :",
    ...input.confirmes.map((g) => `- ${g.name} : ${g.persons} personne(s)${g.note ? ` (${g.note})` : ""}`),
  ];
  if (input.enAttentePersonnes > 0) lines.push("", `Encore en attente de réponse : ${input.enAttentePersonnes} personne(s). Le nombre définitif partira trois semaines avant le mariage.`);
  if (input.invitesEstimes > 0) lines.push("", `Estimation de départ : environ ${input.invitesEstimes} invités.`);
  lines.push("", "Résumé préparé avec AIME® — à relire avant de l'envoyer à votre prestataire.");
  return lines.join("\n");
}

export const MESSAGE_TEMPLATES = [
  {
    id: "relance-douce",
    title: "Relance douce, avant la date limite",
    body: "Bonjour à toutes et à tous,\n\nPetit mot au sujet de notre mariage, le {date}. Si ce n'est pas déjà fait, pouvez-vous nous dire avant le {dateLimite} si vous serez des nôtres ? Cela nous aide à confirmer le nombre de convives auprès du traiteur et à préparer le plan de table.\n\nSi vous avez des questions (hébergement, trajet, menu), répondez simplement à ce message.\n\nMerci beaucoup, et à très vite !\n[Vos prénoms]",
  },
  {
    id: "relance-courte",
    title: "Relance courte, SMS ou messagerie",
    body: "Bonjour ! Petit rappel pour notre mariage le {date} : pouvez-vous nous confirmer votre présence avant le {dateLimite} ? Merci beaucoup ! [Vos prénoms]",
  },
  {
    id: "derniere-relance",
    title: "Dernière relance, le nombre se fige",
    body: "Bonjour,\n\nNous figeons le nombre de convives pour notre mariage du {date} dans quelques jours. Sans réponse de votre part avant le {dateLimite}, nous devrons malheureusement considérer que vous ne pourrez pas être là. Si vous hésitez encore, dites-le-nous : nous essaierons de garder une possibilité aussi longtemps que possible.\n\nMerci de votre compréhension,\n[Vos prénoms]",
  },
] as const;

export function buildMessage(templateId: string, dateIso: string): string {
  const t = MESSAGE_TEMPLATES.find((m) => m.id === templateId) ?? MESSAGE_TEMPLATES[0];
  return t.body
    .replaceAll("{date}", formatWeddingDate(dateIso) || "[date du mariage]")
    .replaceAll("{dateLimite}", replyByLabel(dateIso) || "[date limite de réponse]");
}

/** Vrai si le jour du mariage est passé (comparaison à midi, sans effet de fuseau). */
export function weddingDayPassed(dateIso: string, now: Date): boolean {
  const d = new Date(`${String(dateIso ?? "").slice(0, 10)}T23:59:59`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < now.getTime();
}

export const THANK_YOU_TEMPLATES = [
  {
    id: "remerciement-general",
    title: "À tous les invités",
    body: "Chères toutes, chers tous,\n\nMerci ! Le {date} restera pour nous une journée inoubliable, et c'est aussi grâce à vous : votre présence, vos sourires et vos attentions nous ont portés du matin au soir.\n\nNous espérons que vous avez passé un aussi beau moment que nous. Les photos arrivent bientôt, nous vous enverrons le lien dès qu'elles seront prêtes.\n\nAvec toute notre gratitude,\n[Vos prénoms]",
  },
  {
    id: "remerciement-aide",
    title: "Aux proches qui ont aidé",
    body: "Bonjour,\n\nNous voulions te/vous remercier tout particulièrement : sans ton/votre aide — avant, pendant et après le {date} — la journée n'aurait pas été la même. Tu as/Vous avez donné du temps, de l'énergie et bien plus, et nous ne l'oublierons pas.\n\nMerci du fond du cœur. La prochaine étape chez nous est en préparation, et tu seras/vous serez des premiers invités !\n\nAvec toute notre reconnaissance,\n[Vos prénoms]",
  },
  {
    id: "remerciement-court",
    title: "Court, SMS ou carte",
    body: "Merci pour le {date} ! Votre présence et vos attentions nous ont comblés. À très vite, [Vos prénoms]",
  },
] as const;

export function buildThankYouMessage(templateId: string, dateIso: string): string {
  const t = THANK_YOU_TEMPLATES.find((m) => m.id === templateId) ?? THANK_YOU_TEMPLATES[0];
  return t.body.replaceAll("{date}", formatWeddingDate(dateIso) || "[date du mariage]");
}

/** La liste de remerciements : les foyers confirmés, à cocher au fil des envois — par les mariés eux-mêmes. */
export function buildThankYouList(confirmes: CatererGuest[]): string {
  const total = confirmes.reduce((n, g) => n + Math.max(0, Math.trunc(g.persons) || 0), 0);
  return [
    `Foyers à remercier : ${confirmes.length} (${total} personne(s) confirmées).`,
    "Cochez chaque foyer dans votre projet au fur et à mesure de vos envois.",
    "",
    ...confirmes.map((g) => `- ${g.name} (${g.persons} personne(s))`),
  ].join("\n");
}
