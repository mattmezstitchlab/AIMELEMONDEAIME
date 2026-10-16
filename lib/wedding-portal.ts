/** Données explicitement destinées aux invités, distinctes du programme et des notes privés. */
export type GuestInformation = { published: boolean; venue: string; schedule: string; travel: string; accommodation: string; contact: string };
export const EMPTY_GUEST_INFORMATION: GuestInformation = { published: false, venue: "", schedule: "", travel: "", accommodation: "", contact: "" };
export const GUEST_INFORMATION_FIELDS = [
  ["venue", "Lieux et adresses utiles"], ["schedule", "Horaires destinés aux invités"],
  ["travel", "Accès et déplacements"], ["accommodation", "Hébergement"], ["contact", "Contact utile le jour J"],
] as const;
export function validateGuestInformation(raw: Record<string, unknown>): GuestInformation | null {
  const value = { ...EMPTY_GUEST_INFORMATION, published: raw.published === true };
  for (const [key] of GUEST_INFORMATION_FIELDS) {
    if (typeof raw[key] !== "string" || raw[key].length > 1200) return null;
    value[key] = raw[key].trim();
  }
  return value;
}
export type GuestReplyDetails = { adults: number; children: number; ceremony: boolean; meal: boolean; nextDay: boolean };
export function validateGuestReplyDetails(raw: Record<string, unknown>, persons: number): GuestReplyDetails | null {
  const adults = Number(raw.adults), children = Number(raw.children);
  if (!Number.isInteger(adults) || !Number.isInteger(children) || adults < 0 || children < 0 || adults + children !== persons) return null;
  return { adults, children, ceremony: raw.ceremony === true, meal: raw.meal === true, nextDay: raw.nextDay === true };
}
export function calendarText(title: string, date: string, city: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const day = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date) return null;
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
  const end = new Date(day); end.setUTCDate(day.getUTCDate() + 1);
  let hash = 2166136261;
  for (const char of `${title}|${city}|${date}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AIME//Invitation//FR", "BEGIN:VEVENT", `UID:${(hash >>> 0).toString(16)}-${date.replaceAll("-", "")}@aime-invitation`, `DTSTAMP:${date.replaceAll("-", "")}T000000Z`, `DTSTART;VALUE=DATE:${date.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${end.toISOString().slice(0,10).replaceAll("-", "")}`, `SUMMARY:${escape(title)}`, `LOCATION:${escape(city)}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}
export function buildProviderBrief(raw: { service: string; date: string; city: string; persons: string; budget: string; details: string }): string {
  return [`Demande de prestation : ${raw.service.trim() || "à préciser"}`, `Date : ${raw.date || "à convenir"}`, `Commune : ${raw.city.trim() || "à préciser"}`, `Participants : ${raw.persons || "à préciser"}`, `Budget indicatif : ${raw.budget || "à discuter"}`, raw.details.trim(), "Merci de préciser vos disponibilités, le contenu de votre proposition et vos conditions. Cette demande n’est ni une réservation ni un contrat."].filter(Boolean).join("\n");
}
