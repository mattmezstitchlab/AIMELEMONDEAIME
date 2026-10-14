"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icon";
import {
  AgencyCard, LegacyPointCard, ListingCard, TripCard, dateText, distanceKm, normalizeText, priceLabel,
  type Agency, type CommunityData, type Listing, type ServicePin, type Trip,
} from "@/components/community/community-app";
import { PublishListingForm, SavedSearchForm, TripForm } from "@/components/community/forms";
import { ProjectForm } from "@/components/community/project-panels";
import { UNIVERSES, UNIVERSE_LABEL, defaultUniverses } from "@/lib/lma";

/*
 * Le Monde Aime, sans carte.
 *
 * La carte interactive a été retirée : tout se parcourt en listes, filtrées par
 * univers, type, commune, mot-clé, distance et date. Le point de chaque
 * publication existe toujours en base (il vient de la commune et du code
 * postal), mais il ne sert plus qu'à calculer les distances : rien à toucher,
 * rien à placer. Publier se fait par formulaire, avec deux champs : commune et
 * code postal.
 */

export type Person = { id: number; name: string; bio: string | null; activities: string[]; universes: string[]; offersText: string | null; needsText: string | null; transmitText: string | null; travelRadiusKm: number; availabilityNote: string | null; city: string | null; lat: number; lng: number; isDemo: boolean; hasPhoto: boolean };
export type ProjectPin = { id: number; title: string; intention: string; city: string; lat: number; lng: number; startsAt: Date | string; endsAt: Date | string | null; universes: string[]; isDemo: boolean; organizerName: string; participants: number; needsTotal: number; needsConfirmed: number };
export type Story = { id: number; title: string; body: string; kind: string; createdAt: Date | string; isDemo: boolean; hasPhoto: boolean; authorName: string };

export type LmaData = {
  listings: Listing[]; trips: Trip[]; servicePins: ServicePin[]; agencies: Agency[];
  people: Person[]; projects: ProjectPin[]; stories: Story[];
  mine: CommunityData["mine"]; user: { id: number; role: string } | null;
};

type Tab = "explorer" | "publier";
type ItemType = "offre" | "besoin" | "projet" | "personne" | "trajet" | "service";
type Item = {
  key: string; type: ItemType; universes: string[]; lat: number; lng: number; city: string; name: string; detail: string; badge?: string;
  free: boolean; from: Date | null; to: Date | null; text: string; render: () => ReactNode;
};

const TYPE_OPTIONS: Array<[string, string]> = [["tout", "Toutes les publications"], ["offre", "Propositions"], ["besoin", "Besoins"], ["projet", "Projets"], ["personne", "Personnes"], ["trajet", "Trajets"]];
const toDate = (v: Date | string | null) => (v ? new Date(v) : null);

const chip = "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink";
const cardShell = "animate-fade-up rounded-card bg-canvas p-5 ring-1 ring-line shadow-rested";

function PersonCard({ p }: { p: Person }) {
  return (
    <article className={cardShell}>
      <div className="flex gap-3">
        {p.hasPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- photo d’API dynamique, dimensions inconnues */}
            <img src={`/api/profil/${p.id}/photo`} alt="" className="h-14 w-14 rounded-full object-cover ring-1 ring-line" loading="lazy" />
          </>
        ) : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-muted text-lg font-bold text-ink" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>}
        <div className="min-w-0">
          <span className={chip}>Personne{p.isDemo ? " · profil fictif" : ""}</span>
          <h3 className="mt-1 text-base font-bold text-ink">{p.name}</h3>
          <p className="text-xs text-ink-3">{p.city ?? "France"} · zone d&apos;environ {p.travelRadiusKm} km · position approximative</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">{p.activities.slice(0, 5).map((a) => <span key={a} className="rounded-full ring-1 ring-line px-2.5 py-1 text-xs font-semibold text-ink-2">{a}</span>)}</div>
      {p.bio && <p className="mt-2 line-clamp-3 text-sm text-ink-2">{p.bio}</p>}
      <ul className="mt-2 space-y-0.5 text-xs text-ink-2">
        {p.offersText && <li><strong>Propose :</strong> {p.offersText}</li>}
        {p.needsText && <li><strong>Recherche :</strong> {p.needsText}</li>}
        {p.transmitText && <li><strong>Transmet :</strong> {p.transmitText}</li>}
        {p.availabilityNote && <li><strong>Disponible :</strong> {p.availabilityNote}</li>}
      </ul>
      <Link href={`/le-monde-aime/personnes/${p.id}`} className="mt-4 inline-flex h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-canvas">Voir la fiche</Link>
    </article>
  );
}

function ProjectCard({ p }: { p: ProjectPin }) {
  return (
    <article className={cardShell}>
      <span className={chip}>Projet{p.isDemo ? " · exemple fictif" : ""}</span>
      <h3 className="mt-2 text-base font-bold text-ink">{p.title}</h3>
      <p className="mt-1 line-clamp-3 text-sm text-ink-2">{p.intention}</p>
      <p className="mt-2 text-xs text-ink-3"><Icon name="pin" className="mr-1 inline h-3.5 w-3.5" />{p.city} · position approximative · {dateText(p.startsAt)}</p>
      <p className="text-xs text-ink-3">Organisé par {p.organizerName} · {p.participants} participant(s) · {p.needsConfirmed}/{p.needsTotal} besoin(s) confirmé(s)</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{p.universes.map((u) => <span key={u} className="rounded-full ring-1 ring-line px-2.5 py-1 text-[11px] font-semibold text-ink-2">{UNIVERSE_LABEL[u]}</span>)}</div>
      <Link href={`/le-monde-aime/projets/${p.id}`} className="mt-4 inline-flex h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-canvas">Voir le projet</Link>
    </article>
  );
}

export function CommunityApp({ data }: { data: LmaData }) {
  const router = useRouter();
  const params = useSearchParams();
  const onglet = params.get("onglet");
  const tab: Tab = onglet === "publier" ? "publier" : "explorer";
  const user = data.user;
  const isMember = user?.role === "membre";
  const mine = data.mine;

  const [universe, setUniverse] = useState(params.get("univers") ?? "tout");
  const [type, setType] = useState("tout");
  const [freeOnly, setFreeOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState(params.get("q") ?? "");
  const [radius, setRadius] = useState(60);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Synchronisation URL → filtres (patron React : ajustement pendant le rendu).
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

  const goTab = (key: Tab) => router.push(key === "explorer" ? "/le-monde-aime" : `/le-monde-aime?onglet=${key}`, { scroll: false });
  const requests = useMemo(() => mine?.requests ?? [], [mine]);

  // ---- Tout ce qui se publie, mis à plat pour la liste
  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const l of data.listings) {
      const isNeed = l.publicationType === "besoin";
      out.push({
        key: `listing:${l.id}`, type: isNeed ? "besoin" : "offre", universes: l.universes.length ? l.universes : defaultUniverses(l.category),
        lat: l.lat, lng: l.lng, city: l.city, name: l.title, detail: `${l.city} · ${l.ownerName}`,
        badge: priceLabel(l) || undefined, free: priceLabel(l) === "Gratuit", from: toDate(l.availableFrom), to: toDate(l.availableUntil),
        text: `${l.title} ${l.description} ${Object.values(l.attributes).join(" ")} ${l.city} ${l.ownerName}`,
        render: () => <ListingCard item={l} userId={user?.id ?? null} canRequest={isMember} />,
      });
    }
    for (const t of data.trips) {
      out.push({
        key: `trip:${t.id}`, type: "trajet", universes: ["terre"], lat: t.startLat, lng: t.startLng, city: t.startCity, name: `${t.startCity} → ${t.endCity}`,
        detail: dateText(t.departureAt), badge: t.transportMode, free: !t.compensation || Number(t.compensation) <= 0, from: toDate(t.departureAt), to: toDate(t.departureAt),
        text: `${t.startCity} ${t.endCity} trajet livraison ${t.transportMode} ${t.terms}`,
        render: () => <TripCard trip={t} userId={user?.id ?? null} canRequest={isMember} linkedRequests={requests} />,
      });
    }
    for (const p of data.servicePins) {
      out.push({
        key: `legacy:${p.id}`, type: "offre", universes: ["terre"], lat: p.lat, lng: p.lng, city: p.city, name: p.name, detail: p.city, badge: "Producteur",
        free: false, from: null, to: null, text: `${p.name} ${p.city} producteur ferme produits locaux`, render: () => <LegacyPointCard point={p} />,
      });
    }
    for (const p of data.people) {
      out.push({
        key: `person:${p.id}`, type: "personne", universes: p.universes, lat: p.lat, lng: p.lng, city: p.city ?? "", name: p.name, detail: p.activities.slice(0, 2).join(", "),
        badge: "Personne", free: false, from: null, to: null,
        text: `${p.name} ${p.bio ?? ""} ${p.activities.join(" ")} ${p.offersText ?? ""} ${p.needsText ?? ""} ${p.transmitText ?? ""} ${p.city ?? ""}`,
        render: () => <PersonCard p={p} />,
      });
    }
    for (const p of data.projects) {
      out.push({
        key: `project:${p.id}`, type: "projet", universes: p.universes, lat: p.lat, lng: p.lng, city: p.city, name: p.title, detail: `${p.city} · ${dateText(p.startsAt)}`, badge: "Projet",
        free: false, from: toDate(p.startsAt), to: toDate(p.endsAt) ?? toDate(p.startsAt), text: `${p.title} ${p.intention} ${p.city} ${p.organizerName}`,
        render: () => <ProjectCard p={p} />,
      });
    }
    for (const a of data.agencies) {
      if (a.lat === null || a.lng === null) continue;
      out.push({
        key: `agency:${a.id}`, type: "service", universes: [], lat: a.lat, lng: a.lng, city: a.city, name: a.name, detail: `${a.city} · structure externe`, badge: "Externe",
        free: false, from: null, to: null, text: `${a.name} ${a.city} ${a.postalCode} ${a.region} service accompagnement`,
        render: () => <AgencyCard agency={a} />,
      });
    }
    return out;
  }, [data, isMember, requests, user?.id]);

  const cityOrigin = useMemo(() => {
    const term = normalizeText(city.trim());
    if (!term) return null;
    const hit = items.find((i) => normalizeText(i.city).startsWith(term));
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
      if (term) { if (cityOrigin) { if (distanceKm(cityOrigin, i) > radius) return false; } else if (!normalizeText(i.city).includes(term)) return false; }
      else if (center && distanceKm(center, i) > radius) return false;
      return true;
    });
  }, [items, universe, type, freeOnly, dateFilter, keyword, city, cityOrigin, center, radius]);

  function locate() {
    if (!navigator.geolocation) { window.alert("Votre navigateur ne propose pas la géolocalisation. Indiquez une commune."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setCity(""); },
      () => window.alert("La géolocalisation n’a pas été autorisée. Indiquez simplement une commune."),
      { timeout: 8000 },
    );
  }
  const hasFilters = Boolean(center || city || keyword || dateFilter || freeOnly || type !== "tout" || universe !== "tout");
  function resetFilters() { setCenter(null); setCity(""); setKeyword(""); setDateFilter(""); setFreeOnly(false); setType("tout"); setUniverse("tout"); }

  const fieldCls = "mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-4";
  const fieldLabel = "block text-xs font-semibold text-ink-2";

  return (
    <div className="bg-canvas">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6">
        <p className="nav-tiny text-ink-3">Le Monde Aime</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div className="max-w-2xl">
            <h1 className="text-[2rem] leading-[1.05] tracking-[-0.03em] text-ink sm:text-[2.4rem]">Tout ce qui s’échange près de vous, en listes claires.</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">Personnes, productions locales, artistes, besoins, projets et trajets. Initiative indépendante : aucun paiement en ligne, aucune réservation sans accord explicite. Rien à placer sur une carte : votre commune et son code postal suffisent.</p>
          </div>
          <nav aria-label="Sections Le Monde Aime" className="inline-flex gap-1 rounded-full ring-1 ring-line p-1">
            {([["explorer", "Explorer", "search"], ["publier", "Publier", "filePlus"]] as const).map(([key, text, icon]) => (
              <button key={key} type="button" onClick={() => goTab(key)} aria-current={tab === key ? "page" : undefined} className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${tab === key ? "bg-ink text-canvas" : "text-ink-2 hover:text-ink"}`}><Icon name={icon} className="h-4 w-4" />{text}</button>
            ))}
            <Link href="/espace/echanges" className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink-2 transition hover:text-ink"><Icon name="heart" className="h-4 w-4" />Mes échanges</Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
        {tab === "explorer" && (
          <>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Univers" data-assistant-id="lma-filters">
              {[{ key: "tout", label: "Tout" }, ...UNIVERSES.map((u) => ({ key: u.key as string, label: u.label })), { key: "services", label: "Structures externes" }].map((u) => (
                <button key={u.key} type="button" aria-pressed={universe === u.key} onClick={() => setUniverse(u.key)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${universe === u.key ? "bg-ink text-canvas" : "ring-1 ring-line text-ink-2 hover:text-ink"}`}>{u.label}</button>
              ))}
            </div>

            <section aria-labelledby="lma-filters-title" className="rounded-card bg-muted p-5">
              <h2 id="lma-filters-title" className="text-sm font-bold text-ink">Affiner</h2>
              <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={fieldLabel} htmlFor="f-kw">Que cherchez-vous ?</label>
                  <input id="f-kw" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="légumes, concert, couture…" className={fieldCls} />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="f-city">Commune</label>
                  <input id="f-city" value={city} onChange={(e) => { setCity(e.target.value); setCenter(null); }} placeholder="Chartres" className={fieldCls} />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="f-type">Publication</label>
                  <select id="f-type" value={type} onChange={(e) => setType(e.target.value)} className={fieldCls}>{TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="f-date">Date</label>
                  <input id="f-date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={fieldCls} />
                </div>
                <div className="lg:col-span-2">
                  <label htmlFor="f-radius" className="flex justify-between text-xs font-semibold text-ink-2"><span>{origin ? "Distance autour du point" : "Distance (commune ou position)"}</span><span>{radius} km</span></label>
                  <input id="f-radius" type="range" min={5} max={200} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="mt-3 w-full accent-ink" />
                </div>
                <div className="flex flex-wrap items-end gap-3 lg:col-span-2">
                  <label className="flex items-center gap-2 pb-1 text-sm font-semibold text-ink-2"><input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className="h-4 w-4 accent-ink" />Gratuit</label>
                  <button type="button" onClick={locate} className="h-10 rounded-full ring-1 ring-line px-4 text-xs font-semibold text-ink-2">Autour de moi</button>
                  {hasFilters && <button type="button" onClick={resetFilters} className="text-xs font-semibold text-ink underline">Réinitialiser</button>}
                </div>
              </form>
            </section>

            <p className="mt-5 text-sm text-ink-3" aria-live="polite">{filtered.length} publication(s) affichée(s){(city || center) ? ` · dans un rayon de ${radius} km` : ""} · positions approximatives, déduites de la commune.</p>

            {filtered.length === 0 ? (
              <section className="mt-4 rounded-card bg-muted p-8 text-center">
                <p className="text-sm text-ink-2">Aucune publication ne correspond à ces filtres pour l’instant.</p>
                {hasFilters && <button type="button" onClick={resetFilters} className="mt-3 text-sm font-semibold text-ink underline">Voir toutes les publications</button>}
              </section>
            ) : (
              <ul className="mt-4 grid gap-4 lg:grid-cols-2">
                {filtered.map((item) => <li key={item.key}>{item.render()}</li>)}
              </ul>
            )}

            <section className="mt-8 border-t border-line pt-6">
              <h2 className="text-lg leading-tight tracking-[-0.02em] text-ink">Être prévenu</h2>
              <p className="mt-1 text-sm text-ink-2">Enregistrez une recherche : vous recevrez une notification dans votre espace dès qu’une publication correspond.</p>
              <div className="mt-4 max-w-2xl"><SavedSearchForm /></div>
            </section>
          </>
        )}

        {tab === "publier" && (
          <section className="mx-auto max-w-3xl">
            <div className="rounded-panel bg-canvas ring-1 ring-line p-6 shadow-rested sm:p-8">
              <h1 className="text-[1.9rem] leading-tight tracking-[-0.02em] text-ink">Que souhaitez-vous publier ?</h1>
              <p className="mt-2 text-sm text-ink-2">Indiquez la commune et le code postal : le point est déduit automatiquement, il reste approximatif. L&apos;adresse précise n&apos;est partagée qu&apos;avec les personnes concernées, après accord.</p>
              {!user ? <div className="mt-6 rounded-card bg-muted p-4 text-sm text-ink-2">Les comptes ouvrent bientôt : en attendant, tout le public reste consultable. <Link href="/mon-espace" className="font-bold text-ink underline">Mon espace</Link></div>
              : !isMember ? <div className="mt-6 rounded-card bg-muted p-4 text-sm text-ink-2">La publication est réservée aux comptes membres.</div> : (
                <>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3" role="group" aria-label="Type de publication">
                    {([["proposition", "Une proposition", "Je donne, je prête, je loue, je vends, je propose une prestation, je transmets."], ["besoin", "Un besoin", "Je cherche une sono, je voudrais apprendre à coudre…"], ["projet", "Un projet", "Organisons une fête, créons un jardin partagé…"]] as const).map(([k, t, d]) => (
                      <button key={k} type="button" onClick={() => setPubType(k)} aria-pressed={pubType === k} className={`rounded-card ring-1 p-4 text-left transition ${pubType === k ? "bg-muted ring-ink" : "ring-line hover:ring-ink-3"}`}><span className="block text-base font-bold text-ink">{t}</span><span className="mt-1 block text-xs text-ink-3">{d}</span></button>
                    ))}
                  </div>
                  {pubType === "proposition" && (
                    <div className="mt-4 flex gap-2"><button type="button" onClick={() => setPubSub("annonce")} className={`h-10 rounded-full px-4 text-sm font-semibold ${pubSub === "annonce" ? "bg-ink text-canvas" : "ring-1 ring-line text-ink-2"}`}>Objet, produit, service ou savoir</button><button type="button" onClick={() => setPubSub("trajet")} className={`h-10 rounded-full px-4 text-sm font-semibold ${pubSub === "trajet" ? "bg-ink text-canvas" : "ring-1 ring-line text-ink-2"}`}>Un trajet</button></div>
                  )}
                  <div className="mt-7" data-assistant-id={pubType === "projet" ? "lma-project-form" : pubSub === "trajet" && pubType === "proposition" ? "lma-trip-form" : "lma-listing-form"}>
                    {pubType === "projet" ? <ProjectForm />
                      : pubType === "proposition" && pubSub === "trajet" ? <TripForm onCreated={() => setTimeout(() => router.push("/espace/echanges"), 1200)} />
                      : <PublishListingForm key={pubType} type={pubType} onPublished={() => setTimeout(() => router.push("/espace/echanges"), 1200)} />}
                  </div>
                </>
              )}
            </div>
            {data.stories.length > 0 && (
              <div className="mt-6 rounded-card bg-muted p-5">
                <h2 className="text-sm font-bold text-ink">Derniers récits publiés</h2>
                <ul className="mt-3 space-y-3">
                  {data.stories.slice(0, 3).map((s) => (
                    <li key={s.id} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                      <strong className="text-sm text-ink">{s.title}</strong>
                      <p className="mt-1 line-clamp-2 text-xs text-ink-2">{s.body}</p>
                      <span className="mt-1 block text-[11px] text-ink-4">{s.authorName} · {dateText(s.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-6 text-xs text-ink-3">Un contenu vous semble inapproprié ? Chaque fiche publiée porte un lien de signalement, étudié par l’équipe.</p>
          </section>
        )}
      </div>
    </div>
  );
}
