import { test } from "node:test";
import assert from "node:assert/strict";
import { LINK_MAP, mapNeighbours } from "./link-map";
import { SITUATIONS, ORGANISMS_SEED } from "./situations";

test("tous les parcours et organismes existants sont consultables", () => {
  assert.equal(LINK_MAP.nodes.filter(n=>n.kind==='situation').length, SITUATIONS.length);
  assert.equal(LINK_MAP.nodes.filter(n=>n.kind==='organisme').length, ORGANISMS_SEED.length);
  assert.equal(new Set(LINK_MAP.nodes.map(n=>n.id)).size,LINK_MAP.nodes.length);
});
test("chaque liaison a deux extrémités, une justification et aucune promesse de transfert", () => {
  const ids=new Set(LINK_MAP.nodes.map(n=>n.id));
  const pairs=new Set<string>();
  for(const e of LINK_MAP.edges){
    assert.ok(ids.has(e.from)&&ids.has(e.to));assert.ok(e.evidence.length);assert.ok(e.version);
    const key=e.from+'|'+e.to;assert.ok(!pairs.has(key));pairs.add(key);
    assert.ok(['orientation','preparation'].includes(e.kind));
  }
});
test("le mariage oriente vers la mairie et les liens sont explorables dans les deux sens", () => {
  assert.ok(mapNeighbours('s:mariage').some(e=>e.to==='o:mairie'));
  assert.ok(mapNeighbours('o:mairie').some(e=>e.from==='s:mariage'));
  assert.ok(mapNeighbours('s:mariage','preparation').every(e=>e.kind==='preparation'));
  assert.equal(mapNeighbours('inconnu').length,0);
});
test("les destinations sont internes ou des sites de référence HTTPS", () => {
  for(const n of LINK_MAP.nodes)assert.ok(n.href.startsWith('/')||n.href.startsWith('https://'));
});
