"use client";

import { useMemo, useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { PrimaryButton, SecondaryButton, formatAmount } from "@/components/ui";
import { SITUATION_LABELS } from "@/lib/constants";
import { ACTION_LABELS, CATEGORY_LABELS, STATUS_LABEL, UNIVERSE_LABEL, priceLabel } from "@/lib/lma";
export { STATUS_LABEL, priceLabel };
import type { CommunityResult } from "@/lib/actions/community";
import {
  advanceCommunityRequest,
  advanceCommunityTransport,
  decideCommunityRequest,
  decideCommunityTransportRequest,
  editCommunityListing,
  reportCommunityListing,
  updateCommunityListingStatus,
} from "@/lib/actions/community";
import { deleteCommunitySearch } from "@/lib/actions/community";
import {
  EventPlanForm,
  MessageComposer,
  PublishListingForm,
  RequestButton,
  SavedSearchForm,
  TripForm,
  TripRequestButton,
} from "@/components/community/forms";

export type Listing = {
  id: number; ownerId: number; action: string; category: string; title: string; description: string;
  condition: string; quantity: number; unit: string; price: string | null; deposit: string | null;
  attributes: Record<string, string>; city: string; lat: number; lng: number;
  availableFrom: string | Date | null; availableUntil: string | Date | null; pickupDetails: string;
  hasPhoto: boolean; isDemo: boolean; createdAt: string | Date;
  universes: string[]; publicationType: string; priceMode: string; ownerName: string; ownerVisible: boolean;
};
export type Trip = {
  id: number; ownerId: number; listingId: number | null; startCity: string; endCity: string;
  startLat: number; startLng: number; endLat: number; endLng: number; departureAt: string | Date;
  transportMode: string; capacity: number; availableCapacity: number; terms: string; compensation: string | null;
};
export type Agency = { id: number; name: string; city: string; postalCode: string; address: string; phone: string; hours: string; region: string; lat: number | null; lng: number | null };
export type ServiceKind = "producteur" | "association" | "artisan";
export type ServicePin = { id: number; name: string; city: string; lat: number; lng: number; kind?: ServiceKind; ownerName?: string; products?: Array<{ id: number; name: string; description: string; price: string; unit: string; stock: number }> };
export type Request = {
  id: number; reference: string; listingId: number; requesterId: number; quantity: number; message: string; ownerName: string;
  startsAt: string | Date | null; endsAt: string | Date | null; status: string; createdAt: string | Date; updatedAt: string | Date;
  title: string; category: string; action: string; city: string; unit: string; pickupDetails: string; listingOwnerId: number; requesterName: string;
  isOwner: boolean; messages: Array<{ id: number; requestId: number; senderId: number; body: string; createdAt: string | Date; senderName: string }>;
};
export type TripRequest = { id: number; tripId: number; requesterId: number; communityRequestId: number | null; description: string; status: string; createdAt: string | Date; updatedAt: string | Date; requesterName: string; ownerName: string; ownerId: number; startCity: string; endCity: string; departureAt: string | Date; transportMode: string; terms: string; isOwner: boolean };
export type OwnListing = { id: number; action: string; category: string; title: string; description: string; pickupDetails: string; city: string; quantity: number; unit: string; price: string | null; status: string; createdAt: string | Date };
export type EventPlan = { id: number; title: string; eventDate: string | Date; city: string; lat: string; lng: string; participants: number; needs: Array<{ text: string; quantity: number; category: string }>; status: string; createdAt: string | Date };
export type SavedSearch = { id: number; category: string | null; city: string; radiusKm: number; keywords: string; criteria: Record<string, string>; isActive: boolean };
export type CommunityData = {
  listings: Listing[]; trips: Trip[]; servicePins: ServicePin[]; agencies: Agency[];
  mine: { ownListings: OwnListing[]; requests: Request[]; tripRequests: TripRequest[]; eventPlans: EventPlan[]; savedSearches: SavedSearch[] } | null;
  user: { id: number; role: string } | null;
};

type Tab = "explorer" | "publier" | "echanges";
type CategoryFilter = "tout" | "produits_locaux" | "besoins_essentiels" | "objets_materiel" | "trajets_livraisons" | "services";

const CATEGORIES: Array<{ id: CategoryFilter; label: string; icon: "leaf" | "entraide" | "boutique" | "velo" | "building" }> = [
  { id: "produits_locaux", label: "Produits locaux", icon: "leaf" },
  { id: "besoins_essentiels", label: "Dons et besoins essentiels", icon: "entraide" },
  { id: "objets_materiel", label: "Objets et matériel", icon: "boutique" },
  { id: "trajets_livraisons", label: "Trajets et livraisons", icon: "velo" },
  { id: "services", label: "Services et accompagnement", icon: "building" },
];
export const ACTION_LABEL: Record<string, string> = ACTION_LABELS;
const ACTION_COLOR: Record<string, string> = { don: "bg-muted text-ink", pret: "bg-muted text-ink", loue: "bg-muted text-ink", vends: "bg-muted text-ink", cherche: "bg-muted text-ink-2", prestation: "bg-muted text-ink", transmission: "bg-muted text-ink" };
export const CATEGORY_LABEL: Record<string, string> = { ...CATEGORY_LABELS, evenementiel: "Matériel pour événement" };

export function dateText(value: string | Date | null) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "À convenir"; }
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
export function normalizeText(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr"); }

export function Feedback({ result }: { result: { ok: boolean; message?: string; error?: string } | null }) {
  if (!result) return null;
  return <p role={result.ok ? "status" : "alert"} className={`rounded-control px-3 py-2 text-xs ${result.ok ? "bg-muted text-ink" : "bg-muted text-ink"}`}>{result.ok ? result.message : result.error}</p>;
}

export function ListingAction({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);
  const router = useRouter();
  async function set(next: "publiee" | "suspendue" | "archivee") {
    if (next === "archivee" && !window.confirm("Archiver cette annonce ? Elle ne sera plus proposée aux autres.")) return;
    start(async () => { const result = await updateCommunityListingStatus(id, next); setFeedback(result); if (result.ok) router.refresh(); });
  }
  return <div className="mt-2 flex flex-wrap gap-2">
    <button type="button" disabled={pending} onClick={() => set(status === "suspendue" ? "publiee" : "suspendue")} className="rounded-control ring-1 ring-line px-2.5 py-1.5 text-xs font-semibold text-ink-2">{status === "suspendue" ? "Reprendre" : "Suspendre"}</button>
    {status !== "archivee" && <button type="button" disabled={pending} onClick={() => set("archivee")} className="rounded-control ring-1 ring-line px-2.5 py-1.5 text-xs font-semibold text-ink-2">Archiver</button>}
    <Feedback result={feedback}/>
  </div>;
}

export function EditListingButton({ item }: { item: OwnListing }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    start(async () => { const result = await editCommunityListing(form); setFeedback(result); if (result.ok) { setOpen(false); router.refresh(); } });
  }
  return <>
    <SecondaryButton type="button" className="!px-2.5 !py-1.5 text-xs" onClick={() => setOpen(true)}>Modifier</SecondaryButton>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={`edit-title-${item.id}`} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-card bg-canvas p-6 shadow-lifted">
        <div className="flex items-start justify-between"><div><h3 id={`edit-title-${item.id}`} className="text-xl font-bold text-ink">Modifier l&apos;annonce</h3><p className="mt-1 text-sm text-ink-3">{item.title}</p></div><button type="button" className="text-ink-3" onClick={() => setOpen(false)} aria-label="Fermer">✕</button></div>
        <form onSubmit={submit} className="mt-5 space-y-4"><input type="hidden" name="id" value={item.id}/><div><label className="block text-sm font-semibold" htmlFor={`edit-title-input-${item.id}`}>Titre</label><input id={`edit-title-input-${item.id}`} name="title" defaultValue={item.title} minLength={4} maxLength={140} required className="mt-1 w-full rounded-control ring-1 ring-line px-3 py-2 text-sm"/></div><div><label className="block text-sm font-semibold" htmlFor={`edit-desc-${item.id}`}>Description</label><textarea id={`edit-desc-${item.id}`} name="description" defaultValue={item.description} placeholder="Complétez les informations de l’annonce" minLength={8} maxLength={600} required className="mt-1 w-full rounded-control ring-1 ring-line px-3 py-2 text-sm"/></div><div><label className="block text-sm font-semibold" htmlFor={`edit-qty-${item.id}`}>Quantité restante · {item.unit}</label><input id={`edit-qty-${item.id}`} name="quantity" type="number" min={1} max={999} defaultValue={item.quantity} required className="mt-1 w-full rounded-control ring-1 ring-line px-3 py-2 text-sm"/></div><div><label className="block text-sm font-semibold" htmlFor={`edit-pickup-${item.id}`}>Modalités de retrait</label><input id={`edit-pickup-${item.id}`} name="pickupDetails" defaultValue={item.pickupDetails} maxLength={240} className="mt-1 w-full rounded-control ring-1 ring-line px-3 py-2 text-sm"/></div><Feedback result={feedback}/><div className="flex gap-2"><PrimaryButton type="submit" disabled={pending}>{pending?"Enregistrement…":"Enregistrer"}</PrimaryButton><SecondaryButton type="button" onClick={() => setOpen(false)}>Annuler</SecondaryButton></div></form>
      </section>
    </div>}
  </>;
}

export function ReportButton({ listingId }: { listingId: number }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  return <div className="mt-3">
    {!open ? <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-ink-3 underline">Signaler cette annonce</button> : <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); start(async () => { const r = await reportCommunityListing(listingId, String(f.get("reason")), String(f.get("details"))); setFeedback(r); if (r.ok) setOpen(false); }); }} className="space-y-2 rounded-control bg-muted p-3">
      <label className="block text-xs font-semibold" htmlFor={`report-${listingId}`}>Motif</label><select name="reason" id={`report-${listingId}`} className="w-full rounded-control ring-1 ring-line p-2 text-xs"><option value="contenu_inapproprie">Contenu inapproprié</option><option value="annonce_trompeuse">Annonce trompeuse</option><option value="doublon">Doublon</option><option value="autre">Autre</option></select><input name="details" maxLength={500} className="w-full rounded-control ring-1 ring-line p-2 text-xs" placeholder="Détail facultatif"/><Feedback result={feedback}/><div className="flex gap-2"><button disabled={pending} className="rounded-control bg-ink px-3 py-1.5 text-xs font-semibold text-canvas">{pending?"Envoi…":"Envoyer"}</button><button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-3">Annuler</button></div>
    </form>}
  </div>;
}

export function ListingCard({ item, userId, canRequest, eventPlanId }: { item: Listing; userId: number | null; canRequest: boolean; eventPlanId?: number }) {
  const own = userId === item.ownerId;
  return <article id={`listing-${item.id}`} className="animate-fade-up rounded-card bg-canvas p-5 ring-1 ring-line shadow-rested">
    {item.hasPhoto && (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- photo d’API dynamique, dimensions inconnues */}
        <img src={`/api/le-monde-aime/annonces/${item.id}/photo`} alt="" className="mb-3 h-40 w-full rounded-card object-cover" loading="lazy" />
      </>
    )}
    {item.isDemo && <span className="mb-2 inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-3">Exemple fictif</span>}
    <div className="flex items-start justify-between gap-3"><div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${ACTION_COLOR[item.action] ?? "bg-muted text-ink-2"}`}>{ACTION_LABEL[item.action] ?? item.action}</span><span className="ml-2 text-[11px] font-medium text-ink-3">{CATEGORY_LABEL[item.category] ?? item.category}</span></div>{priceLabel(item) && <strong className="whitespace-nowrap text-sm text-ink">{priceLabel(item)}</strong>}</div>
    <h3 className="mt-2 text-base font-bold text-ink">{item.title}</h3><p className="mt-1 text-sm text-ink-3">{item.description}</p><p className="mt-1 text-xs text-ink-3">Par {item.ownerVisible ? <Link href={`/le-monde-aime/personnes/${item.ownerId}`} className="font-semibold text-ink underline">{item.ownerName}</Link> : <strong>{item.ownerName}</strong>}{item.universes.length>0 && <> · {item.universes.map((u)=>UNIVERSE_LABEL[u]).filter(Boolean).join(" · ")}</>}</p>
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3"><span><Icon name="pin" className="mr-1 inline h-3.5 w-3.5"/>{item.city} · zone approximative</span><span>{item.quantity} {item.unit} disponible(s)</span>{item.condition !== "sans_objet" && <span>{item.condition.replaceAll("_", " ")}</span>}</div>
    {Object.entries(item.attributes).filter(([key]) => key === "size" || key === "eventDetails").map(([key, v]) => v && <span key={key} className="mt-2 mr-1 inline-block rounded-full bg-muted px-2.5 py-1 text-xs text-ink-2">{key === "size" ? "Taille / pointure" : "Dates / détails"} : {v}</span>)}
    {item.availableUntil && <p className="mt-2 text-xs text-ink-3">Disponible jusqu&apos;au {dateText(item.availableUntil)}</p>}
    {item.action === "loue" && item.deposit && <p className="mt-1 text-xs text-ink-3">Caution annoncée : {formatAmount(item.deposit)} · à convenir directement.</p>}
    <p className="mt-2 rounded-control bg-muted px-3 py-2 text-xs text-ink-3">Retrait : {item.pickupDetails}. Aucun paiement en ligne.</p>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {!userId ? <Link href="/mon-espace" className="rounded-control bg-ink px-3 py-2 text-xs font-semibold text-canvas">Comptes bientôt ouverts</Link> : own && canRequest ? <><EditListingButton item={{id:item.id,action:item.action,category:item.category,title:item.title,description:item.description,pickupDetails:item.pickupDetails,city:item.city,quantity:item.quantity,unit:item.unit,price:item.price,status:"publiee",createdAt:item.createdAt}}/><ListingAction id={item.id} status="publiee"/></> : canRequest ? <RequestButton listing={item} eventPlanId={eventPlanId}/> : <span className="text-xs text-ink-3">Les demandes sont réservées aux comptes membres.</span>}
    </div>
    {userId && !own && <ReportButton listingId={item.id}/>}
  </article>;
}

export function AgencyCard({ agency }: { agency: Agency }) {
  return <article className="animate-fade-up rounded-card bg-canvas p-5 ring-1 ring-line shadow-rested">
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink"><Icon name="building" className="h-3.5 w-3.5"/> Service externe</span>
    <h3 className="mt-2 font-bold text-ink">{agency.name}</h3><p className="text-sm text-ink-3">{agency.address}, {agency.postalCode} {agency.city}</p><p className="mt-1 text-xs text-ink-3">{agency.hours}</p>
    <div className="mt-3 flex gap-4 text-sm"><a className="font-semibold text-ink underline" href={`tel:${agency.phone.replace(/\s/g,"")}`}>{agency.phone}</a><Link href="/espace/echanges" className="font-semibold text-ink underline">Rendez-vous</Link></div>
  </article>;
}

/**
 * Résumé d'une fiche de circuit dans la liste du Monde Aime.
 *
 * Le détail vit dans le circuit : ici, on dit seulement ce que c'est, où c'est,
 * combien de lignes sont publiées, et comment on demande.
 */
const SERVICE_KIND_TEXT: Record<ServiceKind, { badge: string; link: string; detail: string; empty: string }> = {
  producteur: {
    badge: "Producteur local",
    link: "/circuits/producteurs",
    detail: "les quantités et le retrait se conviennent directement avec le producteur",
    empty: "Aucun produit publié pour l'instant",
  },
  association: {
    badge: "Association ou collectif",
    link: "/circuits/associations",
    detail: "ateliers, prêts et entraide se demandent depuis le circuit",
    empty: "Rien de publié pour l'instant",
  },
  artisan: {
    badge: "Artisan ou savoir-faire",
    link: "/circuits/artisans",
    detail: "les prestations se demandent depuis le circuit",
    empty: "Aucune prestation publiée pour l'instant",
  },
};

export function CircuitSummaryCard({ point }: { point: ServicePin }) {
  const info = SERVICE_KIND_TEXT[point.kind ?? "producteur"];
  const count = point.products?.length ?? 0;
  const lines = count > 0 ? `${count} ligne(s) publiée(s) sur sa fiche` : info.empty;
  return (
    <article className="animate-fade-up rounded-card bg-canvas p-5 ring-1 ring-line shadow-rested">
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink">{info.badge}</span>
      <h3 className="mt-2 font-bold text-ink">{point.name}</h3>
      <p className="text-sm text-ink-3">{point.city} · position approximative, déduite de la commune</p>
      <p className="mt-2 text-xs text-ink-3">{lines} · {info.detail}.</p>
      <Link href={info.link} className="mt-3 inline-flex h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-canvas">
        Voir la fiche dans son circuit
      </Link>
    </article>
  );
}

export function TripCard({ trip, userId, canRequest, linkedRequests, ownerName }: { trip: Trip; userId: number | null; canRequest: boolean; linkedRequests: Request[]; ownerName?: string }) {
  return <article className="animate-fade-up rounded-card bg-canvas p-5 ring-1 ring-line shadow-rested"><div className="flex items-start justify-between"><span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink"><Icon name="velo" className="h-3.5 w-3.5"/> Sur mon trajet</span><span className="text-xs text-ink-3">{trip.transportMode}</span></div><h3 className="mt-2 text-base font-bold text-ink">{trip.startCity} <Icon name="arrow" className="inline h-4 w-4"/> {trip.endCity}</h3>{ownerName && <p className="mt-1 text-xs text-ink-3">Proposé par {ownerName}</p>}<p className="mt-1 text-sm text-ink-3">Départ : {dateText(trip.departureAt)} · capacité {trip.availableCapacity}/{trip.capacity}</p><p className="mt-2 text-xs text-ink-3">{trip.terms || "Conditions à convenir directement."}{trip.compensation && Number(trip.compensation)>0 ? ` · participation annoncée ${formatAmount(trip.compensation)}` : " · proposé gratuitement"}</p><p className="mt-2 text-xs font-medium text-ink-3">Le transporteur doit accepter explicitement. Pas de garantie avant confirmation.</p>{userId && canRequest && trip.ownerId !== userId ? <TripRequestButton tripId={trip.id} linkedRequests={linkedRequests.filter((request) => request.requesterId === userId && ["reservee", "remise"].includes(request.status))}/> : !userId ? <Link href="/mon-espace" className="mt-3 inline-block text-sm font-semibold text-ink underline">Comptes bientôt ouverts</Link> : <span className="mt-3 inline-block text-xs font-semibold text-ink-3">{trip.ownerId === userId ? "Votre trajet" : "Demande réservée aux comptes membres"}</span>}</article>;
}

/** Même encre pour tout le monde : l’avancement se lit au contraste, pas à la couleur. */
export function statusColor(status: string) {
  if (["terminee", "retournee", "confirmee", "remise"].includes(status)) return "bg-ink text-canvas";
  if (["refusee", "annulee"].includes(status)) return "bg-muted text-ink-3";
  if (status === "demandee") return "bg-canvas text-ink ring-1 ring-ink";
  return "bg-muted text-ink";
}
export function RequestActions({ request }: { request: Request }) {
  const [pending, start] = useTransition(); const [feedback, setFeedback] = useState<CommunityResult|null>(null); const router=useRouter();
  function go(action: "accept"|"refuse"|"remettre"|"confirmer"|"retourner"|"annuler") {
    if (action === "annuler" && !window.confirm("Annuler cet échange ?")) return;
    start(async()=>{const result=action==="accept"||action==="refuse"?await decideCommunityRequest(request.id,action==="accept"?"accepter":"refuser"):await advanceCommunityRequest(request.id,action);setFeedback(result);if(result.ok)router.refresh();});
  }
  return <div className="mt-3 flex flex-wrap gap-2">
    {request.isOwner && request.status==="demandee" && <><PrimaryButton type="button" disabled={pending} onClick={()=>go("accept")} className="!px-3 !py-2 text-xs">Accepter</PrimaryButton><SecondaryButton type="button" disabled={pending} onClick={()=>go("refuse")} className="!px-3 !py-2 text-xs">Refuser</SecondaryButton></>}
    {request.isOwner && request.status==="reservee" && <PrimaryButton type="button" disabled={pending} onClick={()=>go("remettre")} className="!px-3 !py-2 text-xs">Confirmer la remise</PrimaryButton>}
    {!request.isOwner && request.status==="remise" && <PrimaryButton type="button" disabled={pending} onClick={()=>go("confirmer")} className="!px-3 !py-2 text-xs">Confirmer la réception</PrimaryButton>}
    {request.isOwner && request.status==="retour_attendu" && <PrimaryButton type="button" disabled={pending} onClick={()=>go("retourner")} className="!px-3 !py-2 text-xs">Confirmer le retour</PrimaryButton>}
    {["demandee","reservee"].includes(request.status) && <SecondaryButton type="button" disabled={pending} onClick={()=>go("annuler")} className="!px-3 !py-2 text-xs">Annuler la demande</SecondaryButton>}
    <Feedback result={feedback}/>
  </div>;
}

export function TripRequestActions({ request }: { request: TripRequest }) {
  const [pending, start] = useTransition(); const [feedback,setFeedback]=useState<CommunityResult|null>(null); const router=useRouter();
  function decide(accept:boolean){start(async()=>{const r=await decideCommunityTransportRequest(request.id,accept);setFeedback(r);if(r.ok)router.refresh();});}
  function advance(next:"collectee"|"remise"|"terminee"|"annulee"){start(async()=>{const r=await advanceCommunityTransport(request.id,next);setFeedback(r);if(r.ok)router.refresh();});}
  return <div className="mt-3 flex flex-wrap gap-2">
    {request.isOwner && request.status==="demandee" && <><PrimaryButton type="button" disabled={pending} onClick={()=>decide(true)} className="!px-3 !py-2 text-xs">Confirmer le transport</PrimaryButton><SecondaryButton type="button" disabled={pending} onClick={()=>decide(false)} className="!px-3 !py-2 text-xs">Refuser</SecondaryButton></>}
    {request.isOwner && request.status==="confirmee" && <PrimaryButton type="button" disabled={pending} onClick={()=>advance("collectee")} className="!px-3 !py-2 text-xs">Confirmer la collecte</PrimaryButton>}
    {request.isOwner && request.status==="collectee" && <PrimaryButton type="button" disabled={pending} onClick={()=>advance("remise")} className="!px-3 !py-2 text-xs">Confirmer la remise</PrimaryButton>}
    {!request.isOwner && request.status==="remise" && <PrimaryButton type="button" disabled={pending} onClick={()=>advance("terminee")} className="!px-3 !py-2 text-xs">Confirmer la réception</PrimaryButton>}
    {["demandee","confirmee"].includes(request.status) && <SecondaryButton type="button" disabled={pending} onClick={()=>advance("annulee")} className="!px-3 !py-2 text-xs">Annuler</SecondaryButton>}
    <Feedback result={feedback}/>
  </div>;
}


export function EventPlansSection({ plans }: { plans: EventPlan[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (plans.length === 0) return null;
  return (
    <section className="rounded-card bg-canvas ring-1 ring-line p-5">
      <h2 className="text-lg font-bold text-ink">Anciennes préparations d&apos;événement</h2>
      <p className="text-xs text-ink-3">Listes enregistrées avant l&apos;arrivée des projets partagés. Vous pouvez les transformer en projet, sans perdre la liste.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-card bg-muted p-3">
            <strong className="text-sm text-ink">{plan.title}</strong>
            <span className="block text-xs text-ink-3">{plan.city} · {dateText(plan.eventDate)} · {plan.needs.map((n) => `${n.quantity} ${n.text}`).join(", ")}</span>
            <button type="button" disabled={pending} onClick={() => start(async () => { const { createProjectFromEventPlan } = await import("@/lib/actions/projects"); const r = await createProjectFromEventPlan(plan.id); setMessage(r.ok ? r.message : r.error); if (r.ok) router.refresh(); })} className="mt-2 text-xs font-bold text-ink underline">Transformer en projet</button>
          </div>
        ))}
      </div>
      {message && <p role="status" className="mt-2 text-xs text-ink-3">{message}</p>}
    </section>
  );
}

export function MyExchanges({ mine, userId, goPublish }: { mine: CommunityData["mine"]; userId: number | null; goPublish: () => void }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      {!mine ? <div className="rounded-card bg-canvas p-8 text-center"><p className="text-ink-2">Connectez-vous pour consulter vos annonces et demandes.</p><Link href="/mon-espace" className="mt-3 inline-block font-bold text-ink underline">En savoir plus</Link></div> : <>
          <section className="rounded-card bg-canvas ring-1 ring-line p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-ink">Mes annonces</h2><p className="text-xs text-ink-3">Vous pouvez modifier, suspendre ou archiver vos annonces.</p></div><button type="button" onClick={()=>goPublish()} className="rounded-control bg-ink px-4 py-2 text-xs font-bold text-canvas">+ Publier</button></div>{mine.ownListings.length?<div className="mt-4 grid gap-3 sm:grid-cols-2">{mine.ownListings.map(item=><article key={item.id} className="rounded-card bg-muted p-4"><div className="flex justify-between gap-2"><h3 className="font-bold text-ink">{item.title}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.status==="publiee"?"bg-muted text-ink":"bg-subtle text-ink-3"}`}>{item.status==="publiee"?"Publiée":item.status==="suspendue"?"Suspendue":"Archivée"}</span></div><p className="mt-1 text-xs text-ink-3">{ACTION_LABEL[item.action]} · {CATEGORY_LABEL[item.category]} · {item.city} · {item.quantity} {item.unit}</p><div className="mt-3 flex flex-wrap gap-2"><EditListingButton item={item}/><ListingAction id={item.id} status={item.status}/></div></article>)}</div>:<p className="mt-3 text-sm text-ink-3">Vous n&apos;avez pas encore publié d&apos;annonce.</p>}</section>
          <section data-assistant-id="lma-private-exchanges" className="rounded-card bg-canvas ring-1 ring-line p-5"><h2 className="text-lg font-bold text-ink">Demandes et conversations</h2>{mine.requests.length? <div className="mt-4 grid gap-4 lg:grid-cols-2">{mine.requests.map(request=><article key={request.id} className="rounded-card ring-1 ring-line p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold text-ink">{request.title}</h3><p className="text-xs text-ink-3">{request.reference} · {request.isOwner?`Demande de ${request.requesterName}`:`Votre demande auprès de ${request.ownerName}`} · {request.quantity} {request.unit}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor(request.status)}`}>{STATUS_LABEL[request.status]??request.status}</span></div>{request.message&&<p className="mt-2 text-sm text-ink-3">« {request.message} »</p>}{["reservee","remise","retour_attendu","terminee"].includes(request.status)&&<p className="mt-2 rounded-control bg-muted p-2 text-xs text-ink">Modalités privées de retrait : {request.pickupDetails}</p>}{request.startsAt&&<p className="mt-1 text-xs text-ink-3">Période : {dateText(request.startsAt)} → {dateText(request.endsAt)}</p>}<RequestActions request={request}/><div className="mt-4 border-t border-line pt-3"><p className="text-xs font-bold text-ink-2">Conversation privée</p><div className="mt-2 max-h-40 space-y-2 overflow-y-auto">{request.messages.map(message=><div key={message.id} className={`rounded-control p-2 text-xs ${message.senderId===userId?"ml-5 bg-muted":"mr-5 bg-muted"}`}><strong>{message.senderId===userId?"Vous":message.senderName}</strong><p className="mt-0.5">{message.body}</p><time className="text-[10px] text-ink-4">{dateText(message.createdAt)}</time></div>)}</div>{!["terminee","annulee","refusee"].includes(request.status)&&<MessageComposer requestId={request.id}/>}</div></article>)}</div>:<p className="mt-3 text-sm text-ink-3">Aucune demande pour le moment. Explorez les annonces pour échanger.</p>}</section>
          <section className="rounded-card bg-canvas ring-1 ring-line p-5"><h2 className="text-lg font-bold text-ink">Mes demandes de transport</h2>{mine.tripRequests.length? <div className="mt-3 grid gap-3 sm:grid-cols-2">{mine.tripRequests.map(request=><article key={request.id} className="rounded-card bg-muted p-4"><div className="flex justify-between gap-2"><strong className="text-sm">{request.startCity} → {request.endCity}</strong><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusColor(request.status)}`}>{STATUS_LABEL[request.status]??request.status}</span></div><p className="mt-1 text-xs text-ink-3">{request.description} · {dateText(request.departureAt)} · {request.transportMode}</p><p className="mt-1 text-xs font-semibold text-ink">{request.isOwner?`Demande de ${request.requesterName}`:`Transporteur : ${request.ownerName}`}</p><TripRequestActions request={request}/></article>)}</div>:<p className="mt-3 text-sm text-ink-3">Aucune demande de transport reçue ou envoyée.</p>}</section>
          <EventPlansSection plans={mine.eventPlans}/>
          <section className="rounded-card bg-canvas ring-1 ring-line p-5"><h2 className="text-lg font-bold text-ink">Recherches enregistrées</h2>{mine.savedSearches.length?<div className="mt-3 flex flex-wrap gap-2">{mine.savedSearches.map(search=><div key={search.id} className="flex items-center gap-2 rounded-card bg-muted px-3 py-2 text-xs"><span>{search.category?CATEGORY_LABEL[search.category]:"Toutes catégories"} · {search.city||"France"} · {search.radiusKm} km{search.keywords?` · ${search.keywords}`:""}</span><button type="button" aria-label="Supprimer cette recherche" onClick={async()=>{const r=await deleteCommunitySearch(search.id);if(r.ok)router.refresh();}} className="font-bold text-ink-2">×</button></div>)}</div>:<p className="mt-2 text-sm text-ink-3">Aucune recherche enregistrée.</p>}</section>
        </>}
    </div>
  );
}
