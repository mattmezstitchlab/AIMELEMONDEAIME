import { test } from "node:test";
import assert from "node:assert/strict";
import { conversationCommand, requestText, navigationChoices, suggestedChoice, GUIDE_FINISHED } from "./assistant/conversation";
import { matchSituation } from "./assistant/orientation";

test("une salutation ne masque pas le besoin", () => {
  const request = requestText("Bonjour, je voudrais organiser mon mariage s'il vous plaît");
  assert.equal(matchSituation(request).matches[0]?.key, "mariage");
  assert.equal(conversationCommand(request), null);
  assert.equal(conversationCommand(requestText("Salut !")), "hello");
});
test("les commandes sont entières et ne valident aucune action métier", () => {
  assert.equal(conversationCommand("oui"), null);
  assert.equal(conversationCommand("c'est fait"), "next");
  assert.equal(conversationCommand("je voudrais revenir sur mon mariage"), null);
  assert.equal(conversationCommand("je suis perdu"), "help");
  assert.equal(conversationCommand("précédent"), "previous");
});
test("la navigation proposée est interne et filtrée par rôle", () => {
  assert.equal(navigationChoices("ouvrir mon profil", "visiteur").length, 0);
  assert.equal(navigationChoices("ouvrir mon profil", "membre")[0]?.href, "/espace/profil");
  assert.equal(navigationChoices("je veux trouver des producteurs", "visiteur")[0]?.href, "/circuits/producteurs");
  assert.equal(navigationChoices("https://evil.example", "visiteur").length, 0);
});
test("la fin du guide ne certifie pas une action", () => {
  assert.match(GUIDE_FINISHED, /pas vérifié/);
});

test("quand les comptes sont fermés, ne pas promettre une inscription", () => {
  assert.equal(navigationChoices("je veux m'inscrire", "visiteur", false)[0]?.href, "/mon-espace");
});

test("une demande longue conserve son intention et les accents sont compris", () => {
  assert.equal(conversationCommand("Je suis bloquée !"), "help");
  assert.equal(conversationCommand("Merci, je voudrais trouver un logement"), null);
  assert.match(requestText("Bonjour, je voudrais organiser notre mariage avec nos proches et trouver des personnes pour nous aider à préparer la fête dans notre commune"), /commune$/);
});

test("chaque circuit public a une destination explicite existante", async () => {
  const { CIRCUITS } = await import("./circuits");
  for (const [query, key] of [
    ["producteurs", "producteurs"], ["coup de main", "coups-de-main"],
    ["association", "associations"], ["artisan", "artisans"],
    ["logement", "logements"], ["trajet", "transports"], ["savoir-faire", "transmission"],
  ]) {
    assert.ok(CIRCUITS.some((c) => c.key === key));
    assert.equal(navigationChoices(query, "visiteur")[0]?.href, `/circuits/${key}`);
  }
  assert.equal(requestText("Salutations"), "Salutations");
});


test("les réponses courtes reprennent les propositions sans confirmer une écriture", () => {
  const chips = navigationChoices("producteurs et artisans", "visiteur");
  assert.equal(suggestedChoice("la deuxième", chips)?.href, "/circuits/artisans");
  assert.equal(suggestedChoice("oui", chips), undefined);
  assert.equal(suggestedChoice("la troisième", chips), undefined);
  assert.equal(suggestedChoice("le premier", [{ label: "oui", kind: "reponse", answerValue: "yes" }]), undefined);
});

test("les nouveaux publics ont une destination de navigation", () => {
  assert.equal(navigationChoices("je suis photographe", "visiteur")[0]?.href, "/prestataires");
  assert.equal(navigationChoices("mon invitation RSVP", "visiteur")[0]?.href, "/invites");
});
