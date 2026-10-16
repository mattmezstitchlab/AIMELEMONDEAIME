import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { openCircuits } from "./circuits";

const read = (path: string) => readFileSync(path, "utf8");
test("les médias publics existent localement", () => {
  for (const path of ["app/page.tsx", "app/accompagnement/page.tsx", "app/circuits/page.tsx", "app/informations/page.tsx"]) {
    for (const match of read(path).matchAll(/\/images\/[a-z-]+\.(?:jpg|webp)/g)) {
      assert.ok(existsSync(`public${match[0]}`), match[0]);
    }
  }
});
test("les portes d’entrée et les sept circuits restent accessibles", () => {
  const home = read("app/page.tsx");
  for (const href of ["/accompagnement", "/circuits", "/informations", "/le-monde-aime", "/mon-espace", "/le-tour", "/annuaire"]) assert.ok(home.includes(`"${href}"`), href);
  assert.ok(home.includes("openCircuits().map"));
  assert.equal(openCircuits().length, 7);
  assert.ok(home.includes('id="explorer"'));
});
test("le cadre élargi reste public et les médias ont des tailles responsive", () => {
  assert.ok(read("components/public-shell.tsx").includes("max-w-[80rem]"));
  assert.ok(read("components/ui.tsx").includes('wide ? "max-w-[56rem]" : "max-w-[46rem]"'));
  const media = read("components/marketing/immersive.tsx");
  assert.ok(media.includes('sizes="100vw"'));
  assert.ok(media.includes('alt=""'));
  assert.ok(read("components/bottom-tabs.tsx").includes("grid-cols-5"));
});

test("prestataires et invités ont une entrée sur accueil, menu et plan du site", () => {
  for (const href of ["/prestataires", "/invites"]) {
    for (const file of ["app/page.tsx", "components/public-shell.tsx", "app/sitemap.ts"]) assert.ok(read(file).includes(`"${href}"`), `${file}: ${href}`);
    assert.ok(existsSync(`app${href}/page.tsx`));
  }
});
test("l’entrée invités ne publie ni annuaire ni saisie de lien privé", () => {
  const guests = read("app/invites/page.tsx");
  assert.ok(guests.includes("aucun mariage n’est recherché publiquement"));
  assert.ok(!guests.includes("<input"));
  assert.ok(!guests.includes("@/db"));
  assert.ok(read("app/prestataires/page.tsx").includes("AUTH_ENABLED"));
});
