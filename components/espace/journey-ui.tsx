"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addPersonalTask, advanceEngagement, attachTaskDocument, finalizeJourney, proposeEngagement, revokeShare, saveJourneyDraft,
  sendEngagementRequest, setJourneyStatus, setTaskReminder, setTaskStatus, shareDocument, updateJourneySummary, type JResult,
} from "@/lib/actions/journeys";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { ENGAGEMENT_STATUS_LABEL, FRAMEWORK_LABEL, TASK_STATUS_LABEL, type Question } from "@/lib/situations";

const input = "mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink";
const label = "block text-sm font-semibold text-ink-2";
type Fb = { ok: boolean; text: string } | null;
export function Note({ value }: { value: Fb }) {
  if (!value) return null;
  return <p role={value.ok ? "status" : "alert"} className={`rounded-control px-3 py-2 text-xs ${value.ok ? "bg-muted text-ink" : "bg-muted text-ink"}`}>{value.text}</p>;
}
function useRun() {
  const [fb, setFb] = useState<Fb>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<JResult>, after?: (r: JResult) => void) => start(async () => { const r = await fn(); setFb({ ok: r.ok, text: r.ok ? r.message : r.error }); if (r.ok) router.refresh(); after?.(r); });
  return { fb, pending, run };
}

/** Questionnaire progressif : une question à la fois, enregistrement à chaque étape, reprise possible. */
export function JourneyWizard({ situation, questions, initial, journeyId, projects }: { situation: string; questions: Question[]; initial: Record<string, string>; journeyId?: number; projects: Array<{ id: number; title: string }> }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [id, setId] = useState<number | undefined>(journeyId);
  const visibleQuestions = questions.filter((question) => !question.showWhen || answers[question.showWhen.key] === question.showWhen.value);
  const firstEmpty = visibleQuestions.findIndex((question) => !initial[question.key]);
  const [step, setStep] = useState(firstEmpty === -1 ? visibleQuestions.length : firstEmpty);
  const [projectChoice, setProjectChoice] = useState("new");
  const { fb, pending, run } = useRun();
  const q = visibleQuestions[step];
  const done = step >= visibleQuestions.length;

  function save(next: number) {
    run(() => saveJourneyDraft(situation, answers, id), (r) => { if (r.ok) { if (r.id) setId(r.id); setStep(next); } });
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle" aria-hidden="true"><div className="h-full rounded-full bg-ink-2 transition-all" style={{ width: `${(Math.min(step, visibleQuestions.length) / visibleQuestions.length) * 100}%` }} /></div><span className="text-xs font-semibold text-ink-3">{Math.min(step + 1, visibleQuestions.length)} / {visibleQuestions.length}</span></div>
      {!done && q && (
        <form onSubmit={(e) => { e.preventDefault(); if (q.required && !answers[q.key]) return; save(step + 1); }} className="space-y-3">
          <label id={`q-label-${q.key}`} htmlFor={q.type === "select" ? undefined : `q-${q.key}`} className="block text-lg font-bold text-ink">{q.label}{q.required ? "" : <span className="ml-2 text-xs font-normal text-ink-3">(facultatif)</span>}</label>
          {q.why && <p className="rounded-control bg-muted p-3 text-xs text-ink"><strong>Pourquoi cette question ?</strong> {q.why}</p>}
          {q.type === "select" ? (
            <div role="radiogroup" aria-labelledby={`q-label-${q.key}`} className="grid gap-2 sm:grid-cols-2">
              {q.options!.map(([v, t]) => <label key={v} className={`min-h-11 cursor-pointer rounded-card border p-3 text-sm focus-within:ring-2 focus-within:ring-line focus-within:ring-offset-2 ${answers[q.key] === v ? "ring-ink bg-muted font-semibold text-ink" : "border-line bg-canvas"}`}><input type="radio" name={q.key} value={v} checked={answers[q.key] === v} onChange={() => setAnswers((a) => ({ ...a, [q.key]: v }))} className="sr-only" />{t}</label>)}
            </div>
          ) : q.type === "textarea" ? (
            <textarea id={`q-${q.key}`} value={answers[q.key] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} rows={3} maxLength={600} className={input} />
          ) : (
            <input id={`q-${q.key}`} type={q.type === "number" ? "number" : q.type === "date" ? "date" : "text"} min={q.type === "number" ? 0 : undefined} value={answers[q.key] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} required={q.required} className={input} />
          )}
          {q.help && <p className="text-xs text-ink-3">{q.help}</p>}
          {situation === "famille" && answers.evenement === "deces" && <p role="status" className="rounded-control ring-1 ring-line bg-muted p-3 text-sm text-ink-2">Un décès a désormais son propre parcours, plus adapté à cette situation. <Link href="/espace/demarches/nouvelle?situation=deces_proche" className="font-bold text-ink underline">Ouvrir « Un proche est décédé »</Link>. Votre ancien brouillon reste conservé.</p>}
          <Note value={fb} />
          <div className="flex flex-wrap gap-2">
            {step > 0 && <SecondaryButton type="button" onClick={() => setStep(step - 1)}>Précédent</SecondaryButton>}
            <PrimaryButton type="submit" disabled={pending || (q.required && !answers[q.key]) || (situation === "famille" && answers.evenement === "deces")}>{pending ? "Enregistrement…" : "Continuer"}</PrimaryButton>
            {id && <button type="button" onClick={() => run(() => saveJourneyDraft(situation, answers, id), (r) => { if (r.ok) router.push("/espace/demarches"); })} className="text-sm font-semibold text-ink underline">Enregistrer et reprendre plus tard</button>}
          </div>
        </form>
      )}
      {done && (
        <div className="space-y-4">
          <p className="text-lg font-bold text-ink">Merci, c&apos;est suffisant pour préparer votre plan.</p>
          {(situation === "evenement" || situation === "mariage") && (
            <div><label htmlFor="pj-choice" className={label}>{situation === "mariage" ? "Projet du mariage" : "Projet de l’événement"}</label>
              <select id="pj-choice" value={projectChoice} onChange={(e) => setProjectChoice(e.target.value)} className={input}>
                <option value="new">Créer un nouveau projet partagé</option>
                {projects.map((p) => <option key={p.id} value={p.id}>Réutiliser : {p.title}</option>)}
              </select>
              <p className="mt-1 text-xs text-ink-3">Le projet rassemble programme, besoins et contributions. Vos réponses et documents personnels restent privés.</p>
            </div>
          )}
          <Note value={fb} />
          <div className="flex flex-wrap gap-2">
            <SecondaryButton type="button" onClick={() => setStep(visibleQuestions.length - 1)}>Revoir mes réponses</SecondaryButton>
            <PrimaryButton type="button" disabled={pending || !id} onClick={() => run(() => finalizeJourney(id!, projectChoice), (r) => { if (r.ok && r.id) router.push(`/espace/demarches/suivi/${r.id}`); })}>{pending ? "Préparation…" : "Préparer mon plan"}</PrimaryButton>
          </div>
          {!id && <p className="text-xs text-ink">Enregistrez au moins une réponse pour créer la démarche.</p>}
        </div>
      )}
    </div>
  );
}

export function SummaryEditor({ journeyId, summary }: { journeyId: number; summary: string }) {
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(summary);
  const { fb, pending, run } = useRun();
  if (!edit) return <div><p className="whitespace-pre-line text-sm text-ink-2">{summary || "Aucune synthèse."}</p><button type="button" onClick={() => setEdit(true)} className="mt-2 text-xs font-bold text-ink underline">Modifier la synthèse</button></div>;
  return <form onSubmit={(e) => { e.preventDefault(); run(() => updateJourneySummary(journeyId, text), (r) => { if (r.ok) setEdit(false); }); }} className="space-y-2"><label htmlFor="sum" className="sr-only">Synthèse</label><textarea id="sum" value={text} onChange={(e) => setText(e.target.value)} rows={6} maxLength={3000} className={input} /><Note value={fb} /><div className="flex gap-2"><PrimaryButton type="submit" disabled={pending} className="!px-3 !py-2 text-xs">Enregistrer</PrimaryButton><SecondaryButton type="button" onClick={() => setEdit(false)} className="!px-3 !py-2 text-xs">Annuler</SecondaryButton></div></form>;
}

export function TaskControls({ task, docs }: { task: { id: number; status: string; dueAt: string | null; dueKind: string | null; documentId: number | null; kind: string }; docs: Array<{ id: number; filename: string }> }) {
  const { fb, pending, run } = useRun();
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      <div><label htmlFor={`st-${task.id}`} className="text-xs font-semibold text-ink-3">Statut</label>
        <select id={`st-${task.id}`} defaultValue={task.status} disabled={pending} onChange={(e) => run(() => setTaskStatus(task.id, e.target.value))} className={input}>{Object.entries(TASK_STATUS_LABEL).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
      {task.dueKind !== "officielle" && <div><label htmlFor={`rp-${task.id}`} className="text-xs font-semibold text-ink-3">Rappel personnel</label><input id={`rp-${task.id}`} type="date" defaultValue={task.dueAt ? task.dueAt.slice(0, 10) : ""} disabled={pending} onChange={(e) => run(() => setTaskReminder(task.id, e.target.value))} className={input} /></div>}
      <div><label htmlFor={`dc-${task.id}`} className="text-xs font-semibold text-ink-3">Document relié (privé)</label>
        <select id={`dc-${task.id}`} defaultValue={task.documentId ?? ""} disabled={pending} onChange={(e) => run(() => attachTaskDocument(task.id, e.target.value ? Number(e.target.value) : null))} className={input}><option value="">Aucun</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.filename}</option>)}</select></div>
      <div className="sm:col-span-3"><Note value={fb} /></div>
    </div>
  );
}

export function AddTask({ journeyId }: { journeyId: number }) {
  const [text, setText] = useState("");
  const { fb, pending, run } = useRun();
  return <form onSubmit={(e) => { e.preventDefault(); run(() => addPersonalTask(journeyId, text), (r) => { if (r.ok) setText(""); }); }} className="mt-3 flex flex-wrap gap-2"><label htmlFor="add-task" className="sr-only">Ajouter une action</label><input id="add-task" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ajouter une action personnelle" className="min-w-0 flex-1 rounded-control ring-1 ring-line px-3 py-2 text-sm" /><PrimaryButton type="submit" disabled={pending || text.trim().length < 3} className="!px-3 !py-2 text-xs">Ajouter</PrimaryButton><div className="w-full"><Note value={fb} /></div></form>;
}

export function JourneyStatusButton({ journeyId, status }: { journeyId: number; status: string }) {
  const { fb, pending, run } = useRun();
  return <div className="flex flex-wrap items-center gap-2"><SecondaryButton type="button" disabled={pending} onClick={() => run(() => setJourneyStatus(journeyId, status === "terminee" ? "en_cours" : "terminee"))} className="!px-3 !py-2 text-xs">{status === "terminee" ? "Rouvrir la démarche" : "Marquer la démarche terminée"}</SecondaryButton><Note value={fb} /></div>;
}

export function SendToArtist({ journeyId, artistId, services }: { journeyId: number; artistId: number; services: Array<{ id: number; title: string }> }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [listing, setListing] = useState(services[0]?.id ? String(services[0].id) : "");
  const { fb, pending, run } = useRun();
  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)} className="!px-3 !py-2 text-xs">Envoyer une demande</PrimaryButton>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => sendEngagementRequest(journeyId, artistId, listing ? Number(listing) : null, msg), (r) => { if (r.ok) setOpen(false); }); }} className="mt-2 space-y-2 rounded-card bg-muted p-3">
      {services.length > 0 && <div><label htmlFor={`sv-${artistId}`} className="text-xs font-semibold text-ink-3">Prestation concernée</label><select id={`sv-${artistId}`} value={listing} onChange={(e) => setListing(e.target.value)} className={input}><option value="">Aucune en particulier</option>{services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>}
      <div><label htmlFor={`mg-${artistId}`} className="text-xs font-semibold text-ink-3">Message</label><textarea id={`mg-${artistId}`} value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} maxLength={800} className={input} placeholder="Présentez votre événement, la durée souhaitée…" /></div>
      <p className="text-xs text-ink-3">L&apos;artiste verra la date, la commune, les horaires, le public et vos besoins techniques. Pas votre budget.</p>
      <Note value={fb} /><div className="flex gap-2"><PrimaryButton type="submit" disabled={pending} className="!px-3 !py-2 text-xs">Envoyer</PrimaryButton><SecondaryButton type="button" onClick={() => setOpen(false)} className="!px-3 !py-2 text-xs">Annuler</SecondaryButton></div>
    </form>
  );
}

type Eng = { id: number; status: string; proposalMode: string | null; proposalAmount: string | null; proposalFramework: string | null; proposalNote: string | null; requestMessage: string; eventDate: string };

function proposalText(e: Eng) {
  if (!e.proposalMode) return null;
  const price = e.proposalMode === "gratuit" ? "Gratuit" : e.proposalMode === "devis" ? "Sur devis" : `${Number(e.proposalAmount).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`;
  return `${price} · ${FRAMEWORK_LABEL[e.proposalFramework ?? "inconnu"]}`;
}

/** Vue organisateur d’un engagement : chaque étape est distincte et explicitement attribuée. */
export function OrganizerEngagement({ e, artistName, docs }: { e: Eng; artistName: string; docs: Array<{ id: number; filename: string }> }) {
  const { fb, pending, run } = useRun();
  const [doc, setDoc] = useState("");
  const steps = ["demande_envoyee", "proposition_recue", "devis_accepte", "contrat_signe_declare", "embauche_declaree"];
  const idx = steps.indexOf(e.status);
  return (
    <div className="rounded-card ring-1 ring-line bg-canvas p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-ink">{artistName}</strong><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink-2">{ENGAGEMENT_STATUS_LABEL[e.status]}</span></div>
      <ol className="mt-3 grid gap-1 text-[11px] sm:grid-cols-5" aria-label="Étapes de l’engagement">{["Demande envoyée", "Proposition reçue", "Devis accepté", "Contrat signé (déclaré)", "Embauche déclarée"].map((t, i) => <li key={t} className={`rounded-md px-2 py-1 text-center ${idx >= i && idx >= 0 ? "bg-ink text-canvas" : "bg-muted text-ink-3"}`}>{t}</li>)}</ol>
      {proposalText(e) && <p className="mt-3 text-sm text-ink-2"><strong>Proposition :</strong> {proposalText(e)}{e.proposalNote ? ` — « ${e.proposalNote} »` : ""}</p>}
      {e.proposalFramework && <p className="mt-2 rounded-control bg-muted p-2 text-xs text-ink"><strong>Cadre à vérifier.</strong> {e.proposalFramework === "facture" ? "L’artiste indique pouvoir facturer. Pour le spectacle vivant, l’artiste rémunéré est présumé salarié : un Siret ne suffit pas à le confirmer." : e.proposalFramework === "salarie" ? "Un engagement salarié implique un contrat de travail et des déclarations, par exemple via le Guso si vous n’êtes pas un professionnel du spectacle." : "Le cadre n’est pas encore établi : clarifiez-le avec l’artiste."}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {e.status === "proposition_recue" && <><PrimaryButton type="button" disabled={pending} onClick={() => run(() => advanceEngagement(e.id, "accepter"))} className="!px-3 !py-2 text-xs">Accepter la proposition</PrimaryButton><SecondaryButton type="button" disabled={pending} onClick={() => run(() => advanceEngagement(e.id, "decliner"))} className="!px-3 !py-2 text-xs">Décliner</SecondaryButton></>}
        {e.status === "devis_accepte" && <div className="flex flex-wrap items-end gap-2"><div><label htmlFor={`ct-${e.id}`} className="text-xs font-semibold text-ink-3">Contrat (document privé, facultatif)</label><select id={`ct-${e.id}`} value={doc} onChange={(ev) => setDoc(ev.target.value)} className={input}><option value="">Sans document</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.filename}</option>)}</select></div><PrimaryButton type="button" disabled={pending} onClick={() => { if (window.confirm("Confirmez-vous que le contrat a été signé par les deux parties, en dehors d’AIME® ?")) run(() => advanceEngagement(e.id, "contrat", doc ? Number(doc) : null)); }} className="!px-3 !py-2 text-xs">Déclarer le contrat signé</PrimaryButton></div>}
        {e.status === "contrat_signe_declare" && e.proposalFramework !== "facture" && <PrimaryButton type="button" disabled={pending} onClick={() => { if (window.confirm("Confirmez-vous avoir déclaré l’embauche auprès de l’organisme compétent (par exemple le Guso) ? AIME® ne peut pas le vérifier.")) run(() => advanceEngagement(e.id, "embauche")); }} className="!px-3 !py-2 text-xs">Déclarer l&apos;embauche effectuée</PrimaryButton>}
        {["demande_envoyee", "proposition_recue", "devis_accepte"].includes(e.status) && <SecondaryButton type="button" disabled={pending} onClick={() => { if (window.confirm("Annuler cet engagement ?")) run(() => advanceEngagement(e.id, "annuler")); }} className="!px-3 !py-2 text-xs">Annuler</SecondaryButton>}
      </div>
      <div className="mt-2"><Note value={fb} /></div>
    </div>
  );
}

/** Vue artiste : répondre par une proposition ou décliner. */
export function ArtistEngagement({ e, organizerName, lieu, horaires, technique, publicSize }: { e: Eng; organizerName: string; lieu: string; horaires: string; technique: string; publicSize: string }) {
  const { fb, pending, run } = useRun();
  const [mode, setMode] = useState("devis");
  function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    run(() => proposeEngagement(e.id, mode, String(f.get("amount") ?? ""), String(f.get("framework") ?? ""), String(f.get("note") ?? "")));
  }
  return (
    <div className="rounded-card ring-1 ring-line p-4 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><strong>{organizerName} · {new Date(e.eventDate).toLocaleDateString("fr-FR")} · {lieu}</strong><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{ENGAGEMENT_STATUS_LABEL[e.status]}</span></div>
      <p className="mt-1 text-xs text-ink-3">{horaires && `Horaires : ${horaires} · `}{publicSize && `Public : ${publicSize} personnes · `}{technique && `Technique : ${technique}`}</p>
      {e.requestMessage && <p className="mt-2 text-ink-2">« {e.requestMessage} »</p>}
      {proposalText(e) && <p className="mt-2 text-ink-2"><strong>Votre proposition :</strong> {proposalText(e)}</p>}
      {e.status === "demande_envoyee" && (
        <form onSubmit={submit} className="mt-3 space-y-2 rounded-control bg-muted p-3">
          <fieldset><legend className="text-xs font-semibold text-ink-3">Votre proposition</legend><div className="mt-1 flex flex-wrap gap-2">{[["gratuit", "Gratuit"], ["montant", "Montant"], ["devis", "Sur devis"]].map(([v, t]) => <label key={v} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${mode === v ? "ring-ink bg-ink text-canvas" : "border-line bg-canvas"}`}><input type="radio" name="mode" checked={mode === v} onChange={() => setMode(v)} className="sr-only" />{t}</label>)}</div></fieldset>
          {mode === "montant" && <div><label htmlFor={`am-${e.id}`} className="text-xs font-semibold text-ink-3">Montant (€)</label><input id={`am-${e.id}`} name="amount" type="number" min={1} step="0.01" required className={input} /></div>}
          <div><label htmlFor={`fw-${e.id}`} className="text-xs font-semibold text-ink-3">Cadre d&apos;engagement</label><select id={`fw-${e.id}`} name="framework" defaultValue="inconnu" className={input}>{Object.entries(FRAMEWORK_LABEL).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
          <div><label htmlFor={`nt-${e.id}`} className="text-xs font-semibold text-ink-3">Message</label><textarea id={`nt-${e.id}`} name="note" rows={2} maxLength={800} className={input} /></div>
          <Note value={fb} /><div className="flex gap-2"><PrimaryButton type="submit" disabled={pending} className="!px-3 !py-2 text-xs">Envoyer ma proposition</PrimaryButton><SecondaryButton type="button" disabled={pending} onClick={() => run(() => advanceEngagement(e.id, "refuser"))} className="!px-3 !py-2 text-xs">Décliner</SecondaryButton></div>
        </form>
      )}
      {["proposition_recue", "devis_accepte"].includes(e.status) && <SecondaryButton type="button" disabled={pending} onClick={() => { if (window.confirm("Annuler votre participation ?")) run(() => advanceEngagement(e.id, "annuler")); }} className="mt-3 !px-3 !py-2 text-xs">Annuler ma participation</SecondaryButton>}
      {e.status !== "demande_envoyee" && <div className="mt-2"><Note value={fb} /></div>}
    </div>
  );
}

export function ShareControls({ documentId, shares, projects }: { documentId: number; shares: Array<{ id: number; to: string }>; projects: Array<{ id: number; title: string }> }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [project, setProject] = useState("");
  const { fb, pending, run } = useRun();
  return (
    <div className="mt-2 text-xs">
      {shares.length > 0 && <ul className="mb-2 space-y-1">{shares.map((s) => <li key={s.id} className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-ink">Partagé avec : {s.to}</span><button type="button" disabled={pending} onClick={() => run(() => revokeShare(s.id))} className="font-bold text-ink-2 underline">Révoquer</button></li>)}</ul>}
      {!open ? <button type="button" onClick={() => setOpen(true)} className="font-bold text-ink underline">Partager…</button> : (
        <div className="space-y-2 rounded-control bg-muted p-3">
          <p className="text-ink-3">Choisissez précisément qui peut ouvrir ce document. Vous pourrez révoquer l&apos;accès à tout moment.</p>
          <div className="flex flex-wrap gap-2"><label htmlFor={`se-${documentId}`} className="sr-only">E-mail</label><input id={`se-${documentId}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail d’une personne" className="min-w-0 flex-1 rounded-control ring-1 ring-line px-2 py-1.5" /><PrimaryButton type="button" disabled={pending || !email} onClick={() => run(() => shareDocument(documentId, { email }), (r) => { if (r.ok) setEmail(""); })} className="!px-3 !py-1.5 text-xs">Partager avec cette personne</PrimaryButton></div>
          {projects.length > 0 && <div className="flex flex-wrap gap-2"><label htmlFor={`sp-${documentId}`} className="sr-only">Projet</label><select id={`sp-${documentId}`} value={project} onChange={(e) => setProject(e.target.value)} className="min-w-0 flex-1 rounded-control ring-1 ring-line px-2 py-1.5"><option value="">Un de mes projets…</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select><PrimaryButton type="button" disabled={pending || !project} onClick={() => run(() => shareDocument(documentId, { projectId: Number(project) }))} className="!px-3 !py-1.5 text-xs">Partager avec les participants</PrimaryButton></div>}
          <button type="button" onClick={() => setOpen(false)} className="text-ink-3 underline">Fermer</button>
        </div>
      )}
      <Note value={fb} />
    </div>
  );
}
