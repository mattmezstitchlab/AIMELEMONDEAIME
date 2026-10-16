import { SITUATIONS, ORGANISMS_SEED, RULES_VERSION } from "./situations";

export type MapNode = { id: string; label: string; kind: "situation" | "organisme" | "ressource"; description: string; href: string; audience?: string };
export type MapEdge = { from: string; to: string; kind: "orientation" | "preparation"; label: string; evidence: string[]; version: string };

/** Catalogue exploratoire, pas un moteur d'éligibilité. Les variantes couvrent des
 * exemples de réponses, pas toutes leurs combinaisons ; aucun lien n'est un transfert. */
export function buildLinkMap() {
  const nodes: MapNode[] = SITUATIONS.map((s) => ({ id: `s:${s.key}`, label: s.short, kind: "situation", description: s.description, href: `/accompagnement?besoin=${encodeURIComponent(s.key)}` }));
  nodes.push(...ORGANISMS_SEED.map((o): MapNode => ({ id: `o:${o.slug}`, label: o.name, kind: "organisme", description: o.role, audience: o.audience, href: o.url })));
  nodes.push({ id: "r:guides", label: "Guides et repères", kind: "ressource", description: "Comprendre avant de préparer. Les informations sont à confirmer auprès de l’interlocuteur officiel.", href: "/informations" }, { id: "r:proches", label: "Invités et proches", kind: "ressource", description: "Découvrir les accès limités par invitation. Aucun lien personnel n’est affiché ici.", href: "/invites" }, { id: "r:prestataires", label: "Prestataires", kind: "ressource", description: "Trouver des propositions et préparer une demande. Rien n’est réservé ici.", href: "/prestataires" }, { id: "r:circuits", label: "Circuits locaux", kind: "ressource", description: "Explorer les ressources du territoire, sans lien automatique avec un organisme.", href: "/circuits" });
  const edges: MapEdge[] = [];
  for (const s of SITUATIONS) {
    const defaults = Object.fromEntries(s.questions.map((q) => [q.key, q.options?.[0]?.[0] ?? ""]));
    const samples = [defaults, ...s.questions.flatMap((q) => (q.options ?? []).map(([value]) => ({ ...defaults, [q.key]: value })))];
    const references = new Map<string, Set<string>>();
    for (const sample of samples) for (const task of s.build(sample)) for (const slug of task.organisms ?? []) {
      if (!ORGANISMS_SEED.some((o) => o.slug === slug)) continue;
      if (!references.has(slug)) references.set(slug, new Set());
      references.get(slug)!.add(task.label);
    }
    for (const [slug, evidence] of references) edges.push({ from: `s:${s.key}`, to: `o:${slug}`, kind: "orientation", label: "Peut orienter vers", evidence: [...evidence], version: RULES_VERSION });
    edges.push({ from: `s:${s.key}`, to: "r:guides", kind: "preparation", label: "Comprendre et préparer", evidence: ["Ressource de navigation AIME, pas une obligation administrative."], version: RULES_VERSION });
    if (["mariage", "evenement"].includes(s.key)) for (const id of ["proches", "prestataires", "circuits"]) edges.push({ from: `s:${s.key}`, to: `r:${id}`, kind: "preparation", label: "Peut se préparer avec", evidence: ["Accès aux fonctions et personnes à choisir explicitement dans les parcours."], version: RULES_VERSION });
  }
  return { nodes, edges };
}
export const LINK_MAP = buildLinkMap();
export function mapNeighbours(id: string, kind: "all" | MapEdge["kind"] = "all") {
  return LINK_MAP.edges.filter((e) => (e.from === id || e.to === id) && (kind === "all" || e.kind === kind));
}
