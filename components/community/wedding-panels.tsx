"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  addWeddingBudgetItem,
  addWeddingGuest,
  assignWeddingGuestTable,
  createWeddingTable,
  deleteWeddingTable,
  removeWeddingBudgetItem,
  removeWeddingGuest,
  setWeddingBudgetActual,
  setWeddingEnvelope,
  setWeddingGuestStatus,
  updateWeddingGuest,
  updateWeddingTable,
  type WeddingResult,
} from "@/lib/actions/wedding";
import {
  BUDGET_CATEGORIES,
  GUEST_GROUPS,
  GUEST_STATUSES,
  MESSAGE_TEMPLATES,
  budgetCategoryLabel,
  buildCatererSummary,
  buildMessage,
  formatEuro,
  guestGroupLabel,
  guestStatusLabel,
  type BudgetStats,
  type GuestStats,
  type TableStats,
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

/** Texte préparé à relire puis à copier ou télécharger : AIME® ne l'envoie jamais à la place des mariés. */
function CopyText({ text, filename }: { text: string; filename: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <span className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void copy()} className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-900">{copied ? "Copié ✓" : "Copier le texte"}</button>
      <button type="button" onClick={download} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">Télécharger (.txt)</button>
    </span>
  );
}

type GuestView = { id: number; name: string; persons: number; groupe: string; status: string; note: string; tableId?: number | null };

const STATUS_STYLE: Record<string, string> = {
  a_inviter: "bg-slate-100 text-slate-700",
  invite: "bg-amber-50 text-amber-800",
  confirme: "bg-emerald-50 text-emerald-800",
  peut_etre: "bg-sky-50 text-sky-800",
  decline: "bg-rose-50 text-rose-700",
};

export function WeddingGuestsPanel({ projectId, guests, stats, invitesEstimes, weddingDate, weddingLieu, isOrganizer, open }: {
  projectId: number;
  guests: GuestView[];
  stats: GuestStats;
  invitesEstimes: number;
  weddingDate: string;
  weddingLieu: string;
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
      {isOrganizer && stats.confirmees > 0 && (
        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
          <h3 className="text-sm font-bold text-slate-900">Pour le traiteur : le résumé des convives</h3>
          <p className="mt-1 text-xs text-slate-600">Préparé depuis vos confirmés et leurs notes (enfants, régimes, arrivées). Relisez-le, puis envoyez-le par vos propres moyens : AIME® ne contacte aucun prestataire à votre place.</p>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs leading-relaxed text-slate-700 ring-1 ring-slate-200">{buildCatererSummary({ dateIso: weddingDate, lieu: weddingLieu, confirmes: guests.filter((g) => g.status === "confirme").map((g) => ({ name: g.name, persons: g.persons, note: g.note })), enAttentePersonnes: stats.enAttente, invitesEstimes })}</pre>
          <div className="mt-2"><CopyText text={buildCatererSummary({ dateIso: weddingDate, lieu: weddingLieu, confirmes: guests.filter((g) => g.status === "confirme").map((g) => ({ name: g.name, persons: g.persons, note: g.note })), enAttentePersonnes: stats.enAttente, invitesEstimes })} filename="convives-mariage.txt" /></div>
        </div>
      )}

      {isOrganizer && (
        <RelanceBlock weddingDate={weddingDate} enAttenteFoyers={guests.filter((g) => g.status === "invite" || g.status === "peut_etre").length} />
      )}
      <div className="mt-3"><Note value={fb} /></div>
    </div>
  );
}

/** Modèles de relance à copier : le message part par les canaux des mariés, jamais par AIME®. */
function RelanceBlock({ weddingDate, enAttenteFoyers }: { weddingDate: string; enAttenteFoyers: number }) {
  const [templateId, setTemplateId] = useState<string>(MESSAGE_TEMPLATES[0].id);
  const text = buildMessage(templateId, weddingDate);
  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-900">Relancer les invités sans réponse</h3>
      <p className="mt-1 text-xs text-slate-600">{enAttenteFoyers} foyer(s) encore sans réponse définitive. Choisissez un modèle, personnalisez les crochets, puis envoyez-le par vos canaux habituels (SMS, messagerie, courriel) : c&apos;est vous qui écrivez à vos invités.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choisir un modèle de relance">
        {MESSAGE_TEMPLATES.map((t) => (
          <button key={t.id} type="button" onClick={() => setTemplateId(t.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${templateId === t.id ? "bg-emerald-800 text-white" : "border border-slate-300 bg-white text-slate-700"}`}>{t.title}</button>
        ))}
      </div>
      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 ring-1 ring-slate-200">{text}</pre>
      <div className="mt-2"><CopyText text={text} filename="relance-invites.txt" /></div>
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

type TableView = { id: number; name: string; capacity: number | null };

export function WeddingTablesPanel({ projectId, tables, guests, stats, isOrganizer, open }: {
  projectId: number;
  tables: TableView[];
  guests: GuestView[];
  stats: TableStats;
  isOrganizer: boolean;
  open: boolean;
}) {
  const { fb, pending, run } = useRun();
  const [tableName, setTableName] = useState("");
  const [tableCapacity, setTableCapacity] = useState("");
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [choice, setChoice] = useState<Record<number, number>>({});
  const editable = isOrganizer && open;

  const confirmes = guests.filter((g) => g.status === "confirme");
  const aPlacer = confirmes.filter((g) => !tables.some((t) => t.id === g.tableId));
  const parTable = new Map(stats.parTable.map((t) => [t.tableId, t]));

  const startEditTable = (t: TableView) => {
    setEditingTableId(t.id);
    setTableName(t.name);
    setTableCapacity(t.capacity !== null ? String(t.capacity) : "");
  };
  const resetTableForm = () => {
    setEditingTableId(null);
    setTableName("");
    setTableCapacity("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{stats.placeesPersonnes} personne(s) placée(s)</span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{stats.aPlacerPersonnes} confirmée(s) à placer · {stats.aPlacerFoyers} foyer(s)</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{tables.length} table(s)</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">Seuls les foyers <strong>confirmés</strong> prennent place. Si un foyer décline ensuite, il quitte automatiquement sa table. La capacité est un repère : un dépassement s&apos;affiche, rien ne bloque — c&apos;est votre plan, pas un règlement.</p>

      {aPlacer.length > 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
          <h3 className="text-sm font-bold text-slate-900">À placer</h3>
          <ul className="mt-2 space-y-2">
            {aPlacer.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-2.5 text-sm ring-1 ring-slate-200">
                <span><strong>{g.name}</strong> <span className="text-xs text-slate-500">· {g.persons} personne(s) · {guestGroupLabel(g.groupe)}</span></span>
                {editable && tables.length > 0 && (
                  <span className="flex items-center gap-2">
                    <select aria-label={`Table pour ${g.name}`} value={choice[g.id] ?? tables[0].id} onChange={(e) => setChoice((c) => ({ ...c, [g.id]: Number(e.target.value) }))} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
                      {tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button type="button" disabled={pending} onClick={() => run(() => assignWeddingGuestTable(g.id, choice[g.id] ?? tables[0].id))} className="text-xs font-bold text-emerald-800 underline">Placer</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
          {tables.length === 0 && <p className="mt-2 text-xs text-slate-600">Créez d&apos;abord vos tables ci-dessous (table d&apos;honneur, familles, amis…).</p>}
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {tables.length === 0 && aPlacer.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucune table pour l&apos;instant. Le plan se dresse une fois le nombre de convives figé — il part des foyers confirmés de la liste ci-dessus.</li>}
        {tables.map((t) => {
          const st = parTable.get(t.id);
          const placed = confirmes.filter((g) => g.tableId === t.id);
          return (
            <li key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st?.depasse ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                  {st?.personnes ?? 0}{t.capacity !== null ? ` / ${t.capacity}` : ""} personne(s){st?.depasse ? " — au-delà de la capacité prévue" : ""}
                </span>
              </div>
              {placed.length === 0 ? <p className="mt-1 text-xs text-slate-500">Aucun foyer placé pour l&apos;instant.</p> : (
                <ul className="mt-2 space-y-1.5">
                  {placed.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm">
                      <span>{g.name} <span className="text-xs text-slate-500">· {g.persons} personne(s)</span></span>
                      {editable && <button type="button" disabled={pending} onClick={() => run(() => assignWeddingGuestTable(g.id, null))} className="text-xs font-semibold text-rose-700 underline">Retirer</button>}
                    </li>
                  ))}
                </ul>
              )}
              {editable && (
                <div className="mt-2 flex gap-3">
                  <button type="button" disabled={pending} onClick={() => startEditTable(t)} className="text-xs font-semibold text-emerald-800 underline">Renommer / capacité</button>
                  <button type="button" disabled={pending} onClick={() => run(() => deleteWeddingTable(t.id))} className="text-xs font-semibold text-rose-700 underline">Supprimer la table</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {editable && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingTableId) run(() => updateWeddingTable(editingTableId, tableName, tableCapacity), resetTableForm);
            else run(() => createWeddingTable(projectId, tableName, tableCapacity), resetTableForm);
          }}
          className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_150px_auto] sm:items-end"
        >
          <div><label className={label} htmlFor="wt-name">{editingTableId ? "Modifier la table" : "Nouvelle table"}</label><input id="wt-name" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="Ex. Table d'honneur, Les cousins, Collègues" className={input} /></div>
          <div><label className={label} htmlFor="wt-cap">Places (facultatif)</label><input id="wt-cap" value={tableCapacity} onChange={(e) => setTableCapacity(e.target.value)} placeholder="Ex. 8" className={input} /></div>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={pending || tableName.trim().length < 2}>{editingTableId ? "Enregistrer" : "Créer"}</PrimaryButton>
            {editingTableId && <SecondaryButton type="button" disabled={pending} onClick={resetTableForm}>Annuler</SecondaryButton>}
          </div>
        </form>
      )}
      <div className="mt-3"><Note value={fb} /></div>
    </div>
  );
}
