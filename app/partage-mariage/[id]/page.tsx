import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PublicPage } from "@/components/public-shell";
import { WeddingSharedWorkspace } from "@/components/community/wedding-shared-workspace";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { leaveWeddingAccess } from "@/lib/actions/wedding-access";
import { getWeddingSharedWorkspace } from "@/lib/wedding-queries";
import { getWeddingAccessSession } from "@/lib/wedding-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Espace mariage partagé — AIME®",
  robots: { index: false, follow: false },
};

function Unavailable() {
  return (
    <PublicPage solidHeader>
      <main className="min-h-[65vh] bg-[#fafaf9] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Accès temporaire</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Cet accès n&apos;est plus disponible</h1>
          <p className="mt-2 text-sm text-slate-600">Le lien a expiré, a été révoqué ou ne correspond pas à cette session. Contactez les personnes qui organisent le mariage pour recevoir une nouvelle invitation.</p>
          <form action={leaveWeddingAccess} className="mt-5">
            <button type="submit" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Effacer cet accès de cet appareil</button>
          </form>
        </div>
      </main>
    </PublicPage>
  );
}

export default async function SharedWeddingPage({ params }: { params: Promise<{ id: string }> }) {
  const linkId = Number((await params).id);
  if (!Number.isSafeInteger(linkId) || linkId < 1) return <Unavailable />;
  const session = await getWeddingAccessSession(linkId);
  if (!session) return <Unavailable />;

  const [project] = await db
    .select({ title: projects.title, city: projects.city, program: projects.program, status: projects.status })
    .from(projects)
    .where(eq(projects.id, session.projectId))
    .limit(1);
  if (!project) return <Unavailable />;
  const wedding = await getWeddingSharedWorkspace(session.projectId);
  if (!wedding || project.status === "annule") return <Unavailable />;

  const program = (project.program ?? []).map(({ time, label }) => ({ time, label }));

  return (
    <PublicPage solidHeader>
      <WeddingSharedWorkspace
        linkId={linkId}
        role={session.role}
        projectTitle={project.title}
        city={project.city}
        weddingDate={wedding.weddingDate}
        expiresAt={session.expiresAt}
        program={program}
        guests={wedding.guests}
        tables={wedding.tables}
        canEdit={session.role === "coordination" && project.status === "ouvert"}
      />
    </PublicPage>
  );
}
