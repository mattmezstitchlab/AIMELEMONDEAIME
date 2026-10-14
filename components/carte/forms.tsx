"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  addLocalProduct,
  createLocalOrder,
  createLocalPoint,
  deleteLocalPoint,
  deleteLocalProduct,
  setWorkerAvailability,
} from "@/lib/actions/local";
import { Icon } from "@/components/icon";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

type State = { ok: boolean; message?: string; error?: string } | null;

const inputCls = "mt-1 w-full rounded-control ring-1 ring-slate-300 px-3 py-2 text-sm";
const labelCls = "block text-sm font-medium text-slate-700";

function Field({ label, name, type = "text", defaultValue, required = true, placeholder }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean; placeholder?: string }) {
  const id = `${name}-${defaultValue ?? ""}`.replace(/\W/g, "");
  return (
    <div>
      <label className={labelCls} htmlFor={id}>{label}</label>
      <input id={id} name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

/** Formulaire de dépôt d'un point (production ou présence) à des coordonnées précises. */
export function PlacePointForm({ lat, lng, onDone }: { lat: number; lng: number; onDone: () => void }) {
  const [state, action, pending] = useActionState<State, FormData>(async (prev, form) => {
    const result = await createLocalPoint(form);
    if (result.ok) onDone();
    return result;
  }, null);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-card bg-subtle p-5">
      <input type="hidden" name="lat" value={lat.toFixed(6)} />
      <input type="hidden" name="lng" value={lng.toFixed(6)} />
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Icon name="pin" className="h-5 w-5 text-ink-3" /> Déposer mon point
      </h3>
      <p className="text-xs text-slate-500">
        Position retenue : {lat.toFixed(4)}, {lng.toFixed(4)}. Aucune donnée personnelle sensible n&apos;est demandée.
      </p>
      <div>
        <label className={labelCls} htmlFor="kind-point">Type de point</label>
        <select id="kind-point" name="kind" className={inputCls} defaultValue="presence">
          <option value="presence">Présence / entraide de proximité</option>
          <option value="producteur">Production locale (je vends sur place)</option>
        </select>
      </div>
      <Field label="Nom du point" name="name" placeholder="Ex. Ferme des Trois Champs" />
      <Field label="Commune" name="city" placeholder="Ex. Chartres" />
      <Field label="Téléphone (facultatif)" name="phone" required={false} placeholder="06 12 34 56 78" />
      <div>
        <label className={labelCls} htmlFor="desc-point">Description</label>
        <textarea id="desc-point" name="description" rows={3} maxLength={600} className={inputCls} placeholder="Ce que vous proposez, vos jours de présence…" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-ink-2">{state.message}</p>}
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={pending}>{pending ? "Envoi…" : "Publier sur la carte"}</PrimaryButton>
        <SecondaryButton type="button" onClick={onDone}>Annuler</SecondaryButton>
      </div>
    </form>
  );
}

/** Ajout d'un produit sur un point appartenant au membre connecté. */
export function ProductForm({ pointId }: { pointId: number }) {
  const [state, action, pending] = useActionState<State, FormData>(async (_prev, form) => addLocalProduct(form), null);
  return (
    <form action={action} className="mt-3 flex flex-col gap-3 rounded-card bg-subtle p-4">
      <input type="hidden" name="pointId" value={pointId} />
      <h4 className="text-sm font-semibold text-slate-900">Ajouter un produit</h4>
      <Field label="Nom du produit" name="name" placeholder="Ex. Panier de légumes" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix (€)" name="price" type="number" defaultValue="0.00" />
        <Field label="Unité" name="unit" defaultValue="l'unité" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock disponible" name="stock" type="number" defaultValue="1" />
        <div>
          <label className={labelCls} htmlFor={`cat-${pointId}`}>Catégorie</label>
          <select id={`cat-${pointId}`} name="category" className={inputCls} defaultValue="Produit fermier">
            {["Produit fermier", "Légumes", "Fruits", "Œufs", "Épicerie", "Boulangerie", "Autre"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor={`pdesc-${pointId}`}>Description</label>
        <textarea id={`pdesc-${pointId}`} name="description" rows={2} maxLength={400} className={inputCls} />
      </div>
      {state?.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-ink-2">{state.message}</p>}
      <PrimaryButton type="submit" disabled={pending}>{pending ? "Ajout…" : "Ajouter le produit"}</PrimaryButton>
    </form>
  );
}

/** Déclaration / mise à jour de sa disponibilité pour des missions de proximité. */
export function AvailabilityForm({
  defaultValues,
  lat,
  lng,
}: {
  defaultValues?: { city: string; skills: string[]; availabilityNote: string };
  lat: number;
  lng: number;
}) {
  const [state, action, pending] = useActionState<State, FormData>(async (_prev, form) => setWorkerAvailability(form), null);
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [skills, setSkills] = useState<string[]>(defaultValues?.skills ?? []);
  const [note, setNote] = useState(defaultValues?.availabilityNote ?? "");
  const [coords, setCoords] = useState({ lat, lng });
  const skillOptions = ["Livraison de proximité", "Aide aux champs", "Tenue de stand", "Préparation de paniers", "Coup de main au marché", "Accueil à la ferme"];

  return (
    <form action={action} className="flex flex-col gap-3 rounded-card bg-subtle p-5">
      <input type="hidden" name="lat" value={coords.lat.toFixed(6)} />
      <input type="hidden" name="lng" value={coords.lng.toFixed(6)} />
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Icon name="velo" className="h-5 w-5 text-amber-500" /> Me rendre disponible
      </h3>
      <p className="text-xs text-slate-500">
        Indiquez les missions que vous pouvez accomplir près de chez vous. Les producteurs voient votre point sur la carte et vous contactent.
      </p>
      <Field label="Commune" name="city" defaultValue={defaultValues?.city ?? ""} placeholder="Ex. Chartres" />
      <div>
        <label className={labelCls} htmlFor="avail-note">Vos créneaux (facultatif)</label>
        <input id="avail-note" name="availabilityNote" defaultValue={defaultValues?.availabilityNote ?? ""} maxLength={400} className={inputCls} placeholder="Ex. mercredis et samedis" />
      </div>
      <fieldset className="rounded-card ring-1 ring-line p-3">
        <legend className="px-1 text-sm font-medium text-slate-700">Missions possibles</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {skillOptions.map((skill) => {
            const active = skills.includes(skill);
            return (
              <label key={skill} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium ${active ? "ring-ink bg-ink text-white" : "border-slate-300 bg-white text-slate-700"}`}>
                <input type="checkbox" name="skills" value={skill} className="sr-only" checked={active} onChange={() => setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])} />
                {skill}
              </label>
            );
          })}
        </div>
      </fieldset>
      <button type="button" className="self-start text-xs font-semibold text-ink-2 underline" onClick={() => setCoords({ lat: 48.4474 + Math.random() * 0.02 - 0.01, lng: 1.4877 + Math.random() * 0.02 - 0.01 })}>
        Recentrer sur ma commune
      </button>
      {state?.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-ink-2">{state.message}</p>}
      <PrimaryButton type="submit" disabled={pending}>{pending ? "Envoi…" : "Publier ma disponibilité"}</PrimaryButton>
    </form>
  );
}

/** Commande d'un produit en retrait sur place. */
export function OrderButton({ productId, stock, label = "Commander" }: { productId: number; stock: number; label?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<State, FormData>(async (_prev, form) => createLocalOrder(form), null);

  if (!open) {
    return (
      <PrimaryButton type="button" className="!px-3 !py-1.5 text-xs" onClick={() => setOpen(true)}>
        <Icon name="colis" className="h-4 w-4" /> {label}
      </PrimaryButton>
    );
  }
  return (
    <form action={action} className="mt-2 flex flex-col gap-2 rounded-card bg-subtle p-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-700" htmlFor={`qty-${productId}`}>Quantité</label>
          <input id={`qty-${productId}`} name="quantity" type="number" min={1} max={Math.max(1, stock)} defaultValue={1} className="mt-1 w-20 rounded-control ring-1 ring-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700" htmlFor={`pickup-${productId}`}>Retrait souhaité</label>
          <input id={`pickup-${productId}`} name="pickupAt" type="datetime-local" className="mt-1 rounded-control ring-1 ring-slate-300 px-2 py-1.5 text-sm" />
        </div>
      </div>
      <input name="note" maxLength={300} placeholder="Précision pour le retrait (facultatif)" className="rounded-control ring-1 ring-slate-300 px-2 py-1.5 text-sm" />
      <p className="text-xs text-slate-500">Stock disponible : {stock}. Le retrait se fait sur place, sans paiement en ligne.</p>
      {state?.error && <p role="alert" className="text-xs text-rose-700">{state.error}</p>}
      {state?.ok && <p role="status" className="text-xs text-ink-2">{state.message}</p>}
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={pending} className="!px-3 !py-1.5 text-xs">{pending ? "Envoi…" : "Confirmer"}</PrimaryButton>
        <SecondaryButton type="button" className="!px-3 !py-1.5 text-xs" onClick={() => setOpen(false)}>Fermer</SecondaryButton>
      </div>
    </form>
  );
}

/** Boutons de gestion d'un point appartenant au membre. */
export function OwnerPointActions({ pointId }: { pointId: number }) {
  const [state, action, pending] = useActionState<State, unknown>(async () => deleteLocalPoint(pointId), null);
  return (
    <form action={action} className="inline">
      {state?.error && <p role="alert" className="mb-1 text-xs text-rose-700">{state.error}</p>}
      {state?.ok && <p role="status" className="mb-1 text-xs text-ink-2">{state.message}</p>}
      <SecondaryButton type="submit" disabled={pending} className="!px-3 !py-1.5 text-xs text-rose-700">
        {pending ? "Suppression…" : "Retirer de la carte"}
      </SecondaryButton>
    </form>
  );
}

export function OwnerProductActions({ productId }: { productId: number }) {
  const [state, action, pending] = useActionState<State, unknown>(async () => deleteLocalProduct(productId), null);
  return (
    <form action={action} className="inline">
      {state?.error && <p role="alert" className="mb-1 text-xs text-rose-700">{state.error}</p>}
           <SecondaryButton type="submit" disabled={pending} className="!px-2 !py-1 text-[11px] text-rose-700">Retirer</SecondaryButton>
    </form>
  );
}

/** Lien rapide vers l'itinéraire (service externe simulé). */
export function DirectionsLink({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return (
    <a
      href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:underline"
    >
      <Icon name="pin" className="h-4 w-4" /> {label}
    </a>
  );
}

export function AssistantHint() {
  return (
    <p className="text-xs text-slate-500">
      Besoin d&apos;aide pour utiliser la carte ?{" "}
      <Link href="/carte#comment-ca-marche" className="font-semibold text-ink-2 hover:underline">Voir le mode d&apos;emploi</Link>.
    </p>
  );
}
