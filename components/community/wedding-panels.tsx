"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  addWeddingBudgetItem,
  addWeddingGuest,
  removeWeddingBudgetItem,
  removeWeddingGuest,
  setWeddingBudgetActual,
  setWeddingEnvelope,
  setWeddingGuestStatus,
  updateWeddingGuest,
  type WeddingResult,
} from "@/lib/actions/wedding";
import {
  BUDGET_CATEGORIES,
  GUEST_GROUPS,
  GUEST_STATUSES,
  budgetCategoryLabel,
  formatEuro,
  guestGroupLabel,
  guestStatusLabel,
  type BudgetStats,
  type GuestStats,
} from "@/lib/wedding";

const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400";
const label = "block text-sm font-semibold text-slate-700";
type Fb = { ok: boolean; text: string } | null;

function Note({ value }: { value: Fb }) {
  if (!value) return null;
  return <p role={value.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-xs ${value.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{value.text}</p>;
}

function useRun() {
  const [fb, setFb] = useState<Fb>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<WeddingResult>, after?: (r: WeddingResult) => void) =>
    start(async () => {
      const r = await fn();
      setFb({ ok: r.ok, text: r.ok ? r.message : r.error });
      if (r.ok) {
        router.refresh();
        after?.(r);
      }
    });
  return { fb, pending, run };
}

type GuestView = { id: number; name: string; persons: number; groupe: string; status: string; note: string };

const STATUS_STYLE: Record<string, string> = {
  a_inviter: "bg-slate-100 text-slate-700",
  invite: "bg-amber-50 text-amber-800",
  confirme: "bg-emerald-50 text-emerald-800",
  peut_etre: "bg-sky-50 text-sky-800",
  decline: "bg-rose-50 text-rose-700",
};

export function WeddingGuestsPanel({ projectId, guests, stats, invitesEstimes, isOrganizer, open }: {
  projectId: number;
  guests: GuestView[];
  stats: GuestStats;
  invitesEstimes: number;
  isOrganizer: boolean;
  open: boolean;
}) {
  const { fb, pending, run } = useRun();
  const [name, setName] = useState("");
  const [persons, setPersons] = useState(2);
  const [groupe, setGroupe] = useState("famille");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const editable = isOrganizer && open;

  const startEdit = (g: GuestView) => {
    setEditingId(g.id);
    setName(g.name);
    setPersons(g.persons);
    setGroupe(g.groupe);
    setNote(g.note);
  };
  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPersons(2);
    setGroupe("famille");
    setNote("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{stats.foyers} foyer(s) · {stats.personnesListees} personne(s) sur la liste</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{stats.confirmees} confirmée(s)</span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{stats.enAttente} en attente de réponse</span>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-800">{stats.aInviter} à inviter</span>
        {stats.declines > 0 && <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{stats.declines} ne viendront pas</span>}
        {invitesEstimes > 0 && <span className="rounded-full bg-white px-3 py-1 text-slate-500 ring-1 ring-slate-200">Estimation du parcours : ~{invitesEstimes} invités</span>}
      </div>
      <p className="mt-2 text-xs text-slate-500">Le nombre de <strong>personnes confirmées</strong> est celui qui partira au traiteur ou au restaurant trois semaines avant le mariage. Les réponses se notent ici, au fil de l&apos;eau : AIME® n&apos;envoie aucune relance à votre place.</p>

      <ul className="mt-4 space-y-2">
        {guests.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucun invité pour l&apos;instant. Commencez par les deux familles, puis les témoins, puis les amis : foyer par foyer, avec le nombre de personnes.</li>}
        {guests.map((g) => (
          <li key={g.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{g.name} <span className="text-xs font-normal text-slate-500">· {g.persons} personne(s) · {guestGroupLabel(g.groupe)}</span></p>
                {g.note && <p className="text-xs text-slate-500">{g.note}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[g.status] ?? STATUS_STYLE.a_inviter}`}>{guestStatusLabel(g.status)}</span>
            </div>
            {editable && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select aria-label={`Réponse de ${g.name}`} value={g.status} disabled={pending} onChange={(e) => run(() => setWeddingGuestStatus(g.id, e.target.value))} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
                  {GUEST_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button type="button" disabled={pending} onClick={() => startEdit(g)} className="text-xs font-semibold text-emerald-800 underline">Modifier</button>
                <button type="button" disabled={pending} onClick={() => run(() => removeWeddingGuest(g.id))} className="text-xs font-semibold text-rose-700 underline">Retirer</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editable && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) run(() => updateWeddingGuest(editingId, name, persons, groupe, note), resetForm);
            else run(() => addWeddingGuest(projectId, name, persons, groupe, note), resetForm);
          }}
          className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_110px_1fr_auto] sm:items-end"
        >
          <div><label className={label} htmlFor="wg-name">{editingId ? "Modifier le foyer" : "Ajouter un foyer"}</label><input id="wg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Famille Bernard — Claire et Hugo" className={input} /></div>
          <div><label className={label} htmlFor="wg-persons">Personnes</label><input id="wg-persons" type="number" min={1} max={20} value={persons} onChange={(e) => setPersons(Number(e.target.value))} className={input} /></div>
          <div><label className={label} htmlFor="wg-group">Cercle</label><select id="wg-group" value={groupe} onChange={(e) => setGroupe(e.target.value)} className={input}>{GUEST_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select></div>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={pending || name.trim().length < 2}>{editingId ? "Enregistrer" : "Ajouter"}</PrimaryButton>
            {editingId && <SecondaryButton type="button" disabled={pending} onClick={resetForm}>Annuler</SecondaryButton>}
          </div>
          <div className="sm:col-span-4"><label className={label} htmlFor="wg-note">Note (facultatif)</label><input id="wg-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. 2 enfants, arrive la veille, régime sans gluten" className={input} /></div>
        </form>
      )}
      <div className="mt-3"><Note value={fb} /></div>
    </div>
  );
}

type BudgetItemView = { id: number; label: string; category: string; estimatedCents: number; actualCents: number | null; settled: boolean; note: string };

function BudgetItemRow({ item, editable, pending, run }: { item: BudgetItemView; editable: boolean; pending: boolean; run: ReturnType<typeof useRun>["run"] }) {
  const [actual, setActual] = useState(item.actualCents !== null ? String(item.actualCents / 100).replace(".", ",") : "");
  const [settled, setSettled] = useState(item.settled);
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{item.label}</p>
          <p className="text-xs text-slate-500">{budgetCategoryLabel(item.category)}{item.note ? ` · ${item.note}` : ""}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-slate-500">Estimé : <span className="font-semibold text-slate-800">{formatEuro(item.estimatedCents)}</span></p>
          <p className="text-slate-500">Confirmé : <span className="font-semibold text-slate-800">{formatEuro(item.actualCents)}</span>{item.settled && item.actualCents !== null ? <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Réglé</span> : null}</p>
        </div>
      </div>
      {editable && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input aria-label={`Montant confirmé pour ${item.label}`} value={actual} onChange={(e) => setActual(e.target.value)} placeholder="Devis confirmé, ex. 1 850" className="w-44 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" />
          <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={settled} onChange={(e) => setSettled(e.target.checked)} className="h-3.5 w-3.5" /> Réglé</label>
          <button type="button" disabled={pending} onClick={() => run(() => setWeddingBudgetActual(item.id, actual, settled))} className="text-xs font-semibold text-emerald-800 underline">Noter</button>
          <button type="button" disabled={pending} onClick={() => run(() => removeWeddingBudgetItem(item.id))} className="text-xs font-semibold text-rose-700 underline">Retirer</button>
        </div>
      )}
    </li>
  );
}

export function WeddingBudgetPanel({ projectId, items, stats, isOrganizer, open }: {
  projectId: number;
  items: BudgetItemView[];
  stats: BudgetStats;
  isOrganizer: boolean;
  open: boolean;
}) {
  const { fb, pending, run } = useRun();
  const [labelText, setLabelText] = useState("");
  const [category, setCategory] = useState("divers");
  const [estimated, setEstimated] = useState("");
  const [noteText, setNoteText] = useState("");
  const [envelope, setEnvelope] = useState(stats.enveloppeCents !== null ? String(stats.enveloppeCents / 100) : "");
  const editable = isOrganizer && open;
  const pct = stats.enveloppeCents ? Math.min(100, Math.round((stats.estimeCents / stats.enveloppeCents) * 100)) : null;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Estimé</p><p className="mt-1 text-lg font-bold text-slate-900">{formatEuro(stats.estimeCents)}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Devis confirmés</p><p className="mt-1 text-lg font-bold text-slate-900">{formatEuro(stats.confirmeCents)}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Déjà réglé</p><p className="mt-1 text-lg font-bold text-slate-900">{formatEuro(stats.regleCents)}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reste à régler</p><p className="mt-1 text-lg font-bold text-slate-900">{formatEuro(stats.resteAReglerCents)}</p></div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">Enveloppe globale : {stats.enveloppeCents !== null ? formatEuro(stats.enveloppeCents) : "non définie"}</p>
          {stats.ecartEnveloppeCents !== null && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stats.depasseEnveloppe ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>
              {stats.depasseEnveloppe ? `Dépassement estimé : ${formatEuro(-stats.ecartEnveloppeCents)}` : `Marge restante : ${formatEuro(stats.ecartEnveloppeCents)}`}
            </span>
          )}
        </div>
        {pct !== null && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${stats.depasseEnveloppe ? "bg-rose-400" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} /></div>}
        {editable ? (
          <form onSubmit={(e) => { e.preventDefault(); run(() => setWeddingEnvelope(projectId, envelope)); }} className="mt-2 flex flex-wrap items-center gap-2">
            <input aria-label="Enveloppe globale en euros" value={envelope} onChange={(e) => setEnvelope(e.target.value)} placeholder="Ex. 12 000" className="w-40 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" />
            <span className="text-xs text-slate-500">€</span>
            <button type="submit" disabled={pending} className="text-xs font-semibold text-emerald-800 underline">Enregistrer l&apos;enveloppe</button>
          </form>
        ) : (
          <p className="mt-1 text-xs text-slate-500">C&apos;est le repère que vous vous êtes fixé : ni un droit, ni un plafond imposé — un outil pour arbitrer tôt.</p>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {items.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucun poste pour l&apos;instant. Notez chaque poste dès le premier devis : lieu, repas, musique, photo… Le confirmé remplacera peu à peu l&apos;estimé.</li>}
        {items.map((i) => <BudgetItemRow key={i.id} item={i} editable={editable} pending={pending} run={run} />)}
      </ul>
      <p className="mt-2 text-xs text-slate-500">AIME® ne perçoit ni ne verse aucun paiement : « réglé » est une simple case de votre carnet de bord, à cocher quand vous avez payé par vos propres moyens.</p>

      {editable && (
        <form
          onSubmit={(e) => { e.preventDefault(); run(() => addWeddingBudgetItem(projectId, labelText, category, estimated, noteText), () => { setLabelText(""); setEstimated(""); setNoteText(""); }); }}
          className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_150px_auto] sm:items-end"
        >
          <div><label className={label} htmlFor="wb-label">Nouveau poste</label><input id="wb-label" value={labelText} onChange={(e) => setLabelText(e.target.value)} placeholder="Ex. Traiteur — menu et service" className={input} /></div>
          <div><label className={label} htmlFor="wb-cat">Catégorie</label><select id="wb-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={input}>{BUDGET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          <div><label className={label} htmlFor="wb-est">Estimé (€)</label><input id="wb-est" value={estimated} onChange={(e) => setEstimated(e.target.value)} placeholder="Ex. 4 500" className={input} /></div>
          <PrimaryButton type="submit" disabled={pending || labelText.trim().length < 2 || estimated.trim() === ""}>Ajouter</PrimaryButton>
          <div className="sm:col-span-4"><label className={label} htmlFor="wb-note">Note (facultatif)</label><input id="wb-note" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ex. devis demandé à deux traiteurs, réponse avant fin du mois" className={input} /></div>
        </form>
      )}
      <div className="mt-3"><Note value={fb} /></div>
    </div>
  );
}
