import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProjectDetail } from "@/lib/lma-queries";
import { getWeddingDayContacts, getWeddingWorkspace } from "@/lib/wedding-queries";
import { ENGAGEMENT_STATUS_LABEL } from "@/lib/situations";
import { formatWeddingDate, guestGroupLabel } from "@/lib/wedding";
import { PrintButton } from "@/components/community/print-button";

export const metadata: Metadata = { title: "Page du jour J — Mariage AIME®" };
export const dynamic = "force-dynamic";

/**
 * La page que les témoins ouvrent le matin du mariage : déroulé, plan de
 * table, prestataires et notes utiles, sur une page à imprimer. Réservée
 * aux participants acceptés du projet — noms et organisation ne sont
 * jamais publics.
 */
export default async function WeddingDayPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();
  const user = await getCurrentUser();
  if (!user) notFound();
  const detail = await getProjectDetail(id, user.id);
  if (!detail || !detail.viewer.isMember) notFound();
  const wedding = await getWeddingWorkspace(id);
  if (!wedding) notFound();
  const { project } = detail;
  const contacts = await getWeddingDayContacts(id, wedding.journeyId);
  const confirmes = wedding.guests.filter((g) => g.status === "confirme");
  const aPlacer = confirmes.filter((g) => !wedding.tables.some((t) => t.id === g.tableId));
  const notesUtiles = confirmes.filter((g) => g.note.trim() !== "");
  const dateLabel = formatWeddingDate(wedding.weddingDate) || "Date à confirmer";

  return (
    <div className="min-h-screen bg-subtle print:bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={`/le-monde-aime/projets/${id}`} className="text-sm font-semibold text-ink underline">← Retour au projet</Link>
          <PrintButton />
        </div>

        <header className="rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested print:border-none print:shadow-none">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-700">Le jour J</p>
          <h1 className="mt-2 text-3xl font-bold capitalize text-slate-900">{dateLabel}</h1>
          <p className="mt-1 text-slate-600">{project.title} · {project.city}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-muted px-3 py-1 text-ink">{wedding.guestStats.confirmees} convive(s) confirmé(s)</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{wedding.tableStats.placeesPersonnes} personne(s) placée(s) · {wedding.tables.length} table(s)</span>
            {contacts.organizers.length > 0 && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Organisé par {contacts.organizers.join(", ")}</span>}
          </div>
          <p className="mt-3 text-xs text-slate-500">Cette page rassemble ce que le projet contient déjà : déroulé, plan de table, prestataires engagés et notes des invités. Imprimez-la pour les témoins et les proches qui accueilleront vos invités.</p>
        </header>

        <section className="mt-5 rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested print:break-inside-avoid print:border-none print:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900">Déroulé de la journée</h2>
          {project.program.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600 print:hidden">Le déroulé n&apos;est pas encore écrit. Ajoutez les horaires dans la rubrique « Programme » du projet (cérémonie, vin d&apos;honneur, repas, soirée…), il apparaîtra ici.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {project.program.map((item, i) => (
                <li key={i} className="flex gap-4 rounded-control bg-subtle px-3 py-2 text-sm print:bg-canvas print:ring-1 print:ring-slate-200">
                  <span className="w-20 shrink-0 font-bold text-ink">{item.time || "—"}</span>
                  <span className="text-slate-800">{item.label}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-5 rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested print:border-none print:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900">Plan de table</h2>
          {wedding.tables.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600 print:hidden">Aucune table pour l&apos;instant : le plan se dresse dans le projet, une fois le nombre de convives figé.</p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {wedding.tables.map((t) => {
                const placed = confirmes.filter((g) => g.tableId === t.id);
                const st = wedding.tableStats.parTable.find((x) => x.tableId === t.id);
                return (
                  <div key={t.id} className="rounded-card ring-1 ring-line p-4 print:break-inside-avoid">
                    <p className="font-semibold text-slate-900">{t.name} <span className="text-xs font-normal text-slate-500">· {st?.personnes ?? 0}{t.capacity !== null ? ` / ${t.capacity}` : ""} personne(s)</span></p>
                    {placed.length === 0 ? <p className="mt-1 text-xs text-slate-500">—</p> : (
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {placed.map((g) => <li key={g.id}>{g.name} <span className="text-xs text-slate-500">({g.persons})</span></li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {aPlacer.length > 0 && (
            <p className="mt-3 rounded-control bg-amber-50 px-3 py-2 text-xs text-amber-800 print:hidden">
              Attention, {aPlacer.length} foyer(s) confirmé(s) ne sont pas encore placés : {aPlacer.map((g) => g.name).join(", ")}. Complétez le plan dans le projet avant d&apos;imprimer.
            </p>
          )}
        </section>

        <section className="mt-5 rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested print:break-inside-avoid print:border-none print:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900">Prestataires engagés et équipe</h2>
          {contacts.engagements.length === 0 && contacts.organizers.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600 print:hidden">Aucun prestataire engagé via le parcours pour l&apos;instant. Notez ici, dans le projet, les coordonnées des vôtres.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {contacts.engagements.map((e, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-subtle px-3 py-2 print:bg-canvas print:ring-1 print:ring-slate-200">
                  <span className="font-semibold text-slate-900">{e.artistName}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink">{ENGAGEMENT_STATUS_LABEL[e.status as keyof typeof ENGAGEMENT_STATUS_LABEL] ?? e.status}</span>
                </li>
              ))}
              {contacts.organizers.map((name) => (
                <li key={name} className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-subtle px-3 py-2 print:bg-canvas print:ring-1 print:ring-slate-200">
                  <span className="font-semibold text-slate-900">{name}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">Organisation</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-slate-500">Pensez à noter ici, au stylo si besoin, les numéros du lieu, du traiteur et des témoins : le papier ne tombe jamais en panne de batterie.</p>
        </section>

        {notesUtiles.length > 0 && (
          <section className="mt-5 rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested print:break-inside-avoid print:border-none print:shadow-none">
            <h2 className="text-lg font-semibold text-slate-900">Notes utiles des invités confirmés</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
              {notesUtiles.map((g) => (
                <li key={g.id}><strong>{g.name}</strong> <span className="text-xs text-slate-500">({guestGroupLabel(g.groupe)})</span> — {g.note}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-6 text-center text-[11px] text-slate-400">Page préparée avec AIME® depuis le projet du mariage — aucune information n&apos;a été envoyée à qui que ce soit.</p>
      </div>
    </div>
  );
}
