"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FranceMap, type MapPin, type MapPinKind } from "@/components/carte/france-map";
import { Icon } from "@/components/icon";
import {
  AgencyCard, LegacyPointCard, ListingCard, MyExchanges, TripCard, clusterPins, dateText, distanceKm, normalizeText, priceLabel,
  type Agency, type CommunityData, type Listing, type ServicePin, type Trip,
} from "@/components/community/community-app";
import { PublishListingForm, SavedSearchForm, TripForm } from "@/components/community/forms";
import { ProjectForm, ReportContent } from "@/components/community/project-panels";
import { CreateCircleForm, InviteResponses } from "@/components/community/circle-panels";
import { UNIVERSES, UNIVERSE_LABEL, defaultUniverses } from "@/lib/lma";

export type Person = { id: number; name: string; bio: string | null; activities: string[]; universes: string[]; offersText: string | null; needsText: string | null; transmitText: string | null; travelRadiusKm: number; availabilityNote: string | null; city: string | null; lat: number; lng: number; isDemo: boolean; hasPhoto: boolean };
export type ProjectPin = { id: number; title: string; intention: string; city: string; lat: number; lng: number; startsAt: Date | string; endsAt: Date | string | null; universes: string[]; isDemo: boolean; organizerName: string; participants: number; needsTotal: number; needsConfirmed: number };
export type Story = { id: number; title: string; body: string; kind: string; createdAt: Date | string; isDemo: boolean; hasPhoto: boolean; authorName: string };
export type LinkProject = { id: number; title: string; city: string; startsAt: Date | string; status: string; role: string; memberStatus: string; isDemo: boolean; pendingRequests: number };
export type LinkCircle = { id: number; name: string; kind: string; description: string; role: string; status: string; isDemo: boolean };
export type Links = { projects: LinkProject[]; circles: LinkCircle[]; invites: LinkCircle[]; hasArtist: boolean };

export type LmaData = {
  listings: Listing[]; trips: Trip[]; servicePins: ServicePin[]; agencies: Agency[];
  people: Person[]; projects: ProjectPin[]; stories: Story[];
  mine: CommunityData["mine"]; links: Links | null; user: { id: number; role: string } | null;
};

/* Légende Bauhaus, alignée sur les marqueurs de la carte. */
const LEGEND: Array<[string, string]> = [
  ["bg-violet-600", "Personnes"],
  ["bg-orange-600", "Offres"],
  ["bg-blue-600", "Besoins"],
  ["bg-slate-400", "Lieux"],
  ["bg-yellow-400", "Projets"],
  ["bg-pink-500", "Trajets"],
  ["bg-slate-600", "Structures externes"],
];

type Tab = "explorer" | "publier" | "liens";
type ItemType = "offre" | "besoin" | "projet" | "personne" | "trajet" | "service";
type Item = {
  key: string; kind: MapPinKind; type: ItemType; universes: string[]; lat: number; lng: number; city: string; name: string; subtitle: string; badge?: string;
  free: boolean; from: Date | null; to: Date | null; text: string; render: (highlighted: boolean) => ReactNode;
};

const TYPE_OPTIONS: Array<[string, string]> = [["tout", "Toutes les publications"], ["offre", "Propositions"], ["besoin", "Besoins"], ["projet", "Projets"], ["personne", "Personnes"], ["trajet", "Trajets"]];
const toDate = (v: Date | string | null) => (v ? new Date(v) : null);

function PersonCard({ p, highlighted }: { p: Person; highlighted: boolean }) {
  return (
    <article className={`rounded-2xl border bg-white p-4 ${highlighted ? "border-emerald-700 ring-2 ring-emerald-100" : "border-black/[0.06] shadow-sm"}`}>
      <div className="flex gap-3">
        {p.hasPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- photo d'API dynamique, dimensions inconnues */}
            <img src={`/api/profil/${p.id}/photo`} alt="" className="h-14 w-14 rounded-full object-cover" loading="lazy" />
          </>
        ) : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-violet-100 text-lg font-bold text-violet-900" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>}
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-800">Personne{p.isDemo ? " · profil fictif" : ""}</span>
          <h3 className="mt-1 text-base font-bold text-slate-900">{p.name}</h3>
          <p className="text-xs text-slate-500">{p.city ?? "France"} · zone d&apos;environ {p.travelRadiusKm} km · position approximative</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">{p.activities.slice(0, 5).map((a) => <span key={a} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{a}</span>)}</div>
      {p.bio && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.bio}</p>}
      <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
        {p.offersText && <li><strong>Propose :</strong> {p.offersText}</li>}
        {p.needsText && <li><strong>Recherche :</strong> {p.needsText}</li>}
        {p.transmitText && <li><strong>Transmet :</strong> {p.transmitText}</li>}
        {p.availabilityNote && <li><strong>Disponible :</strong> {p.availabilityNote}</li>}
      </ul>
      <Link href={`/le-monde-aime/personnes/${p.id}`} className="mt-3 inline-block rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-900">Voir la fiche</Link>
    </article>
  );
}

function ProjectCard({ p, highlighted }: { p: ProjectPin; highlighted: boolean }) {
  return (
    <article className={`rounded-2xl border bg-white p-4 ${highlighted ? "border-emerald-700 ring-2 ring-emerald-100" : "border-black/[0.06] shadow-sm"}`}>
      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800">Projet{p.isDemo ? " · exemple fictif" : ""}</span>
      <h3 className="mt-2 text-base font-bold text-slate-900">{p.title}</h3>
      <p className="mt-1 line-clamp-3 text-sm text-slate-600">{p.intention}</p>
      <p className="mt-2 text-xs text-slate-500"><Icon name="pin" className="mr-1 inline h-3.5 w-3.5" />{p.city} · position approximative · {dateText(p.startsAt)}</p>
      <p className="text-xs text-slate-500">Organisé par {p.organizerName} · {p.participants} participant(s) · {p.needsConfirmed}/{p.needsTotal} besoin(s) confirmé(s)</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{p.universes.map((u) => <span key={u} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{UNIVERSE_LABEL[u]}</span>)}</div>
      <Link href={`/le-monde-aime/projets/${p.id}`} className="mt-3 inline-block rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-900">Voir le projet</Link>
    </article>
  );
}

export function CommunityApp({ data }: { data: LmaData }) {
  const router = useRouter();
  const params = useSearchParams();
  const onglet = params.get("onglet");
  const tab: Tab = onglet === "publier" ? "publier" : onglet === "liens" ? "liens" : "explorer";
  const user = data.user;
  const isMember = user?.role === "membre";
  const mine = data.mine;

  const [universe, setUniverse] = useState(params.get("univers") ?? "tout");
  const [type, setType] = useState("tout");
  const [freeOnly, setFreeOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState(params.get("q") ?? "");
  const [radius, setRadius] = useState(40);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [clusterSelection, setClusterSelection] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Synchronisation URL → filtres : ajustement d'état pendant le rendu
  // (patron recommandé par React plutôt qu'un setState dans un effet).
  const paramsKey = params.toString();
  const [syncedParamsKey, setSyncedParamsKey] = useState(paramsKey);
  if (paramsKey !== syncedParamsKey) {
    setSyncedParamsKey(paramsKey);
    const u = params.get("univers");
    if (u) setUniverse(u);
    const q = params.get("q");
    if (q !== null) setKeyword(q);
  }

  const [pubType, setPubType] = useState<"proposition" | "besoin" | "projet">("proposition");
  const [pubSub, setPubSub] = useState<"annonce" | "trajet">("annonce");
  const [pubCoords, setPubCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tripEnd, setTripEnd] = useState<{ lat: number; lng: number } | null>(null);
  const [pickEnd, setPickEnd] = useState(false);
  const [lienTab, setLienTab] = useState<"echanges" | "projets" | "cercles">("echanges");

  const goTab = (key: Tab) => router.push(key === "explorer" ? "/le-monde-aime" : `/le-monde-aime?onglet=${key}`, { scroll: false });
  const requests = useMemo(() => mine?.requests ?? [], [mine]);

  // ---- Éléments de la carte : personnes, offres, besoins, lieux, projets, trajets, services externes
  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const l of data.listings) {
      const isNeed = l.publicationType === "besoin";
      out.push({
        key: `listing:${l.id}`, kind: isNeed ? "besoin" : l.category === "lieux_espaces" ? "lieu" : "offre", type: isNeed ? "besoin" : "offre",
        universes: l.universes.length ? l.universes : defaultUniverses(l.category), lat: l.lat, lng: l.lng, city: l.city, name: l.title, subtitle: `${l.city} · ${l.ownerName}`,
        badge: priceLabel(l) || undefined, free: priceLabel(l) === "Gratuit", from: toDate(l.availableFrom), to: toDate(l.availableUntil),
        text: `${l.title} ${l.description} ${Object.values(l.attributes).join(" ")} ${l.city} ${l.ownerName}`,
        render: (h) => <ListingCard item={l} userId={user?.id ?? null} canRequest={isMember} highlighted={h} />,
      });
    }
    for (const t of data.trips) {
      out.push({
        key: `trip:${t.id}`, kind: "disponible", type: "trajet", universes: ["terre"], lat: t.startLat, lng: t.startLng, city: t.startCity, name: `${t.startCity} → ${t.endCity}`,
        subtitle: dateText(t.departureAt), badge: t.transportMode, free: !t.compensation || Number(t.compensation) <= 0, from: toDate(t.departureAt), to: toDate(t.departureAt),
        text: `${t.startCity} ${t.endCity} trajet livraison ${t.transportMode} ${t.terms}`,
        render: () => <TripCard trip={t} userId={user?.id ?? null} canRequest={isMember} linkedRequests={requests} />,
      });
    }
    for (const p of data.servicePins) {
      out.push({
        key: `legacy:${p.id}`, kind: "producteur", type: "offre", universes: ["terre"], lat: p.lat, lng: p.lng, city: p.city, name: p.name, subtitle: p.city, badge: "Producteur",
        free: false, from: null, to: null, text: `${p.name} ${p.city} producteur ferme produits locaux`, render: () => <LegacyPointCard point={p} />,
      });
    }
    for (const p of data.people) {
      out.push({
        key: `person:${p.id}`, kind: "personne", type: "personne", universes: p.universes, lat: p.lat, lng: p.lng, city: p.city ?? "", name: p.name, subtitle: p.activities.slice(0, 2).join(", "),
        badge: "Personne", free: false, from: null, to: null,
        text: `${p.name} ${p.bio ?? ""} ${p.activities.join(" ")} ${p.offersText ?? ""} ${p.needsText ?? ""} ${p.transmitText ?? ""} ${p.city ?? ""}`,
        render: (h) => <PersonCard p={p} highlighted={h} />,
      });
    }
    for (const p of data.projects) {
      out.push({
        key: `project:${p.id}`, kind: "projet", type: "projet", universes: p.universes, lat: p.lat, lng: p.lng, city: p.city, name: p.title, subtitle: `${p.city} · ${dateText(p.startsAt)}`, badge: "Projet",
        free: false, from: toDate(p.startsAt), to: toDate(p.endsAt) ?? toDate(p.startsAt), text: `${p.title} ${p.intention} ${p.city} ${p.organizerName}`,
        render: (h) => <ProjectCard p={p} highlighted={h} />,
      });
    }
    for (const a of data.agencies) {
      if (a.lat === null || a.lng === null) continue;
      out.push({
        key: `agency:${a.id}`, kind: "agence", type: "service", universes: [], lat: a.lat, lng: a.lng, city: a.city, name: a.name, subtitle: `${a.city} · structure externe`, badge: "Externe",
        free: false, from: null, to: null, text: `${a.name} ${a.city} ${a.postalCode} ${a.region} service accompagnement msa`, render: () => <AgencyCard agency={a} />,
      });
    }
    return out;
  }, [data, isMember, requests, user?.id]);

  const cityOrigin = useMemo(() => {
    const term = normalizeText(city.trim());
    if (!term) return null;
    const hit = items.find((i) => normalizeText(i.city) === term);
    return hit ? { lat: hit.lat, lng: hit.lng } : null;
  }, [city, items]);
  const origin = cityOrigin ?? center;

  const filtered = useMemo(() => {
    const term = normalizeText(city.trim());
    const kw = normalizeText(keyword.trim());
    const day = dateFilter ? new Date(`${dateFilter}T00:00:00`) : null;
    const dayEnd = dateFilter ? new Date(`${dateFilter}T23:59:59`) : null;
    return items.filter((i) => {
      if (universe === "services") { if (i.type !== "service") return false; }
      else if (universe !== "tout") { if (!i.universes.includes(universe)) return false; }
      if (type !== "tout" && i.type !== type) return false;
      if (freeOnly && !i.free) return false;
      if (day && dayEnd) { if ((i.from && i.from > dayEnd) || (i.to && i.to < day)) return false; }
      if (kw && !normalizeText(i.text).includes(kw)) return false;
      if (term) { if (cityOrigin) { if (distanceKm(cityOrigin, i) > radius) return false; } else if (!normalizeText(`${i.city} ${i.name}`).includes(term)) return false; }
      else if (center && distanceKm(center, i) > radius) return false;
      return true;
    });
  }, [items, universe, type, freeOnly, dateFilter, keyword, city, cityOrigin, center, radius]);

  const rawPins = useMemo<MapPin[]>(() => filtered.map((i) => ({ id: i.key, kind: i.kind, name: i.name, subtitle: i.subtitle, lat: i.lat, lng: i.lng, badge: i.badge })), [filtered]);
  const pins = useMemo(() => clusterPins(rawPins), [rawPins]);
  const clusterItems = clusterSelection.length ? items.filter((i) => clusterSelection.includes(i.key)) : [];

  function locate(apply: (c: { lat: number; lng: number }) => void) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => apply({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => window.alert("La géolocalisation n'a pas été autorisée. Vous pouvez saisir une commune ou toucher la carte."), { timeout: 8000 });
  }
  function selectPin(pin: MapPin) {
    if (pin.id.startsWith("cluster:")) {
      const key = pin.id.slice(8);
      setSelection(null);
      setClusterSelection(rawPins.filter((p) => `${Math.floor(p.lat / 0.58)}:${Math.floor(p.lng / 0.58)}` === key).map((p) => p.id));
      return;
    }
    setClusterSelection([]);
    setSelection((current) => (current === pin.id ? null : pin.id));
  }
  const selectedItem = selection ? items.find((i) => i.key === selection) ?? null : null;
  const hasFilters = Boolean(center || city || keyword || dateFilter || freeOnly || type !== "tout" || universe !== "tout");
  function resetFilters() { setCenter(null); setCity(""); setKeyword(""); setDateFilter(""); setFreeOnly(false); setType("tout"); setUniverse("tout"); setClusterSelection([]); setSelection(null); }

  const selectCls = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
  const publishPins = useMemo<MapPin[]>(() => [pubCoords && { id: "me", kind: "offre" as const, name: "Départ / lieu", subtitle: "", lat: pubCoords.lat, lng: pubCoords.lng }, tripEnd && pubSub === "trajet" && { id: "end", kind: "lieu" as const, name: "Destination", subtitle: "", lat: tripEnd.lat, lng: tripEnd.lng }].filter(Boolean) as MapPin[], [pubCoords, tripEnd, pubSub]);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 sm:pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Le Monde Aime · carte</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">Tout ce qui compte près de vous, sur une seule carte.</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">Personnes, productions locales, artistes, besoins, lieux et projets. Initiative indépendante : aucun paiement en ligne, aucune réservation sans accord explicite.</p>
          </div>
          <nav aria-label="Sections Le Monde Aime" className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
            {([["explorer", "Explorer", "search"], ["publier", "Publier", "filePlus"], ["liens", "Mes liens", "heart"]] as const).map(([key, text, icon]) => (
              <button key={key} type="button" onClick={() => goTab(key)} aria-current={tab === key ? "page" : undefined} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${tab === key ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}><Icon name={icon} className="h-4 w-4" />{text}</button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pt-5 sm:px-6">
        {tab === "explorer" && (
          <>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Univers" data-assistant-id="lma-filters">
              {[{ key: "tout", label: "Tout" }, ...UNIVERSES.map((u) => ({ key: u.key as string, label: u.label })), { key: "services", label: "Structures externes" }].map((u) => (
                <button key={u.key} type="button" aria-pressed={universe === u.key} onClick={() => { setUniverse(u.key); setClusterSelection([]); setSelection(null); }} className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition ${universe === u.key ? "border-emerald-800 bg-emerald-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-500"}`}>{u.label}</button>
              ))}
            </div>

            {/* Carte en total fond d'écran : filtres en panneau latéral, fiche en surcouche. */}
            <section data-assistant-id="lma-map" aria-labelledby="lma-map-title" className="relative overflow-hidden bg-[#F6F1E8]">
              <h2 id="lma-map-title" className="sr-only">Carte des personnes, offres, besoins, lieux, projets et trajets</h2>

              <div className="relative h-[calc(100dvh-215px)] min-h-[460px] w-full lg:h-[calc(100dvh-160px)]">
                <FranceMap fill pins={pins} selectedId={selection} onSelect={selectPin} onPickLocation={(c) => { setCenter(c); setCity(""); setFiltersOpen(false); }} />

                {/* Bouton filtres (mobile uniquement) */}
                <div className="absolute left-3 top-3 z-30 lg:hidden">
                  <button type="button" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} aria-controls="lma-filters-panel"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl">
                    <Icon name="filter" className="h-4 w-4" />
                    Filtrer{hasFilters && <span className="grid h-5 w-5 place-items-center rounded-full bg-orange-500 text-[11px] font-bold text-white" aria-hidden="true">•</span>}
                  </button>
                </div>

                {/* Panneau filtres : latéral en continu sur desktop, tiroir sur mobile */}
                <div id="lma-filters-panel" className={`${filtersOpen ? "block" : "hidden"} absolute inset-x-3 top-16 z-20 max-h-[55dvh] overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-2xl ring-1 ring-black/[0.08] backdrop-blur lg:block lg:inset-x-auto lg:left-5 lg:top-5 lg:max-h-[calc(100%-2.5rem)] lg:w-[330px]`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Filtres</p>
                    <button type="button" onClick={() => setFiltersOpen(false)} className="text-sm font-bold text-slate-500 lg:hidden">Voir la carte</button>
                  </div>
                  <form role="search" onSubmit={(e) => e.preventDefault()} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600" htmlFor="f-kw">Que cherchez-vous ?</label>
                      <input id="f-kw" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="légumes, concert, couture…" className={selectCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-xs font-semibold text-slate-600" htmlFor="f-city">Commune</label><input id="f-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chartres" className={selectCls} /></div>
                      <div><label className="block text-xs font-semibold text-slate-600" htmlFor="f-type">Publication</label><select id="f-type" value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>{TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-2 items-end gap-2">
                      <div><label className="block text-xs font-semibold text-slate-600" htmlFor="f-date">Date</label><input id="f-date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={selectCls} /></div>
                      <label className="flex items-center gap-2 pb-2.5 text-sm font-semibold text-slate-700"><input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className="h-4 w-4 accent-orange-600" />Gratuit</label>
                    </div>
                    <div>
                      <label htmlFor="f-radius" className="flex justify-between text-xs font-semibold text-slate-600"><span>{origin ? "Rayon autour du point" : "Rayon (commune ou carte)"}</span><span>{radius} km</span></label>
                      <input id="f-radius" type="range" min={5} max={200} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="mt-2 w-full accent-orange-600" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button type="button" onClick={() => locate(setCenter)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Me localiser</button>
                      {hasFilters && <button type="button" onClick={resetFilters} className="text-xs font-bold text-emerald-700 underline">Réinitialiser</button>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-slate-200 pt-3 text-[11px] text-slate-600" aria-label="Légende">
                      {LEGEND.map(([c, t]) => <span key={t} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c}`} aria-hidden="true" />{t}</span>)}
                    </div>
                  </form>
                </div>

                {/* Fiche de détail en surcouche */}
                {(selectedItem || clusterItems.length > 0) && (
                  <aside data-assistant-id="lma-detail" aria-label={selectedItem ? "Détail de la sélection" : "Éléments du secteur sélectionné"} className="absolute inset-x-3 bottom-3 z-20 max-h-[52dvh] overflow-y-auto rounded-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl ring-1 ring-black/[0.08] lg:inset-x-auto lg:bottom-5 lg:right-5 lg:top-5 lg:z-30 lg:max-h-none lg:w-[360px] lg:pb-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {selectedItem ? selectedItem.subtitle : `${clusterItems.length} élément(s) dans ce secteur`}
                      </p>
                      <button type="button" onClick={() => { setSelection(null); setClusterSelection([]); }} className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-100">Fermer ✕</button>
                    </div>
                    {selectedItem ? selectedItem.render(true) : (
                      <ul className="space-y-2">
                        {clusterItems.map((i) => (
                          <li key={i.key}>
                            <button type="button" onClick={() => { setClusterSelection([]); setSelection(i.key); }} className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left transition hover:bg-orange-50">
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-bold text-slate-900">{i.name}</span>
                                <span className="block truncate text-xs text-slate-500">{i.subtitle}</span>
                              </span>
                              <span className="shrink-0 text-xs font-bold text-emerald-700">Voir →</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </aside>
                )}
              </div>
            </section>
            <div className="bg-[#F6F1E8] pb-4">
              <p className="px-4 text-center text-[11px] text-slate-600 lg:px-5">
                {filtered.length} résultat(s) · touchez la carte pour fixer le centre · les marqueurs proches se regroupent au dézoom
              </p>
            </div>
            <details className="border-t border-slate-200 bg-white px-4 py-3 text-sm sm:px-6">
              <summary className="min-h-10 cursor-pointer font-semibold text-slate-800">Explorer les {filtered.length} résultats sans utiliser la carte</summary>
              <p className="mt-2 text-xs text-slate-600">Alternative accessible : choisissez un résultat pour ouvrir sa fiche sur la même carte.</p>
              <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                {filtered.map((item) => (
                  <li key={item.key}>
                    <button type="button" onClick={() => { setClusterSelection([]); setSelection(item.key); document.getElementById("lma-map-title")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50">
                      <span className="min-w-0"><span className="block truncate font-semibold text-slate-900">{item.name}</span><span className="block truncate text-xs text-slate-600">{item.subtitle}</span></span>
                      <span className="shrink-0 text-xs font-semibold text-slate-700">Voir la fiche →</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}

        {tab === "publier" && (
          <section className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-8">
              <h1 className="text-3xl font-bold text-slate-900">Que souhaitez-vous publier ?</h1>
              <p className="mt-2 text-sm text-slate-600">Votre position publique reste approximative. L&apos;adresse précise n&apos;est partagée qu&apos;avec les personnes concernées, après accord.</p>
              {!user ? <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Connectez-vous pour publier. <Link href="/connexion" className="font-bold underline">Se connecter</Link> · <Link href="/inscription" className="font-bold underline">Créer un compte</Link></div>
              : !isMember ? <div className="mt-6 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">La publication est réservée aux comptes membres.</div> : (
                <>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3" role="group" aria-label="Type de publication">
                    {([["proposition", "Une proposition", "Je donne, je prête, je loue, je vends, je propose une prestation, je transmets."], ["besoin", "Un besoin", "Je cherche une sono, je voudrais apprendre à coudre…"], ["projet", "Un projet", "Organisons une fête, créons un jardin partagé…"]] as const).map(([k, t, d]) => (
                      <button key={k} type="button" onClick={() => setPubType(k)} aria-pressed={pubType === k} className={`rounded-2xl border p-4 text-left ${pubType === k ? "border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700" : "border-slate-200 hover:border-slate-400"}`}><span className="block text-base font-bold text-slate-900">{t}</span><span className="mt-1 block text-xs text-slate-600">{d}</span></button>
                    ))}
                  </div>
                  {pubType === "proposition" && (
                    <div className="mt-4 flex gap-2"><button type="button" onClick={() => setPubSub("annonce")} className={`rounded-full px-4 py-2 text-sm font-bold ${pubSub === "annonce" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-700"}`}>Objet, produit, service ou savoir</button><button type="button" onClick={() => setPubSub("trajet")} className={`rounded-full px-4 py-2 text-sm font-bold ${pubSub === "trajet" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-700"}`}>Un trajet</button></div>
                  )}
                  <div className="mt-6 rounded-xl bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-800">{pubSub === "trajet" && pubType === "proposition" ? "Départ puis destination" : "Où ? Touchez la carte à hauteur de la commune"}</p><button type="button" onClick={() => locate(setPubCoords)} className="text-xs font-semibold text-emerald-800 underline">Me localiser (facultatif)</button></div>
                    <p className="mt-1 text-xs text-slate-500">{pubCoords ? `Point retenu : ${pubCoords.lat.toFixed(2)}, ${pubCoords.lng.toFixed(2)} (approximatif)` : "Aucun point choisi."}</p>
                    <div className="mx-auto mt-3 max-w-md"><FranceMap pins={publishPins} selectedId={null} onSelect={() => {}} onPickLocation={(c) => { if (pubType === "proposition" && pubSub === "trajet" && pickEnd) setTripEnd(c); else setPubCoords(c); }} canPlacePin /></div>
                  </div>
                  <div className="mt-6" data-assistant-id={pubType === "projet" ? "lma-project-form" : pubSub === "trajet" && pubType === "proposition" ? "lma-trip-form" : "lma-listing-form"}>
                    {pubType === "projet" ? <ProjectForm coords={pubCoords} />
                      : pubType === "proposition" && pubSub === "trajet" ? <TripForm coords={pubCoords} destination={tripEnd} pickDestination={pickEnd} onPickDestination={setPickEnd} onCreated={() => setTimeout(() => goTab("liens"), 1200)} />
                      : <PublishListingForm key={pubType} type={pubType} coords={pubCoords} onPublished={() => setTimeout(() => goTab("liens"), 1200)} />}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {tab === "liens" && (
          <section className="space-y-6">
            <div><h1 className="text-3xl font-bold text-slate-900">Mes liens</h1><p className="mt-1 text-sm text-slate-600">Vos échanges, vos projets et vos cercles, au même endroit.</p></div>
            {!user ? <div className="rounded-2xl bg-white p-8 text-center"><p className="text-slate-700">Connectez-vous pour retrouver vos liens.</p><Link href="/connexion" className="mt-3 inline-block font-bold text-emerald-800 underline">Se connecter</Link></div>
            : !isMember ? <div className="rounded-2xl bg-white p-8 text-center text-slate-700">Cet espace est réservé aux comptes membres.</div> : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Link href="/le-monde-aime/profil" className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm hover:border-emerald-400"><Icon name="user" className="h-6 w-6 text-emerald-700" /><strong className="mt-2 block text-slate-900">Mon profil</strong><span className="text-xs text-slate-600">Activités, ce que je propose, recherche ou transmets, zone et disponibilités.</span></Link>
                  <Link href="/le-monde-aime/artiste" className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm hover:border-emerald-400"><Icon name="music" className="h-6 w-6 text-emerald-700" /><strong className="mt-2 block text-slate-900">Espace artiste</strong><span className="text-xs text-slate-600">{data.links?.hasArtist ? "Prestations, demandes reçues, fiche technique." : "Disciplines, prestations et fiche technique."}</span></Link>
                  <Link href="/espace" className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm hover:border-emerald-400"><Icon name="building" className="h-6 w-6 text-emerald-700" /><strong className="mt-2 block text-slate-900">Services externes (démo)</strong><span className="text-xs text-slate-600">Simulation de démarches avec un organisme d&apos;accompagnement.</span></Link>
                </div>
                {data.links && data.links.invites.length > 0 && <InviteResponses invites={data.links.invites.map((i) => ({ id: i.id, name: i.name, kind: i.kind }))} />}
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mes liens">
                  {([["echanges", `Échanges${requests.filter((r) => !["terminee", "annulee", "refusee"].includes(r.status)).length ? ` (${requests.filter((r) => !["terminee", "annulee", "refusee"].includes(r.status)).length})` : ""}`], ["projets", `Projets (${data.links?.projects.length ?? 0})`], ["cercles", `Cercles privés (${data.links?.circles.length ?? 0})`]] as const).map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={lienTab === k} onClick={() => setLienTab(k)} className={`rounded-full px-4 py-2 text-sm font-bold ${lienTab === k ? "bg-emerald-800 text-white" : "bg-white text-slate-700 shadow-sm"}`}>{l}</button>
                  ))}
                </div>
                {lienTab === "echanges" && <div data-assistant-id="lma-private-exchanges"><MyExchanges mine={mine} userId={user.id} goPublish={() => goTab("publier")} /></div>}
                {lienTab === "projets" && (
                  <div className="space-y-3">
                    <button type="button" onClick={() => { setPubType("projet"); goTab("publier"); }} className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">+ Créer un projet</button>
                    {(data.links?.projects.length ?? 0) === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Vous ne participez à aucun projet. Explorez la carte pour en rejoindre un, ou créez le vôtre.</div> : (
                      <ul className="grid gap-3 md:grid-cols-2">{data.links!.projects.map((p) => (
                        <li key={p.id} className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800">{p.role === "organisateur" ? "Organisateur" : "Participant"}</span>{p.memberStatus === "demande" && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">Demande en attente</span>}{p.isDemo && <span className="text-[10px] font-bold uppercase text-slate-500">Exemple fictif</span>}{p.pendingRequests > 0 && <span className="rounded-full bg-emerald-800 px-2.5 py-1 text-xs font-bold text-white">{p.pendingRequests} demande(s) à traiter</span>}</div>
                          <h3 className="mt-2 text-lg font-bold text-slate-900">{p.title}</h3><p className="text-xs text-slate-500">{p.city} · {dateText(p.startsAt)}</p>
                          <Link href={`/le-monde-aime/projets/${p.id}`} className="mt-3 inline-block text-sm font-bold text-emerald-800 underline">Ouvrir le projet</Link>
                        </li>))}</ul>)}
                  </div>
                )}
                {lienTab === "cercles" && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">Un cercle privé réunit une famille, une association ou un groupe local, sur invitation acceptée. Les activités pour enfants passent par leurs responsables légaux ou une structure encadrante.</div>
                    {(data.links?.circles.length ?? 0) === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Aucun cercle pour l&apos;instant.</div> : (
                      <ul className="grid gap-3 md:grid-cols-2">{data.links!.circles.map((c) => (
                        <li key={c.id} className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white"><Icon name="lock" className="mr-1 inline h-3 w-3" />Privé</span>{c.isDemo && <span className="ml-2 text-[10px] font-bold uppercase text-slate-500">Exemple fictif</span>}
                          <h3 className="mt-2 text-lg font-bold text-slate-900">{c.name}</h3>{c.description && <p className="text-sm text-slate-600">{c.description}</p>}
                          <Link href={`/le-monde-aime/cercles/${c.id}`} className="mt-3 inline-block text-sm font-bold text-emerald-800 underline">Ouvrir le cercle</Link>
                        </li>))}</ul>)}
                    <CreateCircleForm />
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
