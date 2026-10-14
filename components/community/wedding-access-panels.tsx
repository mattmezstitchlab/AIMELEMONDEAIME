"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createWeddingAccessLink,
  createWeddingRsvpLink,
  revokeWeddingAccessLink,
  revokeWeddingRsvpLink,
  type CreateWeddingLinkResult,
  type WeddingAccessResult,
} from "@/lib/actions/wedding-access";
import type { WeddingAccessLinkSummary } from "@/lib/wedding-queries";
import type { WeddingAccessRole } from "@/db/schema";

const button = "rounded-control px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50";
const input = "rounded-control ring-1 ring-slate-300 bg-canvas px-3 py-2 text-sm text-slate-900";

type Feedback = { ok: boolean; text: string } | null;

function LinkField({ value, label, id }: { value: string; label: string; id: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="mt-3 rounded-control border ring-line bg-canvas p-3">
      <label className="block text-xs font-semibold text-slate-700" htmlFor={id}>{label}</label>
      <div className="mt-1 flex flex-wrap gap-2">
        <input id={id} readOnly value={value} onFocus={(event) => event.currentTarget.select()} className={`${input} min-w-0 flex-1 text-xs`} />
        <button type="button" onClick={() => void copy()} className={`${button} bg-ink text-canvas hover:bg-ink-2`}>{copied ? "Copié ✓" : "Copier le lien"}</button>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Ce lien secret s&apos;affiche une seule fois ici. Si vous le perdez, créez-en un nouveau : l&apos;ancien lien RSVP sera invalidé pour ce foyer.</p>
    </div>
  );
}

export function WeddingRsvpLinkButton({ guestId, guestName, expiresAt, active, canCreate, canRevoke }: {
  guestId: number;
  guestName: string;
  expiresAt: Date | null;
  active: boolean;
  canCreate: boolean;
  canRevoke: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [url, setUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function create() {
    startTransition(async () => {
      const result: CreateWeddingLinkResult = await createWeddingRsvpLink(guestId);
      if (!result.ok) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      setUrl(new URL(`/rsvp/${result.token}`, window.location.origin).toString());
      setFeedback({ ok: true, text: `Lien créé. Expire le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(result.expiresAt))}.` });
      router.refresh();
    });
  }

  function revoke() {
    if (!window.confirm(`Révoquer le lien de réponse de ${guestName} ?`)) return;
    startTransition(async () => {
      const result: WeddingAccessResult = await revokeWeddingRsvpLink(guestId);
      setFeedback({ ok: result.ok, text: result.ok ? result.message : result.error });
      if (result.ok) {
        setUrl("");
        router.refresh();
      }
    });
  }

  if (!canCreate && !(canRevoke && active)) return null;
  return (
    <div className="mt-3 border-t border-slate-100 pt-2">
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="text-xs font-semibold text-ink underline">
        {expanded ? "Fermer les options RSVP" : active ? "Gérer le lien RSVP" : "Créer un lien RSVP individuel"}
      </button>
      {expanded && (
        <div className="mt-2 rounded-control bg-slate-50 p-3">
          <p className="text-xs text-slate-600">Le foyer « {guestName} » pourra uniquement consulter et modifier sa propre réponse. Aucun nom des autres invités, note, budget ou document n&apos;est partagé.</p>
          {active && <p className="mt-2 text-xs font-semibold text-ink">Un lien est actif jusqu&apos;au {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(expiresAt!)}. Le lien secret existant n&apos;est pas récupérable après sa création.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {canCreate && <button type="button" disabled={pending} onClick={create} className={`${button} bg-ink text-canvas hover:bg-ink-2`}>{pending ? "Création…" : active ? "Renouveler et copier le lien" : "Créer et copier le lien"}</button>}
            {active && canRevoke && <button type="button" disabled={pending} onClick={revoke} className={`${button} border border-rose-300 bg-canvas text-rose-800`}>{pending ? "…" : "Révoquer"}</button>}
          </div>
          {feedback && <p role={feedback.ok ? "status" : "alert"} className={`mt-2 text-xs ${feedback.ok ? "text-ink" : "text-rose-700"}`}>{feedback.text}</p>}
          {url && <LinkField id={`rsvp-link-${guestId}`} value={url} label={`Lien RSVP de ${guestName}`} />}
        </div>
      )}
    </div>
  );
}

function roleDescription(role: WeddingAccessRole) {
  return role === "coordination"
    ? "Coordination — invités et programme modifiables"
    : "Témoin — programme et plan de table en lecture seule";
}

export function WeddingAccessLinksPanel({ projectId, links, open }: {
  projectId: number;
  links: WeddingAccessLinkSummary[];
  open: boolean;
}) {
  const [role, setRole] = useState<WeddingAccessRole>("coordination");
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState(30);
  const [url, setUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function create() {
    startTransition(async () => {
      const result: CreateWeddingLinkResult = await createWeddingAccessLink(projectId, role, label, duration);
      if (!result.ok) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      setUrl(new URL(`/invitation/mariage/${result.token}`, window.location.origin).toString());
      setFeedback({ ok: true, text: `${result.message} Expiration : ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(result.expiresAt))}.` });
      router.refresh();
    });
  }

  function revoke(id: number, linkLabel: string) {
    if (!window.confirm(`Révoquer le lien « ${linkLabel} » ? Toute session déjà ouverte sera également coupée.`)) return;
    startTransition(async () => {
      const result: WeddingAccessResult = await revokeWeddingAccessLink(id);
      setFeedback({ ok: result.ok, text: result.ok ? result.message : result.error });
      if (result.ok) {
        setUrl("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-bold">Partage ciblé, sans compte — et sans ouvrir l&apos;espace personnel</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
          <li>Coordination : consulter les foyers et modifier les réponses RSVP et le programme, dans ce seul mariage.</li>
          <li>Témoin : consulter le déroulé et le plan de table, sans modification.</li>
          <li>Ni les documents, échanges, budget, notes privées ni les autres espaces ne sont accessibles par ces liens.</li>
          <li>Les liens expirent et se révoquent ici. AIME® ne les envoie pas : copiez-les puis transmettez-les vous-même à la personne concernée.</li>
        </ul>
      </div>

      {open ? (
        <div className="rounded-card bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-900">Créer un accès pour un proche</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">Accès
              <select value={role} onChange={(event) => setRole(event.target.value as WeddingAccessRole)} className={`${input} mt-1 block w-full`}>
                <option value="coordination">Coordination (programme + réponses)</option>
                <option value="temoin">Témoin (lecture seule)</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">Nom repère (facultatif)
              <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} placeholder="Ex. Camille — témoin" className={`${input} mt-1 block w-full`} />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Le lien expire dans
              <select value={duration} onChange={(event) => setDuration(Number(event.target.value))} className={`${input} mt-1 block w-full sm:max-w-xs`}>
                <option value={7}>7 jours</option>
                <option value={30}>30 jours</option>
                <option value={90}>90 jours</option>
              </select>
            </label>
          </div>
          <button type="button" disabled={pending} onClick={create} className={`${button} mt-3 bg-ink text-canvas hover:bg-ink-2`}>{pending ? "Création…" : "Créer le lien secret"}</button>
          {feedback && <p role={feedback.ok ? "status" : "alert"} className={`mt-2 text-xs ${feedback.ok ? "text-ink" : "text-rose-700"}`}>{feedback.text}</p>}
          {url && <LinkField id={`access-link-${projectId}`} value={url} label="Lien secret pour le proche" />}
        </div>
      ) : <p className="rounded-control bg-slate-50 p-3 text-xs text-slate-600">Le projet est fermé : aucun nouveau lien ne peut être créé.</p>}

      <div>
        <h3 className="text-sm font-bold text-slate-900">Liens créés</h3>
        {links.length === 0 ? <p className="mt-2 text-xs text-slate-500">Aucun lien pour le moment.</p> : (
          <ul className="mt-2 space-y-2">
            {links.map((link) => {
              const inactive = !link.active;
              return (
                <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control ring-1 ring-line bg-canvas p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{link.label} <span className="text-xs font-normal text-slate-500">· {roleDescription(link.role)}</span></p>
                    <p className="text-xs text-slate-500">Expire le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(link.expiresAt)}</p>
                    <p className={`mt-1 text-[11px] font-bold ${inactive ? "text-slate-500" : "text-ink"}`}>{link.revokedAt ? "Révoqué" : link.active ? "Actif" : "Expiré"}</p>
                  </div>
                  {!inactive && <button type="button" disabled={pending} onClick={() => revoke(link.id, link.label)} className={`${button} border border-rose-300 bg-canvas text-rose-800`}>Révoquer</button>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
