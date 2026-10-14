import { requireRolePage } from "@/lib/auth";
import type { Metadata } from "next";
import { db } from "@/db";
import { messages, appointments, offices } from "@/db/schema";
import { or, eq, asc } from "drizzle-orm";
import { Card, SectionTitle, EmptyState, formatDate, formatDateTime, LinkButton } from "@/components/ui";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/constants";
import { OfficeMessageForm } from "./office-message-form";
import { AppointmentForm } from "./appointment-form";
import { getMyCommunityData } from "@/lib/community-queries";
import { getMyLinks } from "@/lib/lma-queries";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { CreateCircleForm, InviteResponses } from "@/components/community/circle-panels";
import { MyExchangesClient } from "./my-exchanges-client";

export const metadata: Metadata = { title: "Mes échanges & projets — AIME®" };

export const dynamic = "force-dynamic";

export default async function EchangesPage() {
  const user = await requireRolePage(["membre"]);
  const thread = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, user.id), eq(messages.recipientId, user.id)))
    .orderBy(asc(messages.createdAt));

  const myAppointments = await db.select().from(appointments).where(eq(appointments.memberId, user.id));
  const officeList = await db.select().from(offices);
  const [mine, links] = await Promise.all([getMyCommunityData(user.id), getMyLinks(user.id)]);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Mes échanges & projets" title="Conversations, projets, cercles, dons et prêts" description="Tout ce que vous échangez, organisez et partagez — avec le voisinage, vos cercles et l’équipe d’accompagnement."
        actions={<LinkButton href="/le-monde-aime?onglet=publier"><Icon name="filePlus" className="h-4 w-4" /> Créer un projet</LinkButton>} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/espace/profil" className="rounded-card bg-canvas ring-1 ring-line p-4 shadow-rested hover:ring-ink-4"><Icon name="user" className="h-6 w-6 text-ink-2" /><strong className="mt-2 block text-ink">Mon profil</strong><span className="text-xs text-ink-3">Activités, ce que je propose, recherche ou transmets, zone et disponibilités.</span></Link>
        <Link href="/le-monde-aime/artiste" className="rounded-card bg-canvas ring-1 ring-line p-4 shadow-rested hover:ring-ink-4"><Icon name="music" className="h-6 w-6 text-ink-2" /><strong className="mt-2 block text-ink">Espace artiste</strong><span className="text-xs text-ink-3">{links.hasArtist ? "Prestations, demandes reçues, fiche technique." : "Disciplines, prestations et fiche technique."}</span></Link>
        <Link href="/le-monde-aime" className="rounded-card bg-canvas ring-1 ring-line p-4 shadow-rested hover:ring-ink-4"><Icon name="pin" className="h-6 w-6 text-ink-2" /><strong className="mt-2 block text-ink">Explorer Le Monde Aime</strong><span className="text-xs text-ink-3">Personnes, offres, besoins et projets près de vous.</span></Link>
        <Link href="/circuits" className="rounded-card bg-canvas ring-1 ring-line p-4 shadow-rested hover:ring-ink-4"><Icon name="sprout" className="h-6 w-6 text-ink-2" /><strong className="mt-2 block text-ink">Mes circuits</strong><span className="text-xs text-ink-3">Ma production, mes réservations, ma disponibilité, mes fiches d&apos;association.</span></Link>
      </div>

      <InviteResponses invites={links.invites.map((i) => ({ id: i.id, name: i.name, kind: i.kind }))} />

      <section><h2 className="mb-3 text-lg font-bold text-ink">Réservations, dons, prêts et locations</h2><MyExchangesClient mine={mine} userId={user.id} /></section>

      <section>
        <h2 className="text-lg font-bold text-ink">Mes projets</h2>
        <p className="text-sm text-ink-3">Événements, activités et projets partagés : un projet existe une seule fois, vous le retrouvez ici et dans Le Monde Aime.</p>
        {links.projects.length === 0 ? <EmptyState title="Aucun projet" description="Créez un projet ou rejoignez-en un depuis les listes." /> : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {links.projects.map((p) => (
              <Link key={p.id} href={`/le-monde-aime/projets/${p.id}`}>
                <Card className="h-full hover:bg-subtle">
                  <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-2.5 py-1 font-bold text-ink">{p.role === "organisateur" ? "Organisateur" : "Participant"}</span>{p.memberStatus === "demande" && <span className="rounded-full bg-muted px-2.5 py-1 font-bold text-ink">Demande en attente</span>}{p.pendingRequests > 0 && <span className="rounded-full bg-ink px-2.5 py-1 font-bold text-canvas">{p.pendingRequests} à traiter</span>}{p.isDemo && <span className="font-bold uppercase text-ink-3">fictif</span>}</div>
                  <p className="mt-2 text-lg font-bold text-ink">{p.title}</p><p className="text-sm text-ink-3">{p.city} · {formatDate(p.startsAt)}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-ink">Mes cercles privés</h2>
        <p className="text-sm text-ink-3">Famille, association ou groupe local, sur invitation acceptée. Être membre d&apos;un cercle ne donne aucun accès à vos démarches ni à vos documents.</p>
        {links.circles.length > 0 && <div className="mt-3 grid gap-3 md:grid-cols-2">{links.circles.map((c) => <Link key={c.id} href={`/le-monde-aime/cercles/${c.id}`}><Card className="hover:bg-subtle"><p className="text-xs font-bold text-ink-3"><Icon name="lock" className="mr-1 inline h-3 w-3" />Privé{c.isDemo ? " · fictif" : ""}</p><p className="mt-1 font-bold text-ink">{c.name}</p></Card></Link>)}</div>}
        <div className="mt-4"><CreateCircleForm /></div>
      </section>
      <h2 className="text-lg font-bold text-ink">Équipe d&apos;accompagnement (démonstration)</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Messagerie avec l&apos;équipe d&apos;accompagnement</h2>
          {thread.length === 0 ? (
            <EmptyState title="Aucun message" description="Envoyez un message à l’équipe d’accompagnement pour une question générale." />
          ) : (
            <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
              {thread.map((m) => (
                <li key={m.id} className={`rounded-control px-3 py-2 text-sm ${m.senderId === user.id ? "ml-6 bg-muted text-ink" : "mr-6 bg-muted text-ink-2"}`}>
                  <p>{m.body}</p>
                  <p className="mt-1 text-xs text-ink-3">{formatDateTime(m.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
          <div data-assistant-id="echanges-message-form"><OfficeMessageForm /></div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Demander un rendez-vous</h2>
          <div data-assistant-id="echanges-appointment-form"><AppointmentForm offices={officeList} /></div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Mes rendez-vous</h2>
        {myAppointments.length === 0 ? (
          <p className="mt-2 text-sm text-ink-3">Aucune demande de rendez-vous pour le moment.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {myAppointments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-control ring-1 ring-line px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{a.reason}</p>
                  <p className="text-xs text-ink-3">{formatDateTime(a.requestedSlot)}</p>
                </div>
                <span className="text-xs font-semibold text-ink">{APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
