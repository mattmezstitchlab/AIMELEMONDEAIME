import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p: string) => readFileSync(p, "utf8");
test("l’ancrage frontalier ne promet pas une couverture belge opérationnelle", () => {
  const page = read("app/territoire/page.tsx");
  assert.ok(page.includes("France métropolitaine"));
  assert.ok(page.includes("reste à développer"));
  assert.ok(page.includes("ne détermine pas les organismes compétents en Belgique"));
  assert.ok(page.includes("sans affiliation ni partenariat"));
  assert.ok(page.includes("textes de cette page sont originaux"));
});
test("le territoire est relié à l’accueil, au pied de page et au sitemap", () => {
  for (const p of ["app/page.tsx", "components/public-shell.tsx", "app/sitemap.ts"]) assert.ok(read(p).includes('"/territoire"'), p);
});
test("les sources identifiées sont liées sans images prétendument locales", () => {
  const page = read("app/territoire/page.tsx");
  assert.ok(page.includes("https://villamargueriteyourcenar.fr/la-residence-d-ecritures"));
  assert.ok(page.includes("https://www.cleiss.fr/particuliers/frontaliers.html"));
  assert.ok(!page.includes("/images/"));
  assert.ok(read("app/page.tsx").includes("Préparer mon mariage"));
});
