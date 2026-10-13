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
