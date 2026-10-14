import { test } from "node:test";
import assert from "node:assert/strict";
import {
  POINT_BOUNDS,
  communeLabel,
  departmentFromPostal,
  departmentName,
  isBoundedPoint,
  isMetropolitanPostal,
  pointFromCommune,
  pointSummary,
  splitCommuneLabel,
} from "./point";

/*
 * Le point d'une publication est déduit de la commune et du code postal.
 * Ces tests fixent les garanties dont dépendent la publication, le filtrage
 * par distance et l'affichage : un point toujours en France métropolitaine,
 * le même point pour la même commune, deux communes différentes séparées.
 */

test("les codes postaux métropolitains sont acceptés, les autres refusés", () => {
  for (const ok of ["01000", "28000", "59000", "95999", "20000"]) {
    assert.equal(isMetropolitanPostal(ok), true, `${ok} doit être accepté`);
  }
  for (const ko of ["", "2800", "280000", "97310", "98000", "abcde", "0a000"]) {
    assert.equal(isMetropolitanPostal(ko), false, `${ko} doit être refusé`);
  }
});

test("le département se lit sur les deux premiers chiffres", () => {
  assert.equal(departmentFromPostal("28000"), "28");
  assert.equal(departmentFromPostal("13001"), "13");
  assert.equal(departmentFromPostal("20000"), "20");
  assert.equal(departmentFromPostal("97310"), null);
  assert.equal(departmentName("28000"), "Eure-et-Loir");
});

test("le point est toujours en France métropolitaine", () => {
  const citys = [
    ["Chartres", "28000"], ["Saint-Brieuc", "22000"], ["Lille", "59000"],
    ["Marseille", "13001"], ["Ajaccio", "20000"], ["Calais", "62100"],
    ["Nice", "06000"], ["Brest", "29200"], ["", "28000"],
  ] as const;
  for (const [commune, postal] of citys) {
    const point = pointFromCommune(commune, postal);
    assert.ok(point, `${commune} ${postal} doit produire un point`);
    assert.equal(isBoundedPoint(point.lat, point.lng), true, `${commune} doit rester dans les bornes`);
    assert.ok(point.lat >= POINT_BOUNDS.latMin && point.lat <= POINT_BOUNDS.latMax);
    assert.ok(point.lng >= POINT_BOUNDS.lngMin && point.lng <= POINT_BOUNDS.lngMax);
  }
});

test("la déduction est stable : même commune, même point", () => {
  const a = pointFromCommune("Chartres", "28000");
  const b = pointFromCommune("Chartres", "28000");
  assert.deepEqual(a, b);
});

test("deux communes voisines ne se superposent pas", () => {
  const chartres = pointFromCommune("Chartres", "28000");
  const dreux = pointFromCommune("Dreux", "28100");
  assert.notDeepEqual(chartres, dreux);
});

test("hors métropole : aucun point, jamais un point faux", () => {
  assert.equal(pointFromCommune("Kourou", "97310"), null);
  assert.equal(pointFromCommune("Saint-Denis", "97400"), null);
  assert.equal(pointFromCommune("Chartres", "2800"), null);
});

test("la commune enregistrée porte son code postal, et se relit", () => {
  const label = communeLabel("Chartres", "28000");
  assert.equal(label, "Chartres (28000)");
  assert.deepEqual(splitCommuneLabel(label), { commune: "Chartres", postalCode: "28000" });
  assert.deepEqual(splitCommuneLabel("Chartres"), { commune: "Chartres", postalCode: "" });
  assert.deepEqual(splitCommuneLabel("Chartres (2800)"), { commune: "Chartres (2800)", postalCode: "" });
});

test("l'aperçu affiché au membre dit ce qui est retenu, ou pourquoi c'est refusé", () => {
  const summary = pointSummary("Lille", "59000");
  assert.ok(summary?.includes("Lille"));
  assert.ok(summary?.includes("Nord"));
  assert.ok(summary?.includes("approximative"));
  assert.equal(pointSummary("Lille", ""), null);
  assert.match(pointSummary("Lille", "97310") ?? "", /France métropolitaine/);
});
