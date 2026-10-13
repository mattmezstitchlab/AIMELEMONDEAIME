"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  createStaffUser,
  updateUserRole,
  toggleUserActive,
  upsertOffice,
  deleteOffice,
  upsertArticle,
  deleteArticle,
  toggleArticlePublished,
} from "@/lib/actions/admin";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/constants";

type Result = { ok: boolean; error?: string };

function useFormAction(fn: (fd: FormData) => Promise<Result>, resetOnSuccess = true) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await fn(fd);
      if (res.ok) {
        setError(null);
        setSuccess(true);
        if (resetOnSuccess) ref.current?.reset();
        router.refresh();
      } else {
        setSuccess(false);
        setError(res.error ?? "Erreur");
      }
    });
  }
  return { error, success, pending, ref, onSubmit };
}

const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

function F({ label, name, defaultValue, type = "text", required = true }: { label: string; name: string; defaultValue?: string; type?: string; required?: boolean }) {
  const id = `${name}-${useId()}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <input id={id} name={name} type={type} defaultValue={defaultValue} required={required} className={input} />
    </div>
  );
}

export function CreateStaffForm({ offices }: { offices: { id: number; name: string }[] }) {
  const f = useFormAction(createStaffUser);
  return (
    <form ref={f.ref} onSubmit={f.onSubmit} className="grid gap-3 sm:grid-cols-2">
      <F label="Nom complet" name="fullName" />
      <F label="E-mail" name="email" type="email" />
      <F label="Mot de passe initial" name="password" type="password" />
      <div>
        <label htmlFor="new-role" className="block text-sm font-medium text-slate-700">Rôle</label>
        <select id="new-role" name="role" className={input}>
          <option value="gestionnaire">Gestionnaire</option>
          <option value="administrateur">Administrateur</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="new-office" className="block text-sm font-medium text-slate-700">Bureau autorisé</label>
        <select id="new-office" name="officeId" className={input}>
          <option value="">Aucun (administrateur)</option>
          {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      {f.error && <p role="alert" className="text-sm text-rose-700 sm:col-span-2">{f.error}</p>}
      {f.success && <p role="status" className="text-sm text-emerald-700 sm:col-span-2">Compte créé.</p>}
      <PrimaryButton type="submit" disabled={f.pending} className="sm:col-span-2 sm:justify-self-start">{f.pending ? "Création…" : "Créer le compte"}</PrimaryButton>
    </form>
  );
}

export function UserRow({ user, offices, isSelf }: { user: { id: number; fullName: string; email: string; role: string; officeId: number | null; isActive: boolean }; offices: { id: number; name: string }[]; isSelf: boolean }) {
  const [role, setRole] = useState(user.role);
  const [officeId, setOfficeId] = useState(user.officeId ? String(user.officeId) : "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  return (
    <tr className={user.isActive ? "" : "opacity-60"}>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{user.fullName}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </td>
      <td className="px-4 py-3">
        <label className="sr-only" htmlFor={`role-${user.id}`}>Rôle de {user.fullName}</label>
        <select id={`role-${user.id}`} value={role} disabled={isSelf} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
          <option value="membre">Membre</option>
          <option value="gestionnaire">Gestionnaire</option>
          <option value="administrateur">Administrateur</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <label className="sr-only" htmlFor={`office-${user.id}`}>Bureau de {user.fullName}</label>
        <select id={`office-${user.id}`} value={officeId} onChange={(e) => setOfficeId(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">—</option>
          {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => { const r = await updateUserRole(user.id, role as "membre", officeId ? Number(officeId) : undefined); setMsg(r.ok ? "Enregistré" : r.error); router.refresh(); })}
            className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
          >
            Enregistrer
          </button>
          {!isSelf && (
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => { const r = await toggleUserActive(user.id, !user.isActive); setMsg(r.ok ? null : r.error); router.refresh(); })}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {user.isActive ? "Désactiver" : "Réactiver"}
            </button>
          )}
          {msg && <span role="status" className="text-xs text-slate-500">{msg}</span>}
        </div>
      </td>
    </tr>
  );
}

type Office = { id: number; name: string; code: string; address: string; city: string; postalCode: string; phone: string; hours: string; region: string };

export function OfficeForm({ office, onDone }: { office?: Office; onDone?: () => void }) {
  const f = useFormAction(async (fd) => { const r = await upsertOffice(fd); if (r.ok) onDone?.(); return r; }, !office);
  return (
    <form ref={f.ref} onSubmit={f.onSubmit} className="grid gap-3 sm:grid-cols-2">
      {office && <input type="hidden" name="id" value={office.id} />}
      <F label="Nom" name="name" defaultValue={office?.name} />
      <F label="Code" name="code" defaultValue={office?.code} />
      <F label="Adresse" name="address" defaultValue={office?.address} />
      <F label="Ville" name="city" defaultValue={office?.city} />
      <F label="Code postal" name="postalCode" defaultValue={office?.postalCode} />
      <F label="Téléphone" name="phone" defaultValue={office?.phone} />
      <F label="Horaires" name="hours" defaultValue={office?.hours} />
      <F label="Région" name="region" defaultValue={office?.region} />
      {f.error && <p role="alert" className="text-sm text-rose-700 sm:col-span-2">{f.error}</p>}
      {f.success && <p role="status" className="text-sm text-emerald-700 sm:col-span-2">Bureau enregistré.</p>}
      <PrimaryButton type="submit" disabled={f.pending} className="sm:col-span-2 sm:justify-self-start">{f.pending ? "Enregistrement…" : office ? "Enregistrer" : "Ajouter le bureau"}</PrimaryButton>
    </form>
  );
}

export function OfficeCard({ office }: { office: Office }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
      {editing ? (
        <OfficeForm office={office} onDone={() => setEditing(false)} />
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{office.region} · {office.code}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{office.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{office.address}, {office.postalCode} {office.city} · {office.phone}</p>
          <p className="text-sm text-slate-600">{office.hours}</p>
        </>
      )}
      {err && <p role="alert" className="mt-2 text-sm text-rose-700">{err}</p>}
      <div className="mt-4 flex gap-2">
        <SecondaryButton onClick={() => setEditing((v) => !v)} className="!px-3 !py-1.5 text-xs">{editing ? "Fermer" : "Modifier"}</SecondaryButton>
        <SecondaryButton
          disabled={pending}
          className="!px-3 !py-1.5 text-xs text-rose-700"
          onClick={() => {
            if (!confirm("Supprimer ce bureau ?")) return;
            start(async () => { const r = await deleteOffice(office.id); if (!r.ok) setErr(r.error); router.refresh(); });
          }}
        >
          Supprimer
        </SecondaryButton>
      </div>
    </div>
  );
}

type Article = { id: number; title: string; category: string; audience: string; summary: string; content: string; kind: string; isPublished: boolean; slug: string };

export function ArticleForm({ article, onDone }: { article?: Article; onDone?: () => void }) {
  const f = useFormAction(async (fd) => { const r = await upsertArticle(fd); if (r.ok) onDone?.(); return r; }, !article);
  return (
    <form ref={f.ref} onSubmit={f.onSubmit} className="grid gap-3 sm:grid-cols-2">
      {article && <input type="hidden" name="id" value={article.id} />}
      <div className="sm:col-span-2"><F label="Titre" name="title" defaultValue={article?.title} /></div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor={`cat-${article?.id ?? "new"}`}>Thématique</label>
        <select id={`cat-${article?.id ?? "new"}`} name="category" defaultValue={article?.category ?? "sante"} className={input}>
          {Object.entries(ARTICLE_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor={`kind-${article?.id ?? "new"}`}>Type</label>
        <select id={`kind-${article?.id ?? "new"}`} name="kind" defaultValue={article?.kind ?? "article"} className={input}>
          <option value="article">Article</option>
          <option value="guide">Guide pratique</option>
        </select>
      </div>
      <div className="sm:col-span-2"><F label="Public concerné" name="audience" defaultValue={article?.audience} /></div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor={`sum-${article?.id ?? "new"}`}>Résumé</label>
        <textarea id={`sum-${article?.id ?? "new"}`} name="summary" required rows={2} defaultValue={article?.summary} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor={`content-${article?.id ?? "new"}`}>Contenu</label>
        <textarea id={`content-${article?.id ?? "new"}`} name="content" required rows={6} defaultValue={article?.content} className={input} />
      </div>
      {f.error && <p role="alert" className="text-sm text-rose-700 sm:col-span-2">{f.error}</p>}
      {f.success && <p role="status" className="text-sm text-emerald-700 sm:col-span-2">Contenu enregistré.</p>}
      <PrimaryButton type="submit" disabled={f.pending} className="sm:col-span-2 sm:justify-self-start">{f.pending ? "Enregistrement…" : article ? "Enregistrer" : "Publier"}</PrimaryButton>
    </form>
  );
}

export function ArticleRow({ article }: { article: Article }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <li className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            {ARTICLE_CATEGORY_LABELS[article.category]} · {article.kind === "guide" ? "Guide" : "Article"}
          </p>
          <p className="mt-1 font-semibold text-slate-900">{article.title}</p>
          <p className="text-sm text-slate-600">{article.summary}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${article.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {article.isPublished ? "Publié" : "Brouillon"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <SecondaryButton onClick={() => setEditing((v) => !v)} className="!px-3 !py-1.5 text-xs">{editing ? "Fermer" : "Modifier"}</SecondaryButton>
        <SecondaryButton disabled={pending} className="!px-3 !py-1.5 text-xs" onClick={() => start(async () => { await toggleArticlePublished(article.id, !article.isPublished); router.refresh(); })}>
          {article.isPublished ? "Dépublier" : "Publier"}
        </SecondaryButton>
        <SecondaryButton
          disabled={pending}
          className="!px-3 !py-1.5 text-xs text-rose-700"
          onClick={() => { if (!confirm("Supprimer ce contenu ?")) return; start(async () => { await deleteArticle(article.id); router.refresh(); }); }}
        >
          Supprimer
        </SecondaryButton>
      </div>
      {editing && <div className="mt-4 border-t border-slate-100 pt-4"><ArticleForm article={article} onDone={() => setEditing(false)} /></div>}
    </li>
  );
}
