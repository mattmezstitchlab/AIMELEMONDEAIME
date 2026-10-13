import { and, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { appointments, communityEventPlans, communityTrips, journeys, journeyTasks, offices, projectMembers, projects } from "@/db/schema";
import { nextBirthday, type YearEvent } from "@/lib/annee";

const fmtHeure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * Toutes les dates datées de l'espace d'un membre, sous forme d'événements
 * d'année (voir lib/annee.ts). Source unique de la page « Mon année à
 * préparer » et des réponses de l'assistant : les deux racontent exactement
 * les mêmes dates. Aucune écriture, aucune date inventée — la seule
 * projection est l'anniversaire du membre, récurrent.
 */
export async function getYearEvents(userId: number, birthDate?: string | null): Promise<YearEvent[]> {
  const events: YearEvent[] = [];

  // Échéances et rappels des parcours en cours (tâches datées, non terminées).
  const taskRows = await db
    .select({ task: journeyTasks, journeyId: journeys.id, journeyTitle: journeys.title })
    .from(journeyTasks)
    .innerJoin(journeys, eq(journeyTasks.journeyId, journeys.id))
    .where(
      and(
        eq(journeys.userId, userId),
        ne(journeys.status, "questionnaire"),
        ne(journeys.status, "terminee"),
        ne(journeyTasks.status, "termine"),
        isNotNull(journeyTasks.dueAt),
      ),
    );
  for (const r of taskRows) {
    const officielle = r.task.dueKind === "officielle";
    events.push({
      date: r.task.dueAt!,
      kind: officielle ? "echeance" : "rappel",
      label: r.task.label,
      detail: r.journeyTitle,
      href: `/espace/demarches/suivi/${r.journeyId}`,
      source: officielle ? r.task.dueSource : null,
    });
  }

  // Rendez-vous demandés ou confirmés auprès d'un bureau.
  const apptRows = await db
    .select({ appt: appointments, officeName: offices.name })
    .from(appointments)
    .leftJoin(offices, eq(appointments.officeId, offices.id))
    .where(and(eq(appointments.memberId, userId), inArray(appointments.status, ["demandee", "confirmee"])));
  for (const r of apptRows) {
    events.push({
      date: r.appt.requestedSlot,
      kind: "rendez-vous",
      label: r.appt.reason,
      detail: `à ${fmtHeure.format(r.appt.requestedSlot)} · ${r.officeName ?? "Bureau AIME®"} · ${r.appt.status === "confirmee" ? "confirmé" : "demandé, en attente de confirmation"}`,
      href: "/espace/echanges",
    });
  }

  // Projets dont je suis organisateur ou participant accepté, encore ouverts.
  const projetParId = new Map<number, { titre: string; ville: string; date: Date; role: string }>();
  const owned = await db.select().from(projects).where(and(eq(projects.ownerId, userId), eq(projects.status, "ouvert")));
  for (const p of owned) projetParId.set(p.id, { titre: p.title, ville: p.city, date: p.startsAt, role: "organisateur" });
  const memberRows = await db
    .select({ project: projects, role: projectMembers.role })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(and(eq(projectMembers.userId, userId), eq(projectMembers.status, "accepte"), eq(projects.status, "ouvert")));
  for (const r of memberRows) {
    if (!projetParId.has(r.project.id)) projetParId.set(r.project.id, { titre: r.project.title, ville: r.project.city, date: r.project.startsAt, role: r.role });
  }
  for (const [id, p] of projetParId) {
    events.push({
      date: p.date,
      kind: "projet",
      label: p.titre,
      detail: `${p.ville} · ${p.role === "organisateur" ? "vous organisez" : "vous participez"}`,
      href: `/le-monde-aime/projets/${id}`,
    });
  }

  // Événements communautaires que j'organise et trajets que je propose.
  const eventRows = await db.select().from(communityEventPlans).where(and(eq(communityEventPlans.ownerId, userId), eq(communityEventPlans.status, "actif")));
  for (const e of eventRows) events.push({ date: e.eventDate, kind: "evenement", label: e.title, detail: e.city, href: "/le-monde-aime" });
  const tripRows = await db.select().from(communityTrips).where(and(eq(communityTrips.ownerId, userId), eq(communityTrips.status, "publie")));
  for (const t of tripRows) events.push({ date: t.departureAt, kind: "trajet", label: `${t.startCity} → ${t.endCity}`, detail: `Trajet proposé · ${t.transportMode}`, href: "/le-monde-aime" });

  // Mon anniversaire, projeté sur les 12 prochains mois.
  if (birthDate) {
    const prochain = nextBirthday(birthDate, new Date());
    if (prochain) {
      events.push({ date: prochain.date, kind: "anniversaire", label: "Votre anniversaire", detail: `Vous fêterez vos ${prochain.age} ans`, href: "/espace/profil" });
    }
  }

  return events;
}
