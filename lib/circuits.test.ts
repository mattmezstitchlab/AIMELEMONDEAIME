import assert from "node:assert/strict";
import test from "node:test";
import { ASSOCIATIONS, CIRCUITS, DEFAULT_ORDER_STATUS_LABELS, PRODUCTEURS, circuitFor, circuitForPointKind, openCircuits, plannedCircuits } from "@/lib/circuits";

/*
 * Garde-fous des circuits.
 *
 * Ces tests ne vérifient pas du code, mais la matière qui fait un circuit :
 * ce sont les règles qu'on veut tenir en ajoutant le circuit « associations »
 * ou un autre. Si un texte promet quelque chose d'impossible, ou si un
 * circuit ouvert n'a pas de tableau, on le voit ici et pas en production.
 */

test("chaque circuit a une clé unique, lisible dans une adresse", () => {
  const keys = CIRCUITS.map((circuit) => circuit.key);
  assert.equal(new Set(keys).size, keys.length, "deux circuits partagent la même clé");
  for (const key of keys) {
    assert.match(key, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `clé d'adresse invalide : ${key}`);
  }
});

test("chaque circuit dit ce qu'il promet, ce qu'il garantit et ce qu'il ne fait pas", () => {
  for (const circuit of CIRCUITS) {
    assert.ok(circuit.label.length > 3, `${circuit.key} : libellé trop court`);
    assert.ok(circuit.short.length > 3, `${circuit.key} : nom court manquant`);
    assert.ok(circuit.tagline.length > 20, `${circuit.key} : phrase d'accroche manquante`);
    assert.ok(circuit.intro.length > 40, `${circuit.key} : présentation trop courte`);
    assert.ok(circuit.empty.length > 10, `${circuit.key} : liste vide sans explication`);
    assert.ok(circuit.deposit.label.length > 3, `${circuit.key} : action de dépôt sans nom`);
    assert.ok(circuit.steps.length >= 3, `${circuit.key} : moins de trois étapes`);
    assert.ok(circuit.guarantees.length >= 3, `${circuit.key} : moins de trois garanties`);
    assert.ok(circuit.limits.length >= 2, `${circuit.key} : limites insuffisamment annoncées`);
    for (const step of circuit.steps) {
      assert.ok(step.title.length > 3 && step.text.length > 20, `${circuit.key} : étape incomplète`);
    }
  }
});

test("un circuit ouvert a un tableau ; un circuit prévu dit ce qu'il reste à faire", () => {
  for (const circuit of openCircuits()) {
    assert.ok(circuit.board, `le circuit ouvert « ${circuit.key} » n'a pas de tableau`);
  }
  for (const circuit of plannedCircuits()) {
    assert.equal(circuit.board, null, `le circuit « ${circuit.key} » est prévu : son tableau ne doit pas être annoncé`);
    assert.ok((circuit.pending ?? "").length > 20, `${circuit.key} : il manque ce qu'il reste à écrire`);
  }
  assert.equal(openCircuits().length + plannedCircuits().length, CIRCUITS.length, "un circuit n'est ni ouvert ni prévu");
});

test("deux circuits ne revendiquent pas le même type de fiche", () => {
  const kinds = CIRCUITS.filter((circuit) => circuit.board === "structures").map((circuit) => circuit.pointKind);
  assert.equal(new Set(kinds).size, kinds.length, "deux circuits à fiches partagent le même type enregistré");
  assert.equal(circuitForPointKind("producteur")?.key, "producteurs");
  assert.equal(circuitForPointKind("presence"), undefined, "le circuit des coups de main n'affiche pas de fiches");
  assert.equal(circuitForPointKind("inconnu"), undefined);
});

test("les circuits gardent le vocabulaire du site : plus de carte à remplir", () => {
  for (const circuit of CIRCUITS) {
    const text = JSON.stringify(circuit).toLowerCase();
    assert.ok(!text.includes("carte"), `${circuit.key} : le mot « carte » revient dans les textes`);
    assert.ok(!text.includes("marqueur"), `${circuit.key} : le mot « marqueur » revient dans les textes`);
  }
});

test("aucun circuit ne promet un paiement en ligne", () => {
  for (const circuit of openCircuits()) {
    const promises = [...circuit.guarantees, ...circuit.limits].join(" ").toLowerCase();
    assert.ok(!/paiement en ligne\b(?! )/.test(promises.replace("aucun paiement en ligne", "")), `${circuit.key} : promesse de paiement ambiguë`);
    assert.ok(promises.includes("aucun paiement en ligne"), `${circuit.key} : l'absence de paiement en ligne doit être écrite`);
  }
});

test("chaque circuit ouvert écrit ses mots : rien d'emprunté au circuit voisin", () => {
  for (const circuit of openCircuits()) {
    for (const [field, value] of Object.entries(circuit.words)) {
      if (typeof value === "string") {
        assert.ok(value.trim().length > 0, `${circuit.key} : le mot « ${field} » est vide`);
      }
    }
    assert.ok(circuit.words.boardTitle.endsWith("."), `${circuit.key} : le titre du tableau n'est pas une phrase`);
    if (circuit.board === "structures") {
      assert.ok(circuit.catalogue, `${circuit.key} : un circuit à fiches a besoin des mots de son catalogue`);
      for (const [field, value] of Object.entries(circuit.catalogue)) {
        assert.ok(value.trim().length > 0, `${circuit.key} : le mot de catalogue « ${field} » est vide`);
      }
    } else {
      assert.equal(circuit.catalogue, undefined, `${circuit.key} : ce circuit n'a pas de catalogue à nommer`);
    }
    for (const status of ["commandee", "prete", "recuperee", "annulee"] as const) {
      assert.ok(circuit.words.statusLabels[status].length > 2, `${circuit.key} : statut « ${status} » sans mot`);
    }
  }
  assert.notEqual(
    PRODUCTEURS.words.statusLabels.recuperee,
    ASSOCIATIONS.words.statusLabels.recuperee,
    "chaque circuit nomme ce qui se passe avec ses mots, pas ceux du circuit voisin",
  );
});

test("un circuit ne parle pas avec les mots d'un autre", () => {
  for (const circuit of openCircuits()) {
    if (circuit.key === "producteurs") continue;
    const texte = JSON.stringify({ words: circuit.words, catalogue: circuit.catalogue }).toLowerCase();
    for (const mot of ["producteur", "ferme", "récolte", "retrait"]) {
      assert.ok(!texte.includes(mot), `${circuit.key} : « ${mot} » appartient au circuit des producteurs`);
    }
  }
});

test("un circuit ne promet que ce que le site sait faire", () => {
  const interdits = ["messagerie", "tchat", "créneau", "temps réel", "paiement sécurisé", "remboursement"];
  for (const circuit of CIRCUITS) {
    const promesses = [...circuit.guarantees, ...circuit.limits, ...circuit.steps.map((step) => step.text)]
      .join(" ")
      .toLowerCase();
    for (const mot of interdits) {
      assert.ok(!promesses.includes(mot), `${circuit.key} : « ${mot} » n'existe pas dans le produit`);
    }
  }
});

test("les statuts restent traduits, même par le repli", () => {
  for (const status of ["commandee", "prete", "recuperee", "annulee"] as const) {
    assert.ok(DEFAULT_ORDER_STATUS_LABELS[status], `statut sans libellé : ${status}`);
  }
});

test("circuitFor retrouve un circuit par son adresse, et rien d'autre", () => {
  assert.equal(circuitFor("producteurs")?.label, "Producteurs et produits locaux");
  assert.equal(circuitFor("coups-de-main")?.board, "hands");
  assert.equal(circuitFor("associations")?.status, "ouvert");
  assert.equal(circuitFor("carte"), undefined);
  assert.equal(circuitFor(""), undefined);
});
