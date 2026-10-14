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
      <main className="grid min-h-[65vh] place-items-center bg-subtle px-5 py-12 sm:px-8">
        <div className="w-full max-w-xl rounded-panel bg-canvas p-7 shadow-rested ring-1 ring-line">
          <p className="eyebrow">Accès temporaire</p>
          <h1 className="mt-3 text-2xl text-ink">Cet accès n’est plus disponible</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-3">
            Le lien a expiré, a été révoqué ou ne correspond pas à cette session. Contactez les personnes qui organisent le mariage pour
            recevoir une nouvelle invitation.
          </p>
          <form action={leaveWeddingAccess} className="mt-6">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-control bg-canvas px-4 text-sm font-medium text-ink-2 ring-1 ring-line transition hover:bg-subtle hover:text-ink"
            >
              Effacer cet accès de cet appareil
            </button>
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
