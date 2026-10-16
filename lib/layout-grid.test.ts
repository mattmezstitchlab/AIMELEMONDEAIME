import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p: string) => readFileSync(p, "utf8");
test("la grille dispose de 4, 8 et 12 colonnes à largeur minimale nulle", () => {
  const css = read("app/globals.css");
  for (const n of [4,8,12]) assert.ok(css.includes(`--layout-columns: ${n}`));
  assert.ok(css.includes('repeat(var(--layout-columns), minmax(0, 1fr))'));
  assert.ok(css.includes('.layout-grid > * { grid-column: 1 / -1; min-width: 0; }'));
});
test("les conteneurs partagent les marges mais conservent les largeurs de lecture", () => {
  const css = read("app/globals.css");
  assert.ok(css.includes('padding-inline: var(--layout-margin)'));
  assert.ok(css.includes('--layout-reading: 46rem'));
  assert.ok(css.includes('--layout-work: 56rem'));
  assert.ok(read("components/public-shell.tsx").includes('layout-container'));
  assert.ok(read("components/ui.tsx").includes('layout-container-reading'));
});
test("les principales rangées utilisent la grille sans imposer de grille aux formulaires", () => {
  const home = read("app/page.tsx");
  for(const name of ['layout-halves','layout-thirds','layout-quarters']) assert.ok(home.includes(name));
  assert.ok(!read("components/community/wedding-rsvp-form.tsx").includes('layout-grid'));
});
