"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createCircuitItem, createCircuitOrder, createCircuitStructure, deleteCircuitItem, deleteCircuitStructure,
  setWorkerAvailability, toggleWorkerAvailability, updateCircuitOrderStatus, type CircuitResult,
} from "@/lib/actions/circuits";
import { PlaceFields } from "@/components/community/forms";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { SKILL_SUGGESTIONS, type Circuit } from "@/lib/circuits";

/*
 * Formulaires des circuits.
 *
 * Tous les circuits partagent ces formulaires : les mots (fiche, produit,
 * réservation) viennent de lib/circuits.ts, le point vient de la commune et du
 * code postal. Rien n'est placé à la main, et l'adresse exacte n'est jamais
 * demandée.
 */

const field = "w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-4";
const fieldLabel = "block text-sm font-semibold text-ink-2";

type Feedback = { ok: boolean; text: string } | null;

function Message({ value }: { value: Feedback }) {
  if (!value) return null;
  return (
    <p role={value.ok ? "status" : "alert"} className={`rounded-control px-3 py-2 text-sm ${value.ok ? "bg-muted text-ink" : "bg-canvas text-ink ring-1 ring-ink"}`}>
      {value.text}
    </p>
  );
}

/** Une action de circuit, avec son retour affiché au bon endroit. */
function useCircuitAction(action: (form: FormData) => Promise<CircuitResult>, onSuccess?: () => void) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, start] = useTransition();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    start(async () => {
      const result = await action(form);
      setFeedback({ ok: result.ok, text: result.ok ? result.message : result.error });
      if (result.ok) {
        element.reset();
        onSuccess?.();
        router.refresh();
      }
    });
  };
  return { feedback, pending, submit };
}

/** Bouton à deux temps pour les actions qui ne prennent pas de formulaire. */
function ActionButton({ action, label, pendingLabel, className = "h-10 rounded-full ring-1 ring-line px-4 text-xs font-semibold text-ink-2" }: {
  action: () => Promise<CircuitResult>;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={`${className} disabled:opacity-50`}
        onClick={() => start(async () => {
          const result = await action();
          setFeedback({ ok: result.ok, text: result.ok ? result.message : result.error });
          if (result.ok) router.refresh();
        })}
      >
        {pending ? pendingLabel ?? "En cours…" : label}
      </button>
      {feedback && <span className={`text-xs ${feedback.ok ? "text-ink-3" : "font-semibold text-ink"}`} role={feedback.ok ? "status" : "alert"}>{feedback.text}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Circuits à structures (producteurs, associations…)                  *
 * ------------------------------------------------------------------ */

/**
 * Le vocabulaire du catalogue.
 *
 * Ces formulaires ne sont montés que pour un circuit à fiches. Si un circuit
 * sans catalogue les appelait un jour, on veut le savoir ici et pas en ligne.
 */
export function catalogueWords(circuit: Circuit) {
  if (!circuit.catalogue) throw new Error(`Le circuit « ${circuit.key} » n'a pas de catalogue.`);
  return circuit.catalogue;
}

export function StructureForm({ circuit, existing }: { circuit: Circuit; existing: boolean }) {
  const catalogue = catalogueWords(circuit);
  const state = useCircuitAction(createCircuitStructure);
  return (
    <form onSubmit={state.submit} className="space-y-4">
      <input type="hidden" name="circuit" value={circuit.key} />
      <div>
        <label className={fieldLabel} htmlFor="circuit-name">{catalogue.entryLabel}</label>
        <input id="circuit-name" name="name" required minLength={3} maxLength={160} placeholder={catalogue.entryPlaceholder} className={`mt-1 ${field}`} />
      </div>
      <div>
        <label className={fieldLabel} htmlFor="circuit-description">À savoir en deux phrases</label>
        <textarea id="circuit-description" name="description" rows={3} maxLength={600} placeholder={catalogue.descriptionHint} className={`mt-1 ${field}`} />
      </div>
      <PlaceFields communeId="circuit-city" />
      <div>
        <label className={fieldLabel} htmlFor="circuit-phone">Téléphone (facultatif)</label>
        <input id="circuit-phone" name="phone" maxLength={30} inputMode="tel" placeholder="Laissez vide pour ne le donner qu'aux personnes intéressées" className={`mt-1 ${field}`} />
      </div>
      <p className="rounded-card bg-muted p-3 text-xs text-ink-2">
        Votre fiche est visible par tous, avec votre commune seulement. Vous ajoutez ensuite ce que vous proposez, {catalogue.catalogueLabel.toLowerCase()}. Vous pourrez la retirer à tout moment.
        {existing && " Une fiche à votre nom existe déjà : celle-ci sera une fiche supplémentaire."}
      </p>
      <Message value={state.feedback} />
      <PrimaryButton type="submit" disabled={state.pending}>{state.pending ? "Enregistrement…" : circuit.deposit.label}</PrimaryButton>
    </form>
  );
}

export function ItemForm({ circuit, structureId }: { circuit: Circuit; structureId: number }) {
  const catalogue = catalogueWords(circuit);
  const state = useCircuitAction(createCircuitItem);
  return (
    <form onSubmit={state.submit} className="mt-3 space-y-3 rounded-card bg-muted p-4">
      <input type="hidden" name="structureId" value={structureId} />
      <p className="text-sm font-bold text-ink">Ajouter un {catalogue.itemSingular}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={fieldLabel} htmlFor={`item-name-${structureId}`}>Quoi ?</label>
          <input id={`item-name-${structureId}`} name="name" required minLength={2} maxLength={160} placeholder={catalogue.itemSingular === "produit" ? "Ex. Pommes de terre nouvelles" : "Ex. Atelier d'écriture"} className={`mt-1 ${field}`} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor={`item-category-${structureId}`}>Catégorie</label>
          <input id={`item-category-${structureId}`} name="category" maxLength={60} defaultValue={catalogue.defaultCategory} className={`mt-1 ${field}`} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor={`item-price-${structureId}`}>{catalogue.priceLabel}</label>
          <input id={`item-price-${structureId}`} name="price" type="number" min={0} max={9999} step="0.01" defaultValue={0} required className={`mt-1 ${field}`} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor={`item-unit-${structureId}`}>Unité</label>
          <input id={`item-unit-${structureId}`} name="unit" maxLength={30} defaultValue="l'unité" placeholder={catalogue.unitPlaceholder} className={`mt-1 ${field}`} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor={`item-stock-${structureId}`}>Quantité disponible</label>
          <input id={`item-stock-${structureId}`} name="stock" type="number" min={0} max={9999} defaultValue={1} required className={`mt-1 ${field}`} />
        </div>
      </div>
      <Message value={state.feedback} />
      <SecondaryButton type="submit" disabled={state.pending} className="!px-3 !py-2 text-xs">{state.pending ? "Ajout…" : "Ajouter à ma fiche"}</SecondaryButton>
    </form>
  );
}

export function DeleteStructureButton({ structureId }: { structureId: number }) {
  return (
    <ActionButton
      label="Retirer ma fiche"
      pendingLabel="Retrait…"
      action={() => deleteCircuitStructure(structureId)}
    />
  );
}

export function DeleteItemButton({ itemId }: { itemId: number }) {
  return <ActionButton label="Retirer" pendingLabel="…" className="text-xs font-semibold text-ink underline" action={() => deleteCircuitItem(itemId)} />;
}

export function OrderForm({ circuit, item, onDone }: {
  circuit: Circuit;
  item: { id: number; name: string; unit: string; stock: number };
  onDone?: () => void;
}) {
  const state = useCircuitAction(createCircuitOrder, onDone);
  return (
    <form onSubmit={state.submit} className="mt-3 space-y-3 rounded-card bg-muted p-4">
      <input type="hidden" name="productId" value={item.id} />
      <input type="hidden" name="circuit" value={circuit.key} />
      <p className="text-sm font-bold text-ink">{catalogueWords(circuit).orderLabel} · {item.name}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabel} htmlFor={`order-qty-${item.id}`}>Quantité · {item.unit}</label>
          <input id={`order-qty-${item.id}`} name="quantity" type="number" min={1} max={Math.min(99, Math.max(item.stock, 1))} defaultValue={1} required className={`mt-1 ${field}`} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor={`order-pickup-${item.id}`}>{circuit.words.dateLabel} (facultatif)</label>
          <input id={`order-pickup-${item.id}`} name="pickupAt" type="datetime-local" className={`mt-1 ${field}`} />
        </div>
      </div>
      <div>
        <label className={fieldLabel} htmlFor={`order-note-${item.id}`}>{circuit.words.orderNoteLabel}</label>
        <textarea id={`order-note-${item.id}`} name="note" rows={2} maxLength={300} placeholder={circuit.words.orderNoteHint} className={`mt-1 ${field}`} />
      </div>
      <p className="text-xs text-ink-3">{circuit.words.paymentNote}</p>
      <Message value={state.feedback} />
      <SecondaryButton type="submit" disabled={state.pending} className="!px-3 !py-2 text-xs">{state.pending ? "Envoi…" : "Envoyer ma demande"}</SecondaryButton>
    </form>
  );
}

export function OrderStatusButtons({ circuit, orderId }: { circuit: Circuit; orderId: number }) {
  const labels = circuit.words.statusLabels;
  return (
    <div className="mt-2 flex flex-wrap gap-3">
      <ActionButton label={labels.prete} pendingLabel="…" action={() => updateCircuitOrderStatus(orderId, "prete", circuit.key)} />
      <ActionButton label={labels.recuperee} pendingLabel="…" action={() => updateCircuitOrderStatus(orderId, "recuperee", circuit.key)} />
      <ActionButton label={labels.annulee} pendingLabel="…" className="text-xs font-semibold text-ink underline" action={() => updateCircuitOrderStatus(orderId, "annulee", circuit.key)} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Circuit des coups de main                                           *
 * ------------------------------------------------------------------ */

export function HandForm({ circuit, defaults }: {
  circuit: Circuit;
  defaults?: { city: string; postalCode: string; skills: string[]; note: string } | null;
}) {
  const state = useCircuitAction(setWorkerAvailability);
  const [selected, setSelected] = useState<string[]>(defaults?.skills ?? []);
  const toggle = (skill: string) => setSelected((prev) => (prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]));
  return (
    <form onSubmit={state.submit} className="space-y-4">
      <input type="hidden" name="circuit" value={circuit.key} />
      <fieldset>
        <legend className={fieldLabel}>Ce que je peux donner</legend>
        <p className="mt-1 text-xs text-ink-3">Choisissez jusqu&apos;à six mots que les gens cherchent vraiment.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SKILL_SUGGESTIONS.map((skill) => {
            const on = selected.includes(skill);
            return (
              <label key={skill} className={`cursor-pointer rounded-full ring-1 px-3 py-1.5 text-xs font-semibold ${on ? "bg-ink text-canvas ring-ink" : "bg-canvas text-ink-2 ring-line"}`}>
                <input type="checkbox" name="skills" value={skill} checked={on} onChange={() => toggle(skill)} className="sr-only" />
                {skill}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div>
        <label className={fieldLabel} htmlFor="hand-skills-libre">Autre savoir-faire (facultatif)</label>
        <input id="hand-skills-libre" name="skills" maxLength={60} placeholder="Ex. réparation de vélos" className={`mt-1 ${field}`} />
      </div>
      <PlaceFields communeId="hand-city" communeDefault={defaults?.city ?? ""} postalDefault={defaults?.postalCode ?? ""} />
      <div>
        <label className={fieldLabel} htmlFor="hand-note">Vos conditions, en un mot</label>
        <textarea id="hand-note" name="availabilityNote" rows={2} maxLength={400} defaultValue={defaults?.note ?? ""} placeholder="Ex. plutôt le samedi matin, dans un rayon de 20 km." className={`mt-1 ${field}`} />
      </div>
      <Message value={state.feedback} />
      <PrimaryButton type="submit" disabled={state.pending}>{state.pending ? "Enregistrement…" : circuit.deposit.label}</PrimaryButton>
    </form>
  );
}

export function HandToggle({ status }: { status: string }) {
  const next = status === "disponible" ? "indisponible" : "disponible";
  return (
    <ActionButton
      label={status === "disponible" ? "Suspendre ma disponibilité" : "Me rendre disponible"}
      pendingLabel="…"
      action={() => toggleWorkerAvailability(next)}
    />
  );
}
