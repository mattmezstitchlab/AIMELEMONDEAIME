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
    <PublicPage>
      <div className="bg-subtle">
        <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
          <Link href="/espace" className="text-sm font-semibold text-ink underline">← Mes liens</Link>
          <header className="rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested">
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-canvas">Cercle privé</span><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-ink-2">{KIND[detail.circle.kind] ?? detail.circle.kind}</span>{detail.circle.isDemo && <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-ink-3">Exemple fictif</span>}</div>
            <h1 className="mt-3 text-3xl font-bold text-ink">{detail.circle.name}</h1>
            {detail.circle.description && <p className="mt-2 text-ink-2">{detail.circle.description}</p>}
            <p className="mt-3 text-xs text-ink-3">Rien de ce cercle n&apos;apparaît dans l&apos;annuaire ni dans la recherche publique. Chaque auteur décide de ce qui reste privé et de ce qui peut être publié.</p>
          </header>
          <Section title="Membres">
            <ul className="flex flex-wrap gap-2">{detail.members.map((m) => <li key={m.userId} className="rounded-full bg-muted px-3 py-1 text-sm">{m.name}{m.role === "responsable" ? " · responsable" : ""}{m.status === "invite" ? " · invitation en attente" : ""}</li>)}</ul>
            {detail.isLead && <div className="mt-4"><InviteForm circleId={id} /></div>}
          </Section>
          <Section title="Partager dans le cercle"><PostForm circleId={id} /></Section>
          <Section title="Partages du cercle">
            {detail.posts.length === 0 ? <p className="text-sm text-ink-3">Rien n&apos;a encore été partagé.</p> : (
              <ul className="space-y-4">{detail.posts.map((p) => (
                <li key={p.id} className="rounded-card ring-1 ring-line p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink">{POST_KIND_LABEL[p.kind] ?? p.kind} · {p.authorName}</p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{p.title}</h3>
                  {p.hasPhoto && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element -- photo d’API dynamique, dimensions inconnues */}
                      <img src={`/api/cercles/posts/${p.id}/photo`} alt="" className="mt-3 max-h-72 w-full rounded-card object-cover" loading="lazy" />
                    </>
                  )}
                  {p.body && <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{p.body}</p>}
                  <PostActions postId={p.id} visibility={p.visibility} mine={p.mine} canDelete={p.canDelete} />
                </li>))}</ul>)}
          </Section>
        </div>
      </div>
    </PublicPage>
  );
}
