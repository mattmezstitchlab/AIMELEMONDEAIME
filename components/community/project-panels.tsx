"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  addProjectNeed,
  createProject,
  decideProjectMember,
  postProjectMessage,
  removeProjectNeed,
  requestToJoinProject,
  saveProjectProgram,
  setProjectStatus,
  uploadProjectDocument,
  type ProjectResult,
} from "@/lib/actions/projects";
import { reportPublicContent } from "@/lib/actions/moderation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { RequestButton } from "@/components/community/forms";
import { priceLabel } from "@/components/community/community-app";
import { LISTING_CATEGORIES, NEED_STATUS_LABELS, UNIVERSES } from "@/lib/lma";

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
  const run = (fn: () => Promise<ProjectResult>, after?: (r: ProjectResult) => void) =>
    start(async () => {
      const r = await fn();
      setFb({ ok: r.ok, text: r.ok ? r.message : r.error });
      if (r.ok) router.refresh();
      after?.(r);
    });
  return { fb, pending, run };
}

const toLocalInput = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 16) : "");

export function ProjectForm({ coords }: { coords: { lat: number; lng: number } | null }) {
  const { fb, pending, run } = useRun();
  const router = useRouter();
  const [universes, setUniverses] = useState<string[]>(["terre"]);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (coords) { form.set("lat", String(coords.lat)); form.set("lng", String(coords.lng)); }
    run(() => createProject(form), (r) => { if (r.ok && r.id) router.push(`/le-monde-aime/projets/${r.id}`); });
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <strong>Un projet</strong> rassemble une intention, un lieu, des dates, des besoins et les contributions de chacun. Exemples : une fête au village, un jardin partagé, la préparation d&apos;un mariage.
      </div>
      <div><label className={label} htmlFor="pj-title">Nom du projet</label><input id="pj-title" name="title" required minLength={4} maxLength={140} placeholder="Ex. Fête d'été à la ferme" className={input} /></div>
      <div><label className={label} htmlFor="pj-intention">Intention</label><textarea id="pj-intention" name="intention" required minLength={10} maxLength={800} rows={3} placeholder="Pourquoi, avec qui, pour qui ?" className={input} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className={label} htmlFor="pj-city">Commune</label><input id="pj-city" name="city" required minLength={2} className={input} /></div>
        <div><label className={label} htmlFor="pj-start">Début</label><input id="pj-start" name="startsAt" type="datetime-local" required className={input} /></div>
        <div><label className={label} htmlFor="pj-end">Fin (facultatif)</label><input id="pj-end" name="endsAt" type="datetime-local" className={input} /></div>
      </div>
      <fieldset><legend className="mb-1 text-sm font-semibold text-slate-800">Univers concernés</legend>
        <div className="flex flex-wrap gap-2">{UNIVERSES.map((u) => { const on = universes.includes(u.key); return <label key={u.key} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-emerald-700 bg-emerald-800 text-white" : "border-slate-300 bg-white text-slate-700"}`}><input type="checkbox" name="universes" value={u.key} checked={on} onChange={() => setUniverses((p) => (p.includes(u.key) ? p.filter((k) => k !== u.key) : [...p, u.key]))} className="sr-only" />{u.label}</label>; })}</div>
      </fieldset>
      {!coords && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Choisissez d&apos;abord le lieu approximatif sur la carte ci-dessus.</p>}
      <p className="text-xs text-slate-500">Les activités pour enfants s&apos;organisent via les responsables légaux ou une structure encadrante.</p>
      <Note value={fb} />
      <PrimaryButton type="submit" disabled={pending || !coords}>{pending ? "Création…" : "Créer le projet"}</PrimaryButton>
    </form>
  );
}

const STATUS_STYLE: Record<string, string> = { recherche: "bg-amber-50 text-amber-800", propose: "bg-sky-50 text-sky-800", confirme: "bg-emerald-50 text-emerald-800" };

type NeedView = { id: number; text: string; quantity: number; category: string; status: string; contribution: { title: string; quantity: number; ownerName: string; requestStatus: string } | null };
type Suggestion = { needId: number; listing: { id: number; title: string; action: string; quantity: number; unit: string; city: string; ownerName: string; distance: number; priceMode: string; price: string | null } };

export function NeedsPanel({ projectId, needs, suggestions, isOrganizer, open, startsAt, endsAt }: { projectId: number; needs: NeedView[]; suggestions: Suggestion[]; isOrganizer: boolean; open: boolean; startsAt: Date | string; endsAt: Date | string | null }) {
  const { fb, pending, run } = useRun();
  const [text, setText] = useState("");
  const [qty, setQty] = useState(1);
  const [category, setCategory] = useState("objets_materiel");
  return (
    <div>
      <ul className="space-y-3">
        {needs.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucun besoin pour l&apos;instant.</li>}
        {needs.map((n) => (
          <li key={n.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="font-semibold text-slate-900">{n.quantity} × {n.text}</p><p className="text-xs text-slate-500">{LISTING_CATEGORIES.find((c) => c.value === n.category)?.label ?? "Trajet"}</p></div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[n.status]}`}>{NEED_STATUS_LABELS[n.status]}</span>
            </div>
            {n.contribution && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">{n.status === "confirme" ? "Confirmé par son propriétaire" : "Proposé — en attente de réponse du propriétaire"} : <strong>{n.contribution.title}</strong> ({n.contribution.quantity}) · {n.contribution.ownerName}</p>}
            {n.status === "propose" && !n.contribution && <p className="mt-2 text-xs text-slate-500">Une proposition est en attente de réponse du propriétaire.</p>}
            {isOrganizer && open && n.status === "recherche" && (
              <div className="mt-3 space-y-2">
                {suggestions.filter((s) => s.needId === n.id).length > 0 && <p className="text-xs font-semibold text-slate-700">Propositions proches qui pourraient convenir :</p>}
                {suggestions.filter((s) => s.needId === n.id).map(({ listing }) => (
                  <div key={listing.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{listing.title} <span className="text-xs font-normal text-slate-500">· {listing.ownerName} · {listing.city} ({listing.distance} km) · {priceLabel({ priceMode: listing.priceMode, price: listing.price, action: listing.action })}</span></p>
                    <RequestButton listing={listing} projectNeedId={n.id} defaultQuantity={n.quantity} defaultStart={toLocalInput(startsAt)} defaultEnd={toLocalInput(endsAt ?? startsAt)} label="Demander pour le projet" />
                  </div>
                ))}
                <button type="button" disabled={pending} onClick={() => run(() => removeProjectNeed(n.id))} className="text-xs font-semibold text-rose-700 underline">Retirer ce besoin</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">« Recherché » : rien n&apos;est trouvé. « Proposé » : une demande est faite. « Confirmé » : le propriétaire a accepté. Aucune ressource n&apos;est réservée sans son accord.</p>
      {isOrganizer && open && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => addProjectNeed(projectId, text, qty, category), (r) => { if (r.ok) setText(""); }); }} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_90px_1fr_auto] sm:items-end">
          <div><label className={label} htmlFor="need-text">Ajouter un besoin</label><input id="need-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex. tables pliantes, sono, atelier couture" className={input} /></div>
          <div><label className={label} htmlFor="need-qty">Qté</label><input id="need-qty" type="number" min={1} max={999} value={qty} onChange={(e) => setQty(Number(e.target.value))} className={input} /></div>
          <div><label className={label} htmlFor="need-cat">Catégorie</label><select id="need-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={input}>{LISTING_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}<option value="trajets_livraisons">Trajets et livraisons</option></select></div>
          <PrimaryButton type="submit" disabled={pending || text.trim().length < 2}>Ajouter</PrimaryButton>
        </form>
      )}
      <div className="mt-3"><Note value={fb} /></div>
    </div>
  );
}

export function JoinPanel({ projectId, viewer, loggedIn, isMemberRole }: { projectId: number; viewer: { isMember: boolean; pending: boolean; refused: boolean }; loggedIn: boolean; isMemberRole: boolean }) {
  const { fb, pending, run } = useRun();
  if (viewer.isMember) return <p className="text-sm font-semibold text-emerald-800">Vous participez à ce projet.</p>;
  if (viewer.pending) return <p className="text-sm text-slate-600">Votre demande de participation attend la réponse des organisateurs.</p>;
  if (viewer.refused) return <p className="text-sm text-slate-600">Votre demande n&apos;a pas été retenue.</p>;
  if (!loggedIn) return <a href="/connexion" className="text-sm font-bold text-emerald-800 underline">Connectez-vous pour participer</a>;
  if (!isMemberRole) return <p className="text-sm text-slate-600">Seuls les comptes membres peuvent participer.</p>;
  return <div className="space-y-2"><PrimaryButton type="button" disabled={pending} onClick={() => run(() => requestToJoinProject(projectId))}>Demander à participer</PrimaryButton><Note value={fb} /></div>;
}

export function PendingMembers({ projectId, pendingMembers }: { projectId: number; pendingMembers: Array<{ userId: number; name: string }> }) {
  const { fb, pending, run } = useRun();
  if (pendingMembers.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Demandes à traiter</p>
      {pendingMembers.map((m) => (
        <div key={m.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-2 text-sm"><span>{m.name}</span>
          <span className="flex gap-2"><PrimaryButton type="button" disabled={pending} onClick={() => run(() => decideProjectMember(projectId, m.userId, true))} className="!px-3 !py-1.5 text-xs">Accepter</PrimaryButton><SecondaryButton type="button" disabled={pending} onClick={() => run(() => decideProjectMember(projectId, m.userId, false))} className="!px-3 !py-1.5 text-xs">Refuser</SecondaryButton></span></div>
      ))}
      <Note value={fb} />
    </div>
  );
}

export function ProgramEditor({ projectId, program, editable }: { projectId: number; program: Array<{ time: string; label: string }>; editable: boolean }) {
  const { fb, pending, run } = useRun();
  const [rows, setRows] = useState(program.length ? program : [{ time: "", label: "" }]);
  if (!editable) {
    return program.length ? <ol className="space-y-2">{program.map((p, i) => <li key={i} className="flex gap-3 text-sm"><span className="w-24 shrink-0 font-semibold text-emerald-800">{p.time}</span><span className="text-slate-700">{p.label}</span></li>)}</ol> : <p className="text-sm text-slate-600">Le programme n&apos;est pas encore défini.</p>;
  }
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[110px_1fr_36px] gap-2">
          <input aria-label={`Horaire ${i + 1}`} value={r.time} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} placeholder="Sam. 15 h" className={input} maxLength={30} />
          <input aria-label={`Activité ${i + 1}`} value={r.label} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Ex. Concert dans la grange" className={input} maxLength={160} />
          <button type="button" aria-label="Retirer cette ligne" onClick={() => setRows((p) => p.filter((_, j) => j !== i))} className="mt-1 rounded-lg border border-slate-200 text-slate-500">−</button>
        </div>
      ))}
      <div className="flex gap-2"><SecondaryButton type="button" onClick={() => setRows((p) => [...p, { time: "", label: "" }])} className="!px-3 !py-2 text-xs">+ Ajouter une ligne</SecondaryButton><PrimaryButton type="button" disabled={pending} onClick={() => run(() => saveProjectProgram(projectId, rows))} className="!px-3 !py-2 text-xs">Enregistrer le programme</PrimaryButton></div>
      <Note value={fb} />
    </div>
  );
}

export function ProjectChat({ projectId, messages, userId }: { projectId: number; messages: Array<{ id: number; senderId: number; senderName: string; body: string; createdAt: Date | string }>; userId: number }) {
  const { fb, pending, run } = useRun();
  const [text, setText] = useState("");
  return (
    <div>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {messages.length === 0 && <p className="text-sm text-slate-600">Aucun message pour l&apos;instant.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`rounded-lg p-2 text-sm ${m.senderId === userId ? "ml-6 bg-emerald-50" : "mr-6 bg-slate-100"}`}>
            <strong className="text-xs">{m.senderId === userId ? "Vous" : m.senderName}</strong><p>{m.body}</p>
            <time className="text-[10px] text-slate-400">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(m.createdAt))}</time>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); run(() => postProjectMessage(projectId, text), (r) => { if (r.ok) setText(""); }); }} className="mt-3 space-y-2">
        <label htmlFor="pj-msg" className={label}>Message au groupe</label>
        <textarea id="pj-msg" value={text} onChange={(e) => setText(e.target.value)} maxLength={1200} rows={2} className={input} />
        <Note value={fb} /><PrimaryButton type="submit" disabled={pending || text.trim().length < 2} className="!px-3 !py-2 text-xs">Envoyer</PrimaryButton>
      </form>
    </div>
  );
}

export function DocumentsPanel({ projectId, documents, canUpload, isOrganizer }: { projectId: number; documents: Array<{ id: number; filename: string; sizeBytes: number; access: string }>; canUpload: boolean; isOrganizer: boolean }) {
  const { fb, pending, run } = useRun();
  return (
    <div>
      <ul className="space-y-2">
        {documents.length === 0 && <li className="text-sm text-slate-600">Aucun document.</li>}
        {documents.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-sm">
            <span>{d.filename} <span className="text-xs text-slate-500">· {Math.max(1, Math.round(d.sizeBytes / 1024))} Ko · {d.access === "organisateurs" ? "organisateurs" : "participants"}</span></span>
            <a href={`/api/projets/${projectId}/documents/${d.id}`} className="text-xs font-bold text-emerald-800 underline">Télécharger</a>
          </li>
        ))}
      </ul>
      {canUpload && (
        <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); f.set("projectId", String(projectId)); const el = e.currentTarget; run(() => uploadProjectDocument(f), (r) => { if (r.ok) el.reset(); }); }} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div><label className={label} htmlFor="pj-file">Ajouter un document (PDF, image, texte · 3 Mo)</label><input id="pj-file" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" className={input} /></div>
          <div><label className={label} htmlFor="pj-access">Visible par</label><select id="pj-access" name="access" className={input}><option value="membres">Les participants</option>{isOrganizer && <option value="organisateurs">Les organisateurs</option>}{!isOrganizer && <option value="organisateurs">Les organisateurs seulement</option>}</select></div>
          <PrimaryButton type="submit" disabled={pending}>Déposer</PrimaryButton>
        </form>
      )}
      <div className="mt-2"><Note value={fb} /></div>
    </div>
  );
}

export function StatusControl({ projectId, status }: { projectId: number; status: string }) {
  const { fb, pending, run } = useRun();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="pj-status" className="text-sm font-semibold text-slate-700">Statut du projet</label>
      <select id="pj-status" defaultValue={status} onChange={(e) => { if (window.confirm("Changer le statut du projet ?")) run(() => setProjectStatus(projectId, e.target.value as "ouvert" | "termine" | "annule")); }} disabled={pending} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="ouvert">Ouvert</option><option value="termine">Terminé</option><option value="annule">Annulé</option></select>
      <Note value={fb} />
    </div>
  );
}

export function ReportContent({ type, id }: { type: "projet" | "recit"; id: number }) {
  const [open, setOpen] = useState(false);
  const [fb, setFb] = useState<Fb>(null);
  const [pending, start] = useTransition();
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-slate-500 underline">Signaler ce contenu</button>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); start(async () => { const r = await reportPublicContent(type, id, String(f.get("reason")), String(f.get("details") ?? "")); setFb({ ok: r.ok, text: r.ok ? r.message : r.error }); if (r.ok) setOpen(false); }); }} className="space-y-2 rounded-lg bg-slate-50 p-3">
      <label htmlFor={`rp-${type}-${id}`} className="block text-xs font-semibold">Motif</label>
      <select id={`rp-${type}-${id}`} name="reason" className="w-full rounded-lg border border-slate-300 p-2 text-xs"><option value="contenu_inapproprie">Contenu inapproprié</option><option value="contenu_trompeur">Contenu trompeur</option><option value="atteinte_vie_privee">Atteinte à la vie privée</option><option value="mineur_en_danger">Mineur concerné</option><option value="autre">Autre</option></select>
      <input name="details" maxLength={500} placeholder="Précision facultative" className="w-full rounded-lg border border-slate-300 p-2 text-xs" />
      <Note value={fb} /><div className="flex gap-2"><button disabled={pending} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Envoyer</button><button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-600">Annuler</button></div>
    </form>
  );
}

export function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">{title}</h2>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}<div className="mt-4">{children}</div></section>;
}
