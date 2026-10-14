import { DEPARTEMENTS } from "@/lib/departements";

/*
 * Le point d'une publication, sans carte.
 *
 * Depuis le retrait de la carte interactive, personne ne place plus de repère
 * à la main. Une publication est située par sa commune et son code postal :
 * le code postal donne le département, et le nom de la commune donne un
 * décalage stable à l'intérieur de ce département. Deux publications de la
 * même commune se retrouvent donc au même point, et deux communes voisines
 * ne se superposent pas.
 *
 * C'est volontairement approximatif : le point sert à filtrer par distance et
 * à dire « dans le secteur », jamais à désigner une habitation. Personne n'a
 * besoin de donner son adresse pour publier.
 *
 * Ce module est pur (aucun accès serveur) : il est utilisé par les formulaires
 * côté navigateur comme par les actions serveur, pour que l'aperçu affiché et
 * le point enregistré soient toujours identiques.
 */

export type Point = { lat: number; lng: number };

/** Bornes de la France métropolitaine : identiques à celles du serveur. */
export const POINT_BOUNDS = { latMin: 41, latMax: 51.5, lngMin: -5.5, lngMax: 9.8 };

/** Code postal métropolitain : 5 chiffres, de 01000 à 95999. */
const POSTAL_RE = /^(?:0[1-9]|[1-8]\d|9[0-5])\d{3}$/;

export function isMetropolitanPostal(value: string): boolean {
  return POSTAL_RE.test(value.trim());
}

/** « 28000 » → « 28 ». La Corse (20xxx) est traitée comme un seul ensemble. */
export function departmentFromPostal(value: string): string | null {
  const postal = value.trim();
  if (!isMetropolitanPostal(postal)) return null;
  return postal.slice(0, 2);
}

export function isBoundedPoint(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= POINT_BOUNDS.latMin &&
    lat <= POINT_BOUNDS.latMax &&
    lng >= POINT_BOUNDS.lngMin &&
    lng <= POINT_BOUNDS.lngMax
  );
}

/** Empreinte stable d'un texte : même commune, même décalage, toujours. */
function seed(text: string): number {
  const clean = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]/g, "");
  let hash = 0;
  for (let index = 0; index < clean.length; index += 1) {
    hash = (hash * 31 + clean.charCodeAt(index)) % 1_000_003;
  }
  return hash;
}

/** Département lisible, pour les textes d'interface. */
export function departmentName(value: string): string | null {
  const department = departmentFromPostal(value);
  return department ? DEPARTEMENTS[department]?.nom ?? null : null;
}

/**
 * Point déduit d'une commune et d'un code postal.
 * `null` si le code postal n'est pas métropolitain : l'interface le dit alors
 * clairement au lieu d'enregistrer un point faux.
 */
export function pointFromCommune(commune: string, postalCode: string): Point | null {
  const department = departmentFromPostal(postalCode);
  if (!department) return null;
  const centre = DEPARTEMENTS[department];
  if (!centre) return null;

  const hash = seed(commune.trim() || postalCode.trim());
  // Décalage de ±0,30° au plus : la commune reste dans son département.
  const latOffset = ((hash % 61) - 30) / 100;
  const lngOffset = ((Math.floor(hash / 61) % 61) - 30) / 100;

  const lat = Math.min(POINT_BOUNDS.latMax, Math.max(POINT_BOUNDS.latMin, centre.lat + latOffset));
  const lng = Math.min(POINT_BOUNDS.lngMax, Math.max(POINT_BOUNDS.lngMin, centre.lng + lngOffset));

  return { lat: Number(lat.toFixed(2)), lng: Number(lng.toFixed(2)) };
}

/**
 * Ce que l'on écrit dans la base pour la commune : « Chartres (28000) ».
 * Le code postal reste ainsi attaché à la publication sans changer le schéma.
 */
export function communeLabel(commune: string, postalCode: string): string {
  const name = commune.trim();
  const postal = postalCode.trim();
  if (!isMetropolitanPostal(postal)) return name;
  return `${name} (${postal})`;
}

/** Commune et code postal tels qu'on les relit depuis une valeur enregistrée. */
export function splitCommuneLabel(value: string): { commune: string; postalCode: string } {
  const match = value.match(/^(.*?)\s*\((\d{5})\)\s*$/);
  return match ? { commune: match[1].trim(), postalCode: match[2] } : { commune: value.trim(), postalCode: "" };
}

/** Phrase courte affichée sous les champs, identique partout. */
export function pointSummary(commune: string, postalCode: string): string | null {
  if (!commune.trim()) return null;
  if (!postalCode.trim()) return null;
  const point = pointFromCommune(commune, postalCode);
  if (!point) return "Le code postal doit correspondre à la France métropolitaine (01000 à 95999).";
  const name = departmentName(postalCode);
  return `Point retenu : ${commune.trim()}${name ? ` · ${name}` : ""} — ${point.lat.toFixed(2)}, ${point.lng.toFixed(2)}. Position approximative, jamais une adresse.`;
}
