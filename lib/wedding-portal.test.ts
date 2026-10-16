import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateGuestInformation, validateGuestReplyDetails, calendarText, buildProviderBrief, EMPTY_GUEST_INFORMATION } from "./wedding-portal";

test("les informations invités sont privées par défaut et explicitement publiées", () => {
  assert.equal(EMPTY_GUEST_INFORMATION.published, false);
  assert.equal(validateGuestInformation({ ...EMPTY_GUEST_INFORMATION, published: "true" })?.published, false);
  assert.equal(validateGuestInformation({ ...EMPTY_GUEST_INFORMATION, venue: " Mairie ", published: true })?.venue, "Mairie");
  assert.equal(validateGuestInformation({ ...EMPTY_GUEST_INFORMATION, schedule: "a".repeat(1201) }), null);
  const source = readFileSync("lib/wedding-access.ts", "utf8");
  assert.ok(source.includes("settings?.information?.published ? settings.information : null"));
});
test("les réponses détaillées vérifient les totaux adultes et enfants", () => {
  assert.deepEqual(validateGuestReplyDetails({ adults: "2", children: "1", ceremony: true }, 3), { adults: 2, children: 1, ceremony: true, meal: false, nextDay: false });
  for (const raw of [{ adults: -1, children: 3 }, { adults: 1.5, children: .5 }, { adults: 2, children: 2 }, { adults: "non", children: 2 }]) assert.equal(validateGuestReplyDetails(raw, 2), null);
});
test("le calendrier reste local et n'inclut aucun jeton ni donnée des autres invités", () => {
  assert.equal(calendarText("Mariage", "2027-02-30", "Lille"), null);
  const calendar = calendarText("Mariage\nBEGIN:VEVENT", "2027-12-31", "Lille, France")!;
  assert.ok(calendar.includes("DTEND;VALUE=DATE:20280101"));
  assert.ok(calendar.includes("SUMMARY:Mariage\\nBEGIN:VEVENT"));
  assert.ok(calendar.includes("LOCATION:Lille\\, France"));
  assert.ok(!calendar.includes("token"));
});
test("la demande prestataire reste un brouillon sans promesse de réservation", () => {
  const text = buildProviderBrief({ service: "photo", date: "2027-06-12", city: "Lille", persons: "40", budget: "à convenir", details: "Cérémonie uniquement" });
  assert.match(text, /photo/); assert.match(text, /Cérémonie uniquement/); assert.match(text, /ni une réservation ni un contrat/);
});
test("les écritures invitées restent bornées au jeton et le partage aux organisateurs", () => {
  const rsvp = readFileSync("lib/actions/wedding-access.ts", "utf8");
  assert.ok(rsvp.includes("eq(weddingGuests.rsvpTokenHash, tokenHash)"));
  assert.ok(rsvp.includes("validateGuestReplyDetails"));
  const actions = readFileSync("lib/actions/wedding.ts", "utf8");
  const save = actions.slice(actions.indexOf("export async function saveGuestInformation"));
  assert.ok(save.includes('requireRole(["membre"])')); assert.ok(save.includes("editableProject(projectId, user.id)"));
});

test("deux événements différents ont des identifiants calendrier distincts", () => {
  const a = calendarText("Mariage A", "2027-06-12", "Lille")!;
  const b = calendarText("Mariage B", "2027-06-12", "Lille")!;
  assert.notEqual(a.match(/UID:.+/)?.[0], b.match(/UID:.+/)?.[0]);
  assert.ok(calendarText("Mariage\rATTENDEE:test", "2027-06-12", "Lille")!.includes("SUMMARY:Mariage\\nATTENDEE:test"));
});
