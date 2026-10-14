"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCircle, createCirclePost, deleteCirclePost, inviteToCircle, respondToCircleInvite, setPostVisibility, type CircleResult } from "@/lib/actions/circles";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { POST_KIND_LABEL } from "@/lib/lma";

const input = "mt-1 w-full rounded-control ring-1 ring-slate-300 bg-canvas px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400";
const label = "block text-sm font-semibold text-slate-700";
type Fb = { ok: boolean; text: string } | null;
const Note = ({ value }: { value: Fb }) => value ? <p role={value.ok ? "status" : "alert"} className={`rounded-control px-3 py-2 text-xs ${value.ok ? "bg-muted text-ink" : "bg-rose-50 text-rose-800"}`}>{value.text}</p> : null;

function useCircleRun() {
  const [fb, setFb] = useState<Fb>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<CircleResult>, after?: (r: CircleResult) => void) =>
    start(async () => { const r = await fn(); setFb({ ok: r.ok, text: r.ok ? r.message : r.error }); if (r.ok) router.refresh(); after?.(r); });
  return { fb, pending, run };
}



export function CreateCircleForm() {
  const { fb, pending, run } = useCircleRun();
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); const el = e.currentTarget; run(() => createCircle(f), (r) => { if (r.ok) el.reset(); }); }
  return (
    <form onSubmit={submit} className="space-y-3 rounded-card bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-900">Créer un cercle privé</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={label} htmlFor="c-name">Nom du cercle</label><input id="c-name" name="name" required minLength={3} maxLength={120} placeholder="Ex. Famille Dupont" className={input} /></div>
        <div><label className={label} htmlFor="c-kind">Type</label><select id="c-kind" name="kind" className={input}><option value="famille">Famille</option><option value="association">Association</option><option value="groupe">Groupe local</option></select></div>
      </div>
      <div><label className={label} htmlFor="c-desc">Description (facultative)</label><input id="c-desc" name="description" maxLength={400} className={input} /></div>
      <p className="text-xs text-slate-500">Un cercle est privé : on n&apos;y entre que sur invitation acceptée. Réservé aux adultes ; les activités d&apos;enfants passent par leurs responsables légaux.</p>
      <Note value={fb} /><PrimaryButton type="submit" disabled={pending}>Créer le cercle</PrimaryButton>
    </form>
  );
}

export function InviteResponses({ invites }: { invites: Array<{ id: number; name: string; kind: string }> }) {
  const { fb, pending, run } = useCircleRun();
  if (invites.length === 0) return null;
  return (
    <div className="space-y-2">
      {invites.map((i) => (
        <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-amber-200 bg-amber-50 p-3 text-sm">
          <span>Invitation au cercle <strong>{i.name}</strong> ({i.kind})</span>
          <span className="flex gap-2"><PrimaryButton type="button" disabled={pending} onClick={() => run(() => respondToCircleInvite(i.id, true))} className="!px-3 !py-1.5 text-xs">Accepter</PrimaryButton><SecondaryButton type="button" disabled={pending} onClick={() => run(() => respondToCircleInvite(i.id, false))} className="!px-3 !py-1.5 text-xs">Refuser</SecondaryButton></span>
        </div>
      ))}
      <Note value={fb} />
    </div>
  );
}

export function InviteForm({ circleId }: { circleId: number }) {
  const { fb, pending, run } = useCircleRun();
  const [email, setEmail] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => inviteToCircle(circleId, email), (r) => { if (r.ok) setEmail(""); }); }} className="space-y-2">
      <label htmlFor="inv-email" className={label}>Inviter par e-mail</label>
      <div className="flex gap-2"><input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@exemple.fr" className={input} /><PrimaryButton type="submit" disabled={pending || !email} className="mt-1 shrink-0">Inviter</PrimaryButton></div>
      <p className="text-xs text-slate-500">La personne doit déjà avoir un compte et accepter l&apos;invitation pour accéder au cercle.</p>
      <Note value={fb} />
    </form>
  );
}

export function PostForm({ circleId }: { circleId: number }) {
  const { fb, pending, run } = useCircleRun();
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); f.set("circleId", String(circleId)); const el = e.currentTarget; run(() => createCirclePost(f), (r) => { if (r.ok) el.reset(); }); }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div><label className={label} htmlFor="p-kind">Type</label><select id="p-kind" name="kind" className={input} defaultValue="recit">{Object.entries(POST_KIND_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label className={label} htmlFor="p-title">Titre</label><input id="p-title" name="title" required minLength={3} maxLength={140} className={input} /></div>
      </div>
      <div><label className={label} htmlFor="p-body">Texte</label><textarea id="p-body" name="body" rows={4} maxLength={4000} className={input} placeholder="Un souvenir, une recette, un savoir-faire, des nouvelles du projet…" /></div>
      <div><label className={label} htmlFor="p-photo">Photo (facultative · 3 Mo)</label><input id="p-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={input} /></div>
      <p className="text-xs text-slate-500">Tout ce que vous partagez reste <strong>privé</strong> au cercle tant que vous ne choisissez pas de le publier.</p>
      <Note value={fb} /><PrimaryButton type="submit" disabled={pending}>Partager dans le cercle</PrimaryButton>
    </form>
  );
}

export function PostActions({ postId, visibility, mine, canDelete }: { postId: number; visibility: string; mine: boolean; canDelete: boolean }) {
  const { fb, pending, run } = useCircleRun();
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      <span className={`rounded-full px-2.5 py-1 font-bold ${visibility === "publie" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{visibility === "publie" ? "Publié (visible par tous)" : "Privé au cercle"}</span>
      {mine && <button type="button" disabled={pending} onClick={() => { if (visibility === "prive" && !window.confirm("Publier ce partage ? Il sera visible par tous, sans le nom du cercle.")) return; run(() => setPostVisibility(postId, visibility === "publie" ? "prive" : "publie")); }} className="font-bold text-ink underline">{visibility === "publie" ? "Remettre en privé" : "Publier pour tous"}</button>}
      {canDelete && <button type="button" disabled={pending} onClick={() => { if (window.confirm("Supprimer ce partage ?")) run(() => deleteCirclePost(postId)); }} className="font-bold text-rose-700 underline">Supprimer</button>}
      <Note value={fb} />
    </div>
  );
}
