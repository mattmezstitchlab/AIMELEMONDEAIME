import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getCircleDetail } from "@/lib/lma-queries";
import { InviteForm, PostActions, PostForm } from "@/components/community/circle-panels";
import { POST_KIND_LABEL } from "@/lib/lma";
import { Section } from "@/components/community/project-panels";

export const metadata: Metadata = { title: "Cercle — Le Monde Aime" };

export const dynamic = "force-dynamic";
const KIND: Record<string, string> = { famille: "Famille", association: "Association", groupe: "Groupe local" };

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const user = await getCurrentUser();
  if (!Number.isSafeInteger(id) || !user || user.role !== "membre") notFound();
  const detail = await getCircleDetail(id, user.id);
  if (!detail) notFound();
  return (
    <PublicPage solidHeader lma>
      <div className="bg-[#fafaf9]">
        <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
          <Link href="/espace" className="text-sm font-semibold text-emerald-800 underline">← Mes liens</Link>
          <header className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">Cercle privé</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{KIND[detail.circle.kind] ?? detail.circle.kind}</span>{detail.circle.isDemo && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Exemple fictif</span>}</div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">{detail.circle.name}</h1>
            {detail.circle.description && <p className="mt-2 text-slate-700">{detail.circle.description}</p>}
            <p className="mt-3 text-xs text-slate-500">Rien de ce cercle n&apos;apparaît sur la carte ni dans la recherche publique. Chaque auteur décide de ce qui reste privé et de ce qui peut être publié.</p>
          </header>
          <Section title="Membres">
            <ul className="flex flex-wrap gap-2">{detail.members.map((m) => <li key={m.userId} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{m.name}{m.role === "responsable" ? " · responsable" : ""}{m.status === "invite" ? " · invitation en attente" : ""}</li>)}</ul>
            {detail.isLead && <div className="mt-4"><InviteForm circleId={id} /></div>}
          </Section>
          <Section title="Partager dans le cercle"><PostForm circleId={id} /></Section>
          <Section title="Partages du cercle">
            {detail.posts.length === 0 ? <p className="text-sm text-slate-600">Rien n&apos;a encore été partagé.</p> : (
              <ul className="space-y-4">{detail.posts.map((p) => (
                <li key={p.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{POST_KIND_LABEL[p.kind] ?? p.kind} · {p.authorName}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{p.title}</h3>
                  {p.hasPhoto && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element -- photo d'API dynamique, dimensions inconnues */}
                      <img src={`/api/cercles/posts/${p.id}/photo`} alt="" className="mt-3 max-h-72 w-full rounded-xl object-cover" loading="lazy" />
                    </>
                  )}
                  {p.body && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{p.body}</p>}
                  <PostActions postId={p.id} visibility={p.visibility} mine={p.mine} canDelete={p.canDelete} />
                </li>))}</ul>)}
          </Section>
        </div>
      </div>
    </PublicPage>
  );
}
