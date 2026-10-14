"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createCommunityEventPlan, createCommunityListing, createCommunityTrip,
  requestCommunityListing, requestCommunityTransport, saveCommunitySearch,
  sendCommunityMessage, type CommunityResult,
} from "@/lib/actions/community";
import { Icon } from "@/components/icon";
import { LISTING_CATEGORIES, PROPOSITION_ACTIONS, UNIVERSES, defaultUniverses } from "@/lib/lma";
import { pointSummary, splitCommuneLabel } from "@/lib/point";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

/*
 * Formulaires du Monde Aime.
 *
 * Le point n'est plus choisi sur une carte : il est déduit de la commune et du
 * code postal (champ « Code postal »), et l'aperçu s'affiche sous les champs.
 * L'adresse exacte n'est donc jamais demandée.
 */

const input = "mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-4";
const label = "block text-sm font-semibold text-ink-2";
const ACTION_OPTIONS = [
  ["don", "Je donne"], ["pret", "Je prête"], ["loue", "Je loue"], ["vends", "Je vends"], ["cherche", "Je cherche"],
] as const;
const CATEGORIES = [
  ["produits_locaux", "Produits locaux"], ["besoins_essentiels", "Dons et besoins essentiels"],
  ["objets_materiel", "Objets et matériel"], ["services", "Services et accompagnement"],
  ["evenementiel", "Matériel événementiel"],
] as const;
type FeedbackValue = { ok: boolean; text: string } | null;
function Feedback({ value }: { value: FeedbackValue }) {
  if (!value) return null;
  return <p role={value.ok ? "status" : "alert"} className={`rounded-control px-3 py-2 text-sm ${value.ok ? "bg-muted text-ink" : "bg-canvas text-ink ring-1 ring-ink"}`}>{value.text}</p>;
}
function useAction(action: (form: FormData) => Promise<CommunityResult>, onSuccess?: () => void) {
  const [feedback, setFeedback] = useState<FeedbackValue>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    start(async () => {
      const result = await action(form);
      setFeedback({ ok: result.ok, text: result.ok ? result.message : result.error });
      if (result.ok) { onSuccess?.(); router.refresh(); }
    });
  };
  return { feedback, pending, submit };
}

/** Commune et code postal : les deux champs qui situent une publication. */
export function PlaceFields({
  communeId, communeName = "city", communeLabel = "Commune", communePlaceholder = "Ex. Chartres",
  communeDefault = "", postalDefault = "", postalName = "postalCode", radiusKm = false, required = true,
}: {
  communeId: string; communeName?: string; communeLabel?: string; communePlaceholder?: string;
  communeDefault?: string; postalDefault?: string; postalName?: string; radiusKm?: boolean; required?: boolean;
}) {
  const [commune, setCommune] = useState(communeDefault);
  const [postal, setPostal] = useState(postalDefault);
  const [radius, setRadius] = useState(30);
  const summary = useMemo(() => pointSummary(commune, postal), [commune, postal]);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={communeId}>{communeLabel}</label>
          <input id={communeId} name={communeName} required={required} minLength={2} maxLength={100} value={commune} onChange={(e) => setCommune(e.target.value)} placeholder={communePlaceholder} className={input} />
        </div>
        <div>
          <label className={label} htmlFor={`${communeId}-cp`}>Code postal</label>
          <input id={`${communeId}-cp`} name={postalName} required={required} inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={postal} onChange={(e) => setPostal(e.target.value.replace(/\D/g, ""))} placeholder="28000" className={input} />
        </div>
      </div>
      {radiusKm && (
        <div className="max-w-[12rem]">
          <label className={label} htmlFor={`${communeId}-radius`}>Rayon (km)</label>
          <input id={`${communeId}-radius`} name="radiusKm" type="number" min={1} max={200} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className={input} />
        </div>
      )}
      <p className="text-xs text-ink-3" aria-live="polite">
        {summary ?? "La commune et le code postal suffisent : le point est déduit automatiquement, sans adresse."}
      </p>
    </>
  );
}

export function PublishListingForm({ type, defaultAction, defaultCategory, onPublished }: {
  type: "proposition" | "besoin";
  /** Un circuit peut pré-remplir la modalité et la catégorie (logements, etc.). */
  defaultAction?: string;
  defaultCategory?: string;
  onPublished?: () => void;
}) {
  const isNeed = type === "besoin";
  const firstAction = defaultAction ?? (isNeed ? "cherche" : "don");
  const firstCategory = defaultCategory ?? (isNeed ? "objets_materiel" : "besoins_essentiels");
  const [actionKind, setActionKind] = useState(firstAction);
  const [category, setCategory] = useState(firstCategory);
  const [universes, setUniverses] = useState<string[]>(defaultUniverses(firstCategory));
  const [priceMode, setPriceMode] = useState("gratuit");
  const [unit, setUnit] = useState("pièce");
  const state = useAction(createCommunityListing, onPublished);
  const free = actionKind === "don" || actionKind === "pret";
  const priced = ["loue", "vends", "prestation", "transmission"].includes(actionKind);
  const effectiveMode = actionKind === "vends" ? "prix" : free ? "gratuit" : priceMode;
  const needsPeriod = actionKind === "pret" || actionKind === "loue";
  const physical = ["produits_locaux", "besoins_essentiels", "objets_materiel", "evenementiel"].includes(category);
  const placeholder = isNeed
    ? "Ex. une sono pour samedi, apprendre à coudre, un lieu pour répéter"
    : actionKind === "prestation" ? "Ex. concert acoustique, atelier d’écriture" : actionKind === "transmission" ? "Ex. atelier couture, secrets de la tarte aux pommes"
    : category === "produits_locaux" ? "Ex. panier de légumes de saison" : "Ex. manteau chaud, 3 tables pliantes";
  return <form onSubmit={state.submit} className="space-y-5">
    <input type="hidden" name="action" value={actionKind}/><input type="hidden" name="priceMode" value={effectiveMode}/>
    {!isNeed && <fieldset><legend className="mb-2 text-sm font-semibold text-ink-2">Je souhaite…</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{PROPOSITION_ACTIONS.map((o)=><button key={o.value} type="button" onClick={()=>{setActionKind(o.value);if(o.value==="prestation"){setCategory("arts_rencontres");setUniverses(defaultUniverses("arts_rencontres"));}if(o.value==="transmission"){setCategory("savoirs_transmission");setUniverses(defaultUniverses("savoirs_transmission"));}setPriceMode(o.value==="don"||o.value==="pret"||o.value==="transmission"?"gratuit":"prix");}} aria-pressed={actionKind===o.value} className={`rounded-card ring-1 p-3 text-left ${actionKind===o.value?"ring-ink bg-muted text-ink":"ring-line bg-canvas text-ink-2 hover:ring-ink-3"}`}><span className="block text-sm font-bold">{o.label}</span><span className="block text-[11px] text-ink-3">{o.hint}</span></button>)}</div></fieldset>}
    <div><label className={label} htmlFor="lm-title">{isNeed?"Je cherche…":"Titre de la proposition"}</label><input id="lm-title" name="title" required minLength={4} maxLength={140} placeholder={placeholder} className={input}/></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label className={label} htmlFor="lm-category">Catégorie</label><select id="lm-category" name="category" value={category} onChange={(e)=>{setCategory(e.target.value);setUniverses(defaultUniverses(e.target.value));setUnit(e.target.value==="produits_locaux"?"panier":"pièce");}} className={input}>{LISTING_CATEGORIES.map((c)=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
      {physical && !isNeed && <div><label className={label} htmlFor="lm-condition">État</label><select id="lm-condition" name="condition" className={input} defaultValue="bon_etat"><option value="neuf">Neuf / non utilisé</option><option value="tres_bon_etat">Très bon état</option><option value="bon_etat">Bon état</option><option value="a_reparer">À réparer / à signaler</option></select></div>}
      {!(physical && !isNeed) && <input type="hidden" name="condition" value="sans_objet"/>}</div>
    <fieldset><legend className="mb-1 text-sm font-semibold text-ink-2">Univers concernés</legend><p className="mb-2 text-xs text-ink-3">Un contenu peut relever de plusieurs univers.</p><div className="flex flex-wrap gap-2">{UNIVERSES.map((u)=>{const on=universes.includes(u.key);return <label key={u.key} className={`cursor-pointer rounded-full ring-1 px-3 py-1.5 text-xs font-semibold ${on?"ring-ink bg-ink text-canvas":"ring-line bg-canvas text-ink-2"}`}><input type="checkbox" name="universes" value={u.key} checked={on} onChange={()=>setUniverses((prev)=>prev.includes(u.key)?prev.filter((k)=>k!==u.key):[...prev,u.key])} className="sr-only"/>{u.label}</label>;})}</div></fieldset>
    <div><label className={label} htmlFor="lm-description">Description courte</label><textarea id="lm-description" name="description" required minLength={8} maxLength={600} rows={3} placeholder="Qui, quoi, dans quelles conditions : quelques phrases suffisent." className={input}/></div>
    <div className="grid gap-4 sm:grid-cols-3"><div><label className={label} htmlFor="lm-quantity">Quantité</label><input id="lm-quantity" name="quantity" type="number" min={1} max={999} defaultValue={1} required className={input}/></div><div><label className={label} htmlFor="lm-unit">Unité</label><input id="lm-unit" name="unit" maxLength={40} value={unit} onChange={(e)=>setUnit(e.target.value)} placeholder="pièce, panier, séance…" className={input}/></div></div>
    {!isNeed && <fieldset className="rounded-card bg-muted p-4"><legend className="px-1 text-sm font-semibold text-ink-2">Gratuité et prix</legend>
      {free && <p className="text-sm text-ink"><strong>Gratuit.</strong> {actionKind==="pret"?"L’objet est prêté, un retour est à prévoir.":"Aucune contrepartie demandée."}</p>}
      {priced && actionKind!=="vends" && <div className="mt-1 flex flex-wrap gap-2">{([["gratuit","Gratuit"],["prix","Prix annoncé"],["devis","Sur devis"]] as const).filter(([v])=>!(v==="gratuit"&&(actionKind==="loue"))).map(([v,t])=><label key={v} className={`cursor-pointer rounded-full ring-1 px-3 py-1.5 text-xs font-semibold ${priceMode===v?"ring-ink bg-ink text-canvas":"ring-line bg-canvas text-ink-2"}`}><input type="radio" name="priceModeChoice" checked={priceMode===v} onChange={()=>setPriceMode(v)} className="sr-only"/>{t}</label>)}</div>}
      {effectiveMode==="prix" && !free && <div className="mt-3 max-w-xs"><label className={label} htmlFor="lm-price">{actionKind==="prestation"?"Tarif indicatif (€)":"Prix annoncé (€)"}</label><input id="lm-price" name="price" type="number" min={0} max={99999} step="0.01" required className={input}/></div>}
      {effectiveMode==="devis" && <p className="mt-2 text-sm text-ink-2">Affiché comme <strong>« Sur devis »</strong> : le prix se convient dans l&apos;échange, hors plateforme.</p>}
      <p className="mt-2 text-xs text-ink-3">Aucun paiement n&apos;est encaissé ici : conditions et règlement se conviennent entre les personnes.</p></fieldset>}
    {isNeed && <p className="rounded-card bg-muted p-3 text-xs text-ink-2">Précisez dans la description votre budget éventuel, ou « sans budget ». Les personnes qui peuvent vous aider vous répondront via une demande.</p>}
    {(needsPeriod || category==="evenementiel" || isNeed || actionKind==="prestation" || actionKind==="transmission") && <div className="grid gap-4 sm:grid-cols-2"><div><label className={label} htmlFor="lm-from">{isNeed?"À partir du":"Disponible à partir du"}</label><input id="lm-from" name="availableFrom" type="datetime-local" className={input}/></div><div><label className={label} htmlFor="lm-until">{isNeed?"Jusqu’au":"Disponible jusqu’au"}</label><input id="lm-until" name="availableUntil" type="datetime-local" required={needsPeriod} className={input}/></div>{(actionKind==="loue")&&<div><label className={label} htmlFor="lm-deposit">Caution éventuelle (€)</label><input id="lm-deposit" name="deposit" type="number" min={0} step="0.01" className={input}/></div>}</div>}
    {(category==="besoins_essentiels"||category==="objets_materiel") && <div className="grid gap-4 sm:grid-cols-2"><div><label className={label} htmlFor="lm-size">Taille ou pointure (facultatif)</label><input id="lm-size" name="size" maxLength={24} placeholder="Ex. 38, M, 140 × 70 cm" className={input}/></div></div>}
    <PlaceFields communeId="lm-city" />
    {!isNeed && <div><label className={label} htmlFor="lm-pickup">Retrait ou lieu de rendez-vous</label><input id="lm-pickup" name="pickupDetails" maxLength={240} defaultValue="À convenir après accord" className={input}/></div>}
    {!isNeed && <div><label className={label} htmlFor="lm-photo">Photo (facultative)</label><input id="lm-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={`${input} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs file:font-semibold file:text-ink`}/><p className="mt-1 text-xs text-ink-3">JPEG, PNG ou WebP · 3 Mo maximum.</p></div>}
    <div className="rounded-card bg-muted p-3 text-xs text-ink-2"><Icon name="lock" className="mr-1 inline h-4 w-4 text-ink-2"/>La position affichée est approximative, déduite de la commune. L&apos;adresse précise n&apos;est partagée qu&apos;avec les personnes concernées, après accord.</div>
    <Feedback value={state.feedback}/><PrimaryButton type="submit" disabled={state.pending} className="w-full sm:w-auto">{state.pending?"Publication…":isNeed?"Publier mon besoin":"Publier ma proposition"}</PrimaryButton>
  </form>;
}

export function TripForm({ onCreated }: { onCreated?:()=>void }) {
  const state = useAction(createCommunityTrip, onCreated);
  return <form onSubmit={state.submit} className="space-y-4">
    <div className="rounded-card bg-muted p-4 text-sm text-ink"><strong>Sur mon trajet</strong><br/>Proposez un trajet. La demande reste en attente tant que le transporteur ne l&apos;a pas explicitement confirmée.</div>
    <PlaceFields communeId="trip-start" communeName="startCity" postalName="startPostalCode" communeLabel="Départ · commune" communePlaceholder="Ex. Chartres"/>
    <PlaceFields communeId="trip-end" communeName="endCity" postalName="endPostalCode" communeLabel="Destination · commune" communePlaceholder="Ex. Saint-Brieuc"/>
    <div className="grid gap-4 sm:grid-cols-2"><div><label className={label} htmlFor="trip-time">Date et heure</label><input id="trip-time" name="departureAt" type="datetime-local" required className={input}/></div><div><label className={label} htmlFor="trip-mode">Transport</label><select id="trip-mode" name="transportMode" className={input}><option>vélo</option><option>voiture</option><option>utilitaire</option><option>à pied</option><option>autre</option></select></div><div><label className={label} htmlFor="trip-capacity">Capacité (paniers / objets)</label><input id="trip-capacity" name="capacity" type="number" min={1} max={50} defaultValue={1} className={input}/></div><div><label className={label} htmlFor="trip-compensation">Participation annoncée (€) · facultatif</label><input id="trip-compensation" name="compensation" type="number" min={0} max={500} step="0.01" placeholder="0 = gratuit" className={input}/></div></div>
    <div><label className={label} htmlFor="trip-terms">Conditions</label><textarea id="trip-terms" name="terms" maxLength={400} rows={2} className={input} placeholder="Ex. paniers jusqu’à 10 kg…"/></div>
    <Feedback value={state.feedback}/><PrimaryButton type="submit" disabled={state.pending}>{state.pending?"Publication…":"Publier ce trajet"}</PrimaryButton>
  </form>;
}

export function RequestButton({ listing, eventPlanId, projectNeedId, defaultStart, defaultEnd, defaultQuantity, label: buttonLabel = "Demander", onSent }: { listing: {id:number;action:string;quantity:number;unit:string;title:string}; eventPlanId?:number; projectNeedId?:number; defaultStart?:string; defaultEnd?:string; defaultQuantity?:number; label?:string; onSent?:()=>void }) {
  const [open,setOpen]=useState(false);const state=useAction(requestCommunityListing,()=>{onSent?.();setOpen(false);});const period=listing.action==="pret"||listing.action==="loue";
  if(!open)return <PrimaryButton data-assistant-id="lma-request" type="button" className="!px-3 !py-2 text-xs" onClick={()=>setOpen(true)}>{buttonLabel}</PrimaryButton>;
  return <form onSubmit={state.submit} className="mt-3 space-y-2 rounded-card bg-canvas p-3 ring-1 ring-line"><input type="hidden" name="listingId" value={listing.id}/>{projectNeedId&&<input type="hidden" name="projectNeedId" value={projectNeedId}/>}{eventPlanId&&<input type="hidden" name="eventPlanId" value={eventPlanId}/>}<div><label className={label} htmlFor={`qty-${listing.id}-${projectNeedId??0}`}>Quantité · {listing.unit}</label><input id={`qty-${listing.id}-${projectNeedId??0}`} name="quantity" type="number" min={1} max={listing.quantity} defaultValue={Math.min(listing.quantity, defaultQuantity ?? 1)} required className={input}/></div>{period&&<div className="grid grid-cols-2 gap-2"><div><label className={label} htmlFor={`start-${listing.id}-${projectNeedId??0}`}>Début</label><input id={`start-${listing.id}-${projectNeedId??0}`} name="startsAt" type="datetime-local" defaultValue={defaultStart} required className={input}/></div><div><label className={label} htmlFor={`end-${listing.id}-${projectNeedId??0}`}>Fin</label><input id={`end-${listing.id}-${projectNeedId??0}`} name="endsAt" type="datetime-local" defaultValue={defaultEnd} required className={input}/></div></div>}<div><label className={label} htmlFor={`msg-${listing.id}-${projectNeedId??0}`}>Message au propriétaire</label><textarea id={`msg-${listing.id}-${projectNeedId??0}`} name="message" maxLength={500} rows={2} className={input} placeholder="Quand souhaitez-vous récupérer l’objet ?"/></div><p className="text-xs text-ink-3">La demande ne réserve rien avant l&apos;accord du propriétaire.</p><Feedback value={state.feedback}/><div className="flex gap-2"><PrimaryButton type="submit" disabled={state.pending} className="!px-3 !py-2 text-xs">{state.pending?"Envoi…":"Envoyer la demande"}</PrimaryButton><SecondaryButton type="button" className="!px-3 !py-2 text-xs" onClick={()=>setOpen(false)}>Annuler</SecondaryButton></div></form>;
}

export function TripRequestButton({ tripId, linkedRequests = [] }: { tripId:number; linkedRequests?: Array<{ id: number; reference: string; title: string }> }) {
  const [open,setOpen]=useState(false);const state=useAction(requestCommunityTransport,()=>setOpen(false));
  if(!open)return <PrimaryButton type="button" className="!px-3 !py-2 text-xs" onClick={()=>setOpen(true)}>Demander le transport</PrimaryButton>;
  return <form onSubmit={state.submit} className="mt-3 space-y-2 rounded-card bg-canvas p-3 ring-1 ring-line"><input type="hidden" name="tripId" value={tripId}/><label className={label} htmlFor={`trip-desc-${tripId}`}>Panier ou objet à transporter</label><input id={`trip-desc-${tripId}`} name="description" required minLength={4} maxLength={300} className={input} placeholder="Ex. un panier de légumes"/>{linkedRequests.length>0&&<div><label className={label} htmlFor={`trip-request-${tripId}`}>Lier à une réservation (facultatif)</label><select id={`trip-request-${tripId}`} name="communityRequestId" className={input}><option value="">Sans réservation existante</option>{linkedRequests.map(request=><option key={request.id} value={request.id}>{request.reference} · {request.title}</option>)}</select></div>}<Feedback value={state.feedback}/><div className="flex gap-2"><PrimaryButton type="submit" disabled={state.pending} className="!px-3 !py-2 text-xs">{state.pending?"Envoi…":"Demander"}</PrimaryButton><SecondaryButton type="button" className="!px-3 !py-2 text-xs" onClick={()=>setOpen(false)}>Annuler</SecondaryButton></div></form>;
}

export function MessageComposer({ requestId }: { requestId:number }) {
  const [text,setText]=useState("");const [feedback,setFeedback]=useState<FeedbackValue>(null);const [pending,start]=useTransition();const router=useRouter();
  return <form onSubmit={(event)=>{event.preventDefault();start(async()=>{const result=await sendCommunityMessage(requestId,text);setFeedback({ok:result.ok,text:result.ok?result.message:result.error});if(result.ok){setText("");router.refresh();}});}} className="mt-3 space-y-2"><label htmlFor={`chat-${requestId}`} className={label}>Message privé</label><textarea id={`chat-${requestId}`} value={text} onChange={e=>setText(e.target.value)} minLength={2} maxLength={1200} rows={2} className={input} placeholder="Convenez du retrait, posez une question…"/><Feedback value={feedback}/><PrimaryButton type="submit" disabled={pending||text.trim().length<2} className="!px-3 !py-2 text-xs">{pending?"Envoi…":"Envoyer le message"}</PrimaryButton></form>;
}

export function EventPlanForm({ onSaved }: { onSaved?:()=>void }) {
  const [needs,setNeeds]=useState([{text:"",quantity:1,category:"evenementiel"}]);const [feedback,setFeedback]=useState<FeedbackValue>(null);const [pending,start]=useTransition();const router=useRouter();
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);form.set("needs",JSON.stringify(needs.filter(n=>n.text.trim())));start(async()=>{const result=await createCommunityEventPlan(form);setFeedback({ok:result.ok,text:result.ok?result.message:result.error});if(result.ok){onSaved?.();router.refresh();}});}
  return <form onSubmit={submit} className="space-y-4 rounded-card ring-1 ring-line bg-canvas p-5"><div><h3 className="text-lg font-bold text-ink">Préparer mon événement</h3><p className="mt-1 text-sm text-ink-2">Mariage, repas associatif, fête de village… Chaque propriétaire confirme séparément ses objets.</p></div><div className="grid gap-3 sm:grid-cols-2"><div><label className={label} htmlFor="event-title">Événement</label><input id="event-title" name="title" required minLength={4} maxLength={140} className={input} placeholder="Ex. Fête du village"/></div><div><label className={label} htmlFor="event-date">Date et heure</label><input id="event-date" name="eventDate" type="datetime-local" required className={input}/></div><div><label className={label} htmlFor="event-people">Participants</label><input id="event-people" name="participants" type="number" min={1} max={5000} defaultValue={30} required className={input}/></div></div><PlaceFields communeId="event-city"/><fieldset><legend className="mb-2 text-sm font-semibold text-ink-2">Liste des besoins</legend><p className="mb-3 text-xs text-ink-3">Ex. 3 tables, 30 verres et une enceinte pour samedi.</p><div className="space-y-2">{needs.map((need,index)=><div key={index} className="grid grid-cols-[1fr_90px_40px] gap-2"><input value={need.text} onChange={e=>setNeeds(prev=>prev.map((n,i)=>i===index?{...n,text:e.target.value}:n))} maxLength={100} className={input} placeholder="Tables, verres, enceinte…"/><input value={need.quantity} onChange={e=>setNeeds(prev=>prev.map((n,i)=>i===index?{...n,quantity:Number(e.target.value)}:n))} type="number" min={1} max={999} className={input} aria-label={`Quantité du besoin ${index+1}`}/><button type="button" aria-label="Supprimer ce besoin" onClick={()=>setNeeds(prev=>prev.filter((_,i)=>i!==index))} className="rounded-control ring-1 ring-line">−</button></div>)}</div><button type="button" onClick={()=>setNeeds(prev=>[...prev,{text:"",quantity:1,category:"evenementiel"}])} className="mt-2 text-sm font-semibold text-ink hover:underline">+ Ajouter un besoin</button></fieldset><Feedback value={feedback}/><PrimaryButton type="submit" disabled={pending}>{pending?"Enregistrement…":"Enregistrer ma liste"}</PrimaryButton></form>;
}

export function SavedSearchForm({defaults={}}:{defaults?:{category?:string;city?:string;keywords?:string;radiusKm?:number;size?:string}}) {
  const state=useAction(saveCommunitySearch);
  const savedPlace=splitCommuneLabel(defaults.city ?? "");
  return <form onSubmit={state.submit} className="space-y-3 rounded-card bg-muted p-4"><p className="text-sm font-bold text-ink">M&apos;avertir quand une annonce correspond</p><div className="grid gap-3 sm:grid-cols-2"><div><label className={label} htmlFor="save-category">Catégorie</label><select id="save-category" name="category" defaultValue={defaults.category??""} className={input}><option value="">Toutes les catégories</option>{CATEGORIES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div><label className={label} htmlFor="save-keywords">Mot-clé</label><input id="save-keywords" name="keywords" defaultValue={defaults.keywords} maxLength={180} className={input} placeholder="Ex. couverture"/></div><div><label className={label} htmlFor="save-size">Taille / pointure</label><input id="save-size" name="size" defaultValue={defaults.size} maxLength={30} className={input} placeholder="Ex. 38, M"/></div></div><PlaceFields communeId="save-city" communeLabel="Commune (facultatif)" communeDefault={savedPlace.commune} postalDefault={savedPlace.postalCode} radiusKm required={false}/><Feedback value={state.feedback}/><PrimaryButton type="submit" disabled={state.pending} className="!px-3 !py-2 text-xs">{state.pending?"Enregistrement…":"Enregistrer cette recherche"}</PrimaryButton></form>;
}

export { ACTION_OPTIONS };
