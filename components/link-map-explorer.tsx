"use client";
import { useState } from "react";
import Link from "next/link";
import { LINK_MAP, mapNeighbours, type MapEdge } from "@/lib/link-map";

export function LinkMapExplorer() {
  const [selected, setSelected] = useState("s:mariage");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | MapEdge["kind"]>("all");
  const [view, setView] = useState<"graph" | "list">("graph");
  const [mode, setMode] = useState("overview");
  const node = LINK_MAP.nodes.find((n) => n.id === selected)!;
  const edges = mapNeighbours(selected, filter);
  const neighbours = edges.map((edge) => ({ edge, node: LINK_MAP.nodes.find((n) => n.id === (edge.from === selected ? edge.to : edge.from))! }));
  const search = LINK_MAP.nodes.filter((n) => `${n.label} ${n.audience ?? ""}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));
  const choose = (id: string) => { setSelected(id); setQuery(""); };
  return <div className="mt-10 space-y-6">
    <div className="flex flex-wrap gap-3" role="group" aria-label="Mode d’exploration">
      <button className="min-h-11 rounded-control px-4 ring-1 ring-line" aria-pressed={mode === "overview"} onClick={() => setMode("overview")}>Vue d’ensemble</button>
      <button className="min-h-11 rounded-control px-4 ring-1 ring-line" aria-pressed={mode === "situation"} onClick={() => setMode("situation")}>Ma situation — choix manuel</button>
    </div>
    <p className="text-sm text-ink-3">{mode === "situation" ? "Choisissez votre moment de vie ci-dessous. Aucun profil n’est déduit, enregistré ou envoyé ; ces repères ne déterminent pas vos droits." : `${LINK_MAP.nodes.filter((n) => n.kind === "situation").length} parcours et ${LINK_MAP.nodes.filter((n) => n.kind === "organisme").length} organismes du catalogue existant. Les liens sont issus d’exemples des règles internes AIME, à confirmer auprès des organismes.`}</p>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-semibold">{mode === "situation" ? "Mon moment de vie" : "Point de départ"}<select value={selected} onChange={(e) => choose(e.target.value)} className="mt-2 min-h-12 w-full min-w-0 rounded-control bg-canvas p-3 ring-1 ring-line">{LINK_MAP.nodes.filter((n) => mode !== "situation" || n.kind === "situation" || n.id === selected).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
      <label className="text-sm font-semibold">Chercher un parcours ou un organisme<input value={query} maxLength={100} onChange={(e) => setQuery(e.target.value)} className="mt-2 min-h-12 w-full rounded-control p-3 ring-1 ring-line" placeholder="Mairie, MSA, famille…" /></label>
    </div>
    {query && <ul className="grid max-h-64 gap-2 overflow-auto rounded-card bg-subtle p-4 sm:grid-cols-2">{search.map((n) => <li key={n.id}><button onClick={() => choose(n.id)} className="min-h-11 w-full rounded-control p-2 text-left text-sm hover:bg-muted">{n.label}</button></li>)}{!search.length && <li className="text-sm">Aucun résultat dans ce catalogue partiel.</li>}</ul>}
    <div className="flex flex-wrap items-center gap-4">
      <label className="text-sm">Liaisons <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="min-h-11 rounded-control bg-canvas px-3 ring-1 ring-line"><option value="all">Toutes</option><option value="orientation">Orientation possible · trait continu</option><option value="preparation">Préparation / participation · pointillés</option></select></label>
      <button className="min-h-11 rounded-control px-4 ring-1 ring-line" onClick={() => setView(view === "graph" ? "list" : "graph")}>{view === "graph" ? "Passer en liste" : "Passer en graphe"}</button>
    </div>
    {view === "graph" && <div className="overflow-x-auto rounded-card bg-subtle p-4 ring-1 ring-line" aria-label="Graphe exploratoire ; liste équivalente ci-dessous">
      <div className="relative" style={{ width: 900, height: Math.max(350, neighbours.length * 78) }}>
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 900 ${Math.max(350, neighbours.length * 78)}`} preserveAspectRatio="none">{neighbours.map(({ node: n, edge }, i) => <line key={n.id} x1="224" y1={Math.max(350, neighbours.length * 78) / 2} x2="644" y2={i * 78 + 35} stroke="currentColor" strokeWidth="1.5" strokeDasharray={edge.kind === "preparation" ? "5 5" : undefined} />)}</svg>
        <div className="absolute left-0 top-1/2 w-56 -translate-y-1/2 rounded-card bg-ink p-5 text-sm font-semibold text-canvas">{node.label}</div>
        <div className="absolute right-0 top-0 w-64 space-y-3">{neighbours.map(({ node: n, edge }) => <button key={n.id} onClick={() => choose(n.id)} className="flex min-h-[66px] w-full flex-col justify-center rounded-card bg-canvas px-4 py-2 text-left ring-1 ring-line"><span className="text-[11px] text-ink-3">{edge.label}</span><span className="text-sm font-semibold">{n.label}</span></button>)}</div>
        {!neighbours.length && <p className="absolute right-0 top-8 w-64 text-sm">Aucune liaison répertoriée avec ce filtre. Cela ne signifie pas qu’aucun lien n’existe.</p>}
      </div>
    </div>}
    <section aria-live="polite" className="rounded-card p-5 ring-1 ring-line sm:p-8">
      <p className="eyebrow">{node.kind} · point sélectionné</p><h2 className="mt-3 text-2xl">{node.label}</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-3">{node.description}</p>
      {node.audience && <p className="mt-3 text-sm">Public indiqué dans le catalogue : {node.audience}. À confirmer selon votre régime et votre situation.</p>}
      {node.href.startsWith("/") ? <Link href={node.href} className="mt-5 inline-flex min-h-11 items-center font-semibold underline">Ouvrir le parcours ou la ressource</Link> : <a href={node.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center font-semibold underline">Consulter le site de référence ↗</a>}
      <h3 className="mt-8 text-lg">Liens expliqués ({neighbours.length})</h3>
      <ul className="mt-4 space-y-4">{neighbours.map(({ node: n, edge }) => <li key={n.id} className="border-t border-line pt-4"><button onClick={() => choose(n.id)} className="min-h-11 text-left font-semibold underline">{n.label}</button><p className="text-xs text-ink-3">{edge.label} · règles internes {edge.version} · à vérifier</p><details className="mt-2"><summary className="cursor-pointer py-2 text-sm">Pourquoi ce lien ?</summary><ul className="list-disc space-y-2 pl-5 text-sm text-ink-3">{edge.evidence.map((text) => <li key={text}>{text}</li>)}</ul><p className="mt-2 text-xs">Exemples conditionnels du parcours, pas des obligations qui vous sont automatiquement applicables. Aucun dossier transmis.</p></details></li>)}</ul>
      {!neighbours.length && <p className="mt-3 text-sm">Aucune liaison répertoriée pour ce filtre. Le catalogue n’est pas exhaustif.</p>}
    </section>
  </div>;
}
