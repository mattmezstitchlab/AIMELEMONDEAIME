"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, gte, inArray, isNull, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  artistEngagements, artistProfiles, cases, caseEvents, communityListings, documentShares, documents, journeyEvents, journeyTasks, journeys,
  journeyTaskStatusEnum, offices, organisms, procedureTypes, projectMembers, projects, users, type JourneyTaskStatus,
} from "@/db/schema";
import { AuthError, requireRole } from "@/lib/auth";
import { createNotification } from "@/lib/queries";
import { logAudit } from "@/lib/audit";
import { RULES_VERSION, SITUATION_BY_KEY } from "@/lib/situations";
import { generateCaseReference } from "@/lib/reference";
import { redirect } from "next/navigation";

export type JResult = { ok: true; message: string; id?: number } | { ok: false; error: string };
const fail = (e: unknown, msg: string): JResult => (e instanceof AuthError ? { ok: false, error: "Connectez-vous avec un compte membre." } : { ok: false, error: msg });
const refresh = (id?: number) => { revalidatePath("/espace", "layout"); if (id) revalidatePath(`/espace/demarches/suivi/${id}`); };

async function ownJourney(id: number, userId: number) {
  const [j] = await db.select().from(journeys).where(and(eq(journeys.id, id), eq(journeys.userId, userId))).limit(1);
  return j ?? null;
}
async function log(journeyId: number, actorId: number | null, message: string) {
  await db.insert(journeyEvents).values({ journeyId, actorId, message });
}

/** Enregistre les réponses (création au premier enregistrement) : la démarche peut être reprise plus tard. */
export async function saveJourneyDraft(situation: string, answers: Record<string, string>, journeyId?: number): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const def = SITUATION_BY_KEY.get(situation);
    if (!def) return { ok: false, error: "Situation inconnue." };
    const allowed = new Set(def.questions.map((q) => q.key));
    const clean = Object.fromEntries(Object.entries(answers).filter(([k, v]) => allowed.has(k) && typeof v === "string").map(([k, v]) => [k, v.slice(0, 600)]));
    for (const question of def.questions) {
      const answer = clean[question.key];
      if (!answer) continue;
      if (question.type === "select" && !question.options?.some(([key]) => key === answer)) return { ok: false, error: `Choix invalide pour « ${question.label} ».` };
      if (question.type === "date") {
        const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(answer) ? new Date(`${answer}T12:00:00Z`) : null;
        if (!parsedDate || Number.isNaN(parsedDate.getTime()) || !parsedDate.toISOString().startsWith(answer)) return { ok: false, error: `Date invalide pour « ${question.label} ».` };
      }
      if (question.type === "number" && (!Number.isFinite(Number(answer)) || Number(answer) < 0)) return { ok: false, error: `Nombre invalide pour « ${question.label} ».` };
    }
    if (journeyId) {
      const j = await ownJourney(journeyId, user.id);
      if (!j) return { ok: false, error: "Démarche introuvable." };
      await db.update(journeys).set({ answers: { ...j.answers, ...clean }, updatedAt: new Date() }).where(eq(journeys.id, j.id));
      refresh(j.id);
      return { ok: true, message: "Réponses enregistrées. Vous pourrez reprendre plus tard.", id: j.id };
    }
    const [j] = await db.insert(journeys).values({ userId: user.id, situation, title: def.short, answers: clean, status: "questionnaire", rulesVersion: RULES_VERSION }).returning({ id: journeys.id });
    await log(j.id, user.id, "Démarche commencée.");
    refresh();
    return { ok: true, message: "Réponses enregistrées. Vous pourrez reprendre plus tard.", id: j.id };
  } catch (e) {
    return fail(e, "Enregistrement impossible.");
  }
}

async function approxCoords(city: string, userId: number) {
  const [office] = await db.select({ lat: offices.lat, lng: offices.lng }).from(offices).where(eq(offices.city, city)).limit(1);
  if (office?.lat && office.lng) return { lat: Number(office.lat).toFixed(2), lng: Number(office.lng).toFixed(2) };
  const [u] = await db.select({ lat: users.profileLat, lng: users.profileLng }).from(users).where(eq(users.id, userId)).limit(1);
  if (u?.lat && u.lng) return { lat: u.lat, lng: u.lng };
  return { lat: "46.60", lng: "2.40" };
}

/** Termine le questionnaire : génère les étapes à partir des règles et relie (ou crée) le projet de l'événement. */
export async function finalizeJourney(journeyId: number, projectChoice: string): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const j = await ownJourney(journeyId, user.id);
    if (!j) return { ok: false, error: "Démarche introuvable." };
    if (j.status !== "questionnaire") return { ok: false, error: "Le plan a déjà été préparé." };
    const def = SITUATION_BY_KEY.get(j.situation)!;
    if (j.situation === "famille" && j.answers.evenement === "deces") return { ok: false, error: "Le décès d'un proche dispose maintenant d'un parcours dédié. Ouvrez « Un proche est décédé » pour préparer les étapes adaptées." };
    const missing = def.questions.filter((q) => q.required && !j.answers[q.key]);
    if (missing.length) return { ok: false, error: `Il manque une réponse : « ${missing[0].label} ».` };

    let projectId: number | null = null;
    if (j.situation === "evenement") {
      if (projectChoice && projectChoice !== "new") {
        const pid = Number(projectChoice);
        const [m] = await db.select().from(projectMembers).where(and(eq(projectMembers.projectId, pid), eq(projectMembers.userId, user.id), eq(projectMembers.role, "organisateur"), eq(projectMembers.status, "accepte"))).limit(1);
        if (!m) return { ok: false, error: "Vous n'organisez pas ce projet." };
        projectId = pid;
      } else {
        const date = new Date(`${j.answers.date}T12:00:00`);
        if (Number.isNaN(date.getTime())) return { ok: false, error: "Date de l'événement invalide." };
        const coords = await approxCoords(j.answers.lieu, user.id);
        const label = def.questions[0].options?.find(([v]) => v === j.answers.event_type)?.[1] ?? "Événement";
        const [p] = await db.insert(projects).values({
          ownerId: user.id, title: `${label.split(",")[0]} — ${j.answers.lieu}`.slice(0, 140),
          intention: `Événement préparé avec AIME®${j.answers.public ? ` pour environ ${j.answers.public} personnes` : ""}. Discipline recherchée : ${j.answers.discipline}.`,
          city: j.answers.lieu, lat: coords.lat, lng: coords.lng, startsAt: date, universes: ["arts", "terre"],
        }).returning({ id: projects.id });
        await db.insert(projectMembers).values({ projectId: p.id, userId: user.id, role: "organisateur", status: "accepte" });
        projectId = p.id;
      }
    }
    const rules = def.build(j.answers);
    await db.transaction(async (tx) => {
      if (rules.length) {
        await tx.insert(journeyTasks).values(rules.map((r, i) => ({
          journeyId: j.id, kind: r.kind, label: r.label, detail: r.detail ?? "", reason: r.reason, organismSlugs: r.organisms ?? [],
          officialUrl: r.officialUrl ?? null, frameworkFlag: r.frameworkFlag ?? null, sortOrder: i,
          ...(r.kind === "action" && i === 0 && projectId ? { status: "pret" as const } : {}),
        })));
      }
      const summary = def.questions.filter((q) => j.answers[q.key]).map((q) => `${q.label} ${q.options?.find(([v]) => v === j.answers[q.key])?.[1] ?? j.answers[q.key]}`).join("\n");
      await tx.update(journeys).set({ status: "en_cours", projectId, summary, rulesVersion: RULES_VERSION, title: j.situation === "evenement" ? `Événement à ${j.answers.lieu}` : def.short, updatedAt: new Date() }).where(eq(journeys.id, j.id));
    });
    await log(j.id, user.id, `Plan préparé : ${rules.length} étapes et pièces (règles ${RULES_VERSION}).${projectId ? " Projet relié." : ""}`);
    await logAudit({ actorId: user.id, action: "plan_demarche", entityType: "journey", entityId: String(j.id) });
    refresh(j.id);
    return { ok: true, message: "Votre plan est prêt.", id: j.id };
  } catch (e) {
    return fail(e, "Préparation impossible.");
  }
}

export async function updateJourneySummary(journeyId: number, summary: string): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const j = await ownJourney(journeyId, user.id);
    if (!j) return { ok: false, error: "Démarche introuvable." };
    await db.update(journeys).set({ summary: summary.slice(0, 3000), updatedAt: new Date() }).where(eq(journeys.id, j.id));
    await log(j.id, user.id, "Synthèse de la situation modifiée.");
    refresh(j.id);
    return { ok: true, message: "Synthèse enregistrée." };
  } catch (e) { return fail(e, "Enregistrement impossible."); }
}

export async function setJourneyStatus(journeyId: number, status: "en_cours" | "terminee"): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const j = await ownJourney(journeyId, user.id);
    if (!j || j.status === "questionnaire" || !["en_cours", "terminee"].includes(status)) return { ok: false, error: "Action impossible." };
    await db.update(journeys).set({ status, updatedAt: new Date() }).where(eq(journeys.id, j.id));
    await log(j.id, user.id, status === "terminee" ? "Démarche marquée comme terminée par vous." : "Démarche rouverte.");
    refresh(j.id);
    return { ok: true, message: status === "terminee" ? "Démarche terminée." : "Démarche rouverte." };
  } catch (e) { return fail(e, "Action impossible."); }
}

async function ownTask(taskId: number, userId: number) {
  const [row] = await db.select({ task: journeyTasks, owner: journeys.userId }).from(journeyTasks).innerJoin(journeys, eq(journeyTasks.journeyId, journeys.id)).where(eq(journeyTasks.id, taskId)).limit(1);
  return row && row.owner === userId ? row.task : null;
}

/** Statuts déclaratifs uniquement : aucune transmission ni confirmation officielle n'est possible sans intégration. */
export async function setTaskStatus(taskId: number, status: string): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    if (!(journeyTaskStatusEnum as readonly string[]).includes(status)) return { ok: false, error: "Statut invalide." };
    const t = await ownTask(taskId, user.id);
    if (!t) return { ok: false, error: "Étape introuvable." };
    await db.update(journeyTasks).set({ status: status as JourneyTaskStatus, updatedAt: new Date() }).where(eq(journeyTasks.id, t.id));
    const labels: Record<string, string> = { a_preparer: "à préparer", pret: "prête", effectue_declare: "effectuée selon vous (déclaration, non vérifiée)", attente_reponse: "en attente de réponse", a_completer: "à compléter", termine: "terminée" };
    await log(t.journeyId, user.id, `« ${t.label} » : ${labels[status]}.`);
    refresh(t.journeyId);
    return { ok: true, message: "Statut mis à jour." };
  } catch (e) { return fail(e, "Mise à jour impossible."); }
}

/** Rappel personnel (jamais présenté comme une échéance officielle). */
export async function setTaskReminder(taskId: number, date: string): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const t = await ownTask(taskId, user.id);
    if (!t) return { ok: false, error: "Étape introuvable." };
    if (t.dueKind === "officielle") return { ok: false, error: "Cette échéance est officielle et sourcée : elle ne peut pas être remplacée par un rappel." };
    const due = date ? new Date(`${date}T09:00:00`) : null;
    if (due && Number.isNaN(due.getTime())) return { ok: false, error: "Date invalide." };
    await db.update(journeyTasks).set({ dueAt: due, dueKind: due ? "personnel" : null, dueSource: null, updatedAt: new Date() }).where(eq(journeyTasks.id, t.id));
    await log(t.journeyId, user.id, due ? `Rappel personnel fixé au ${due.toLocaleDateString("fr-FR")} pour « ${t.label} ».` : `Rappel retiré pour « ${t.label} ».`);
    refresh(t.journeyId);
    return { ok: true, message: due ? "Rappel personnel enregistré." : "Rappel retiré." };
  } catch (e) { return fail(e, "Enregistrement impossible."); }
}

/** Relie un de vos documents à une étape. Cela ne transmet rien et ne partage le document avec personne. */
export async function attachTaskDocument(taskId: number, documentId: number | null): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const t = await ownTask(taskId, user.id);
    if (!t) return { ok: false, error: "Étape introuvable." };
    if (documentId) {
      const [d] = await db.select({ id: documents.id, filename: documents.filename }).from(documents).where(and(eq(documents.id, documentId), eq(documents.ownerId, user.id))).limit(1);
      if (!d) return { ok: false, error: "Document introuvable." };
      await db.update(journeyTasks).set({ documentId: d.id, updatedAt: new Date() }).where(eq(journeyTasks.id, t.id));
      await log(t.journeyId, user.id, `Document « ${d.filename} » relié à « ${t.label} » (non transmis).`);
    } else {
      await db.update(journeyTasks).set({ documentId: null, updatedAt: new Date() }).where(eq(journeyTasks.id, t.id));
      await log(t.journeyId, user.id, `Document retiré de « ${t.label} ».`);
    }
    refresh(t.journeyId);
    return { ok: true, message: documentId ? "Document relié. Il reste privé." : "Document retiré." };
  } catch (e) { return fail(e, "Action impossible."); }
}

export async function addPersonalTask(journeyId: number, label: string): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const j = await ownJourney(journeyId, user.id);
    const clean = label.trim();
    if (!j || clean.length < 3 || clean.length > 200) return { ok: false, error: "Décrivez l'action en quelques mots." };
    await db.insert(journeyTasks).values({ journeyId: j.id, kind: "action", label: clean, reason: "Action ajoutée par vous.", sortOrder: 999 });
    await log(j.id, user.id, `Action ajoutée : « ${clean} ».`);
    refresh(j.id);
    return { ok: true, message: "Action ajoutée." };
  } catch (e) { return fail(e, "Ajout impossible."); }
}

// ---------------------------------------------------------------- Engagement d'artiste

const LIVE = ["devis_accepte", "contrat_signe_declare", "embauche_declaree"] as const;

export async function sendEngagementRequest(journeyId: number, artistId: number, listingId: number | null, message: string): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const j = await ownJourney(journeyId, user.id);
    if (!j || j.situation !== "evenement" || j.status !== "en_cours") return { ok: false, error: "Démarche d'événement introuvable." };
    if (artistId === user.id) return { ok: false, error: "Vous ne pouvez pas vous engager vous-même." };
    const [artist] = await db.select({ id: artistProfiles.userId }).from(artistProfiles).innerJoin(users, eq(artistProfiles.userId, users.id)).where(and(eq(artistProfiles.userId, artistId), eq(users.isActive, true))).limit(1);
    if (!artist) return { ok: false, error: "Artiste introuvable." };
    if (listingId) {
      const [l] = await db.select({ id: communityListings.id }).from(communityListings).where(and(eq(communityListings.id, listingId), eq(communityListings.ownerId, artistId), eq(communityListings.status, "publiee"))).limit(1);
      if (!l) return { ok: false, error: "Prestation introuvable." };
    }
    const [open] = await db.select({ id: artistEngagements.id }).from(artistEngagements).where(and(eq(artistEngagements.journeyId, j.id), eq(artistEngagements.artistId, artistId), inArray(artistEngagements.status, ["demande_envoyee", "proposition_recue", ...LIVE]))).limit(1);
    if (open) return { ok: false, error: "Une demande est déjà en cours avec cet artiste." };
    const eventDate = new Date(`${j.answers.date}T12:00:00`);
    const [created] = await db.insert(artistEngagements).values({
      journeyId: j.id, projectId: j.projectId, organizerId: user.id, artistId, listingId, eventDate, requestMessage: message.trim().slice(0, 800),
    }).returning({ id: artistEngagements.id });
    await createNotification({ userId: artistId, title: "Nouvelle demande d'engagement", body: `${user.displayName ?? user.fullName} vous sollicite pour un événement le ${eventDate.toLocaleDateString("fr-FR")} à ${j.answers.lieu}.`, link: "/le-monde-aime/artiste" });
    await log(j.id, user.id, "Demande envoyée à un artiste.");
    refresh(j.id); revalidatePath("/le-monde-aime/artiste");
    return { ok: true, message: "Demande envoyée. L'artiste doit vous faire une proposition.", id: created.id };
  } catch (e) { return fail(e, "Envoi impossible."); }
}

async function engagementFor(id: number) {
  const [e] = await db.select().from(artistEngagements).where(eq(artistEngagements.id, id)).limit(1);
  return e ?? null;
}

/** L'artiste répond par une proposition (gratuite, chiffrée ou sur devis) et indique son cadre d'engagement. */
export async function proposeEngagement(id: number, mode: string, amount: string, framework: string, note: string): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const e = await engagementFor(id);
    if (!e || e.artistId !== user.id) return { ok: false, error: "Demande introuvable." };
    if (e.status !== "demande_envoyee") return { ok: false, error: "Une proposition a déjà été faite ou la demande est close." };
    if (!["gratuit", "montant", "devis"].includes(mode)) return { ok: false, error: "Choisissez gratuit, un montant ou sur devis." };
    if (!["salarie", "facture", "association", "inconnu"].includes(framework)) return { ok: false, error: "Indiquez votre cadre d'engagement (ou « Je ne sais pas »)." };
    const n = Number(amount.replace(",", "."));
    if (mode === "montant" && (!Number.isFinite(n) || n <= 0 || n > 100000)) return { ok: false, error: "Indiquez un montant valide." };
    await db.update(artistEngagements).set({ status: "proposition_recue", proposalMode: mode, proposalAmount: mode === "montant" ? n.toFixed(2) : null, proposalFramework: framework, proposalNote: note.trim().slice(0, 800), updatedAt: new Date() }).where(eq(artistEngagements.id, e.id));
    await createNotification({ userId: e.organizerId, title: "Proposition reçue d'un artiste", body: "Consultez-la dans votre démarche d'événement.", link: e.journeyId ? `/espace/demarches/suivi/${e.journeyId}` : "/espace" });
    if (e.journeyId) await log(e.journeyId, user.id, "Proposition reçue de l'artiste.");
    refresh(e.journeyId ?? undefined); revalidatePath("/le-monde-aime/artiste");
    return { ok: true, message: "Proposition envoyée à l'organisateur." };
  } catch (err) { return fail(err, "Envoi impossible."); }
}

/** Transitions explicites ; « accepter » vérifie côté serveur que l'artiste n'est pas déjà engagé le même jour. */
export async function advanceEngagement(id: number, action: "accepter" | "decliner" | "refuser" | "annuler" | "contrat" | "embauche", documentId?: number | null): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const result = await db.transaction(async (tx) => {
      const [e] = await tx.select().from(artistEngagements).where(eq(artistEngagements.id, id)).for("update").limit(1);
      if (!e) return { ok: false as const, error: "Engagement introuvable." };
      const organizer = e.organizerId === user.id;
      const artist = e.artistId === user.id;
      if (!organizer && !artist) return { ok: false as const, error: "Accès réservé aux personnes concernées." };
      let next: typeof e.status;
      let msg: string;
      let notify: number;
      if (action === "refuser") {
        if (!artist || e.status !== "demande_envoyee") return { ok: false as const, error: "Seul l'artiste peut refuser une demande en attente." };
        next = "refusee"; msg = "L'artiste a décliné la demande."; notify = e.organizerId;
      } else if (action === "decliner") {
        if (!organizer || e.status !== "proposition_recue") return { ok: false as const, error: "Seul l'organisateur peut décliner une proposition reçue." };
        next = "refusee"; msg = "Proposition déclinée par l'organisateur."; notify = e.artistId;
      } else if (action === "accepter") {
        if (!organizer || e.status !== "proposition_recue") return { ok: false as const, error: "Seul l'organisateur peut accepter une proposition reçue." };
        const day = new Date(e.eventDate); day.setHours(0, 0, 0, 0);
        const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1);
        const clash = await tx.select({ id: artistEngagements.id }).from(artistEngagements).where(and(eq(artistEngagements.artistId, e.artistId), ne(artistEngagements.id, e.id), inArray(artistEngagements.status, [...LIVE]), gte(artistEngagements.eventDate, day), lt(artistEngagements.eventDate, nextDay)));
        if (clash.length) return { ok: false as const, error: "Conflit : cet artiste est déjà engagé ce jour-là pour un autre événement." };
        next = "devis_accepte"; msg = "Proposition acceptée : participation confirmée entre vous (accord dans AIME®, pas une signature)."; notify = e.artistId;
        if (e.projectId) {
          await tx.insert(projectMembers).values({ projectId: e.projectId, userId: e.artistId, role: "participant", status: "accepte" })
            .onConflictDoUpdate({ target: [projectMembers.projectId, projectMembers.userId], set: { status: "accepte" } });
        }
      } else if (action === "annuler") {
        if (!["demande_envoyee", "proposition_recue", "devis_accepte"].includes(e.status)) return { ok: false as const, error: "Un engagement avec contrat déclaré ne s'annule pas ici : rapprochez-vous de l'autre partie." };
        next = "annulee"; msg = organizer ? "Engagement annulé par l'organisateur." : "Engagement annulé par l'artiste."; notify = organizer ? e.artistId : e.organizerId;
      } else if (action === "contrat") {
        if (!organizer || e.status !== "devis_accepte") return { ok: false as const, error: "Le contrat se déclare après acceptation de la proposition." };
        if (documentId) {
          const [d] = await tx.select({ id: documents.id }).from(documents).where(and(eq(documents.id, documentId), eq(documents.ownerId, user.id))).limit(1);
          if (!d) return { ok: false as const, error: "Document introuvable." };
        }
        next = "contrat_signe_declare"; msg = "Contrat déclaré signé par l'organisateur (non vérifié par AIME®)."; notify = e.artistId;
      } else {
        if (!organizer || e.status !== "contrat_signe_declare") return { ok: false as const, error: "L'embauche se déclare après le contrat." };
        if (e.proposalFramework === "facture") return { ok: false as const, error: "Vous avez indiqué une facture : il n'y a pas d'embauche à déclarer dans ce cadre. Si le cadre change, vérifiez-le d'abord." };
        next = "embauche_declaree"; msg = "Embauche déclarée par l'organisateur auprès de l'organisme compétent, selon lui (non vérifiée par AIME®)."; notify = e.artistId;
      }
      await tx.update(artistEngagements).set({ status: next, ...(action === "contrat" ? { contractDocumentId: documentId ?? null } : {}), updatedAt: new Date() }).where(eq(artistEngagements.id, e.id));
      return { ok: true as const, e, msg, notify };
    });
    if (!result.ok) return result;
    await createNotification({ userId: result.notify, title: "Mise à jour d'un engagement artistique", body: result.msg, link: result.notify === result.e.artistId ? "/le-monde-aime/artiste" : `/espace/demarches/suivi/${result.e.journeyId}` });
    if (result.e.journeyId) await log(result.e.journeyId, user.id, result.msg);
    refresh(result.e.journeyId ?? undefined); revalidatePath("/le-monde-aime/artiste");
    return { ok: true, message: result.msg };
  } catch (err) { return fail(err, "Action impossible."); }
}

// ---------------------------------------------------------------- Partage de documents

/** Partage explicite à une personne (par e-mail) ou à un projet que vous organisez/auquel vous participez. Révocable. */
export async function shareDocument(documentId: number, target: { email?: string; projectId?: number }): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const [d] = await db.select({ id: documents.id, filename: documents.filename }).from(documents).where(and(eq(documents.id, documentId), eq(documents.ownerId, user.id))).limit(1);
    if (!d) return { ok: false, error: "Seul le propriétaire peut partager ce document." };
    let granteeUserId: number | null = null;
    let projectId: number | null = null;
    if (target.email) {
      const [g] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, target.email.trim().toLowerCase()), eq(users.isActive, true))).limit(1);
      if (!g || g.id === user.id) return { ok: false, error: "Aucun autre compte ne correspond à cette adresse." };
      granteeUserId = g.id;
    } else if (target.projectId) {
      const [m] = await db.select().from(projectMembers).where(and(eq(projectMembers.projectId, target.projectId), eq(projectMembers.userId, user.id), eq(projectMembers.status, "accepte"))).limit(1);
      if (!m) return { ok: false, error: "Vous ne participez pas à ce projet." };
      projectId = target.projectId;
    } else return { ok: false, error: "Choisissez une personne ou un projet." };
    const existing = await db.select({ id: documentShares.id }).from(documentShares).where(and(eq(documentShares.documentId, d.id), isNull(documentShares.revokedAt), granteeUserId ? eq(documentShares.granteeUserId, granteeUserId) : eq(documentShares.projectId, projectId!))).limit(1);
    if (existing.length) return { ok: false, error: "Ce partage existe déjà." };
    await db.insert(documentShares).values({ documentId: d.id, ownerId: user.id, granteeUserId, projectId });
    if (granteeUserId) await createNotification({ userId: granteeUserId, title: "Un document a été partagé avec vous", body: `« ${d.filename} »`, link: "/espace/documents" });
    await logAudit({ actorId: user.id, action: "partage_document", entityType: "document", entityId: String(d.id) });
    revalidatePath("/espace/documents");
    return { ok: true, message: granteeUserId ? "Document partagé avec cette personne uniquement." : "Document partagé avec les participants acceptés de ce projet." };
  } catch (e) { return fail(e, "Partage impossible."); }
}

export async function revokeShare(shareId: number): Promise<JResult> {
  try {
    const user = await requireRole(["membre"]);
    const [s] = await db.select().from(documentShares).where(eq(documentShares.id, shareId)).limit(1);
    if (!s || s.ownerId !== user.id || s.revokedAt) return { ok: false, error: "Partage introuvable." };
    await db.update(documentShares).set({ revokedAt: new Date() }).where(eq(documentShares.id, s.id));
    await logAudit({ actorId: user.id, action: "revocation_partage", entityType: "document", entityId: String(s.documentId) });
    revalidatePath("/espace/documents");
    return { ok: true, message: "Accès révoqué immédiatement." };
  } catch (e) { return fail(e, "Révocation impossible."); }
}

// ---------------------------------------------------------------- Annuaire administrable

export async function updateOrganism(form: FormData): Promise<JResult> {
  try {
    const admin = await requireRole(["administrateur"]);
    const id = Number(form.get("id"));
    const s = (k: string) => String(form.get(k) ?? "").trim();
    if (!/^https:\/\//.test(s("url"))) return { ok: false, error: "Le lien officiel doit commencer par https://." };
    const verify = form.get("verify") === "on";
    await db.update(organisms).set({
      name: s("name").slice(0, 160), role: s("role").slice(0, 1000), audience: s("audience").slice(0, 300), territory: s("territory").slice(0, 120) || "National",
      url: s("url").slice(0, 300), source: s("source").slice(0, 300),
      ...(verify ? { contentStatus: "verifie", linkStatus: "verifie", verifiedAt: new Date() } : {}),
      updatedAt: new Date(),
    }).where(eq(organisms.id, id));
    await logAudit({ actorId: admin.id, action: verify ? "verification_organisme" : "maj_organisme", entityType: "organism", entityId: String(id) });
    revalidatePath("/admin/organismes"); revalidatePath("/accompagnement");
    return { ok: true, message: verify ? "Fiche enregistrée et marquée vérifiée aujourd'hui." : "Fiche enregistrée." };
  } catch (e) { return e instanceof AuthError ? { ok: false, error: "Réservé à l'administration." } : { ok: false, error: "Enregistrement impossible." }; }
}

/**
 * Situations qui correspondent à une procédure de bureau existante.
 * Les autres parcours transmis tombent sur la procédure générique
 * « parcours-transmis » : le dossier reprend alors le titre, le résumé,
 * les étapes et les pièces du parcours (chantier 2, temps 2).
 */
const SITUATION_PROCEDURE_SLUG: Record<string, string> = {
  famille: "changement-situation-familiale",
  logement: "demande-aide-logement",
  retraite: "demande-retraite-agricole",
};

/**
 * Transmettre son parcours à son bureau d'accompagnement : le parcours
 * « devient » un dossier instruit (un seul objet suit le membre, pas de
 * doublon). Idempotent : un parcours déjà transmis renvoie à son dossier.
 * Le parcours reste consultable ; ses pièces sont rattachées au dossier.
 */
export async function transmitJourneyToBureau(formData: FormData) {
  const journeyId = Number(formData.get("journeyId"));
  if (!Number.isSafeInteger(journeyId)) redirect("/espace/demarches");

  let user;
  try {
    user = await requireRole(["membre"]);
  } catch {
    redirect("/connexion");
  }

  const journey = await ownJourney(journeyId, user!.id);
  if (!journey) redirect("/espace/demarches");
  if (journey!.status === "questionnaire") {
    redirect(`/espace/demarches/suivi/${journeyId}?erreur=${encodeURIComponent("Terminez d'abord le questionnaire : c'est lui qui préparera votre dossier.")}`);
  }

  const [existing] = await db.select({ id: cases.id }).from(cases).where(eq(cases.journeyId, journeyId)).limit(1);
  if (existing) redirect(`/espace/demarches/${existing.id}`);

  const slug = SITUATION_PROCEDURE_SLUG[journey!.situation] ?? "parcours-transmis";
  const [procedure] = await db.select().from(procedureTypes).where(eq(procedureTypes.slug, slug)).limit(1);
  if (!procedure) {
    redirect(`/espace/demarches/suivi/${journeyId}?erreur=${encodeURIComponent("La transmission n'est pas disponible pour le moment.")}`);
  }

  const tasks = await db.select().from(journeyTasks).where(eq(journeyTasks.journeyId, journeyId)).orderBy(asc(journeyTasks.sortOrder), asc(journeyTasks.id));
  const actions = tasks.filter((t) => t.kind === "action");
  const done = actions.filter((t) => ["termine", "effectue_declare"].includes(t.status)).length;
  const next = actions.find((t) => !["termine", "effectue_declare"].includes(t.status));
  const pieceDocIds = Array.from(new Set(tasks.map((t) => t.documentId).filter((v): v is number => !!v)));

  // Reprise des réponses dont le nom correspond à un champ du dossier ;
  // le résumé du parcours nourrit la procédure générique.
  const data: Record<string, string> = {};
  for (const field of procedure!.fields) {
    if (journey!.answers[field.name]) data[field.name] = journey!.answers[field.name];
  }
  if (slug === "parcours-transmis" && journey!.summary && !data.resume) data.resume = journey!.summary;

  const reference = generateCaseReference();
  const [created] = await db.insert(cases).values({
    reference,
    memberId: user!.id,
    procedureTypeId: procedure!.id,
    journeyId,
    officeId: user!.officeId ?? null,
    status: "envoyee",
    title: journey!.title,
    data,
    requestedDocuments: [],
    submittedAt: new Date(),
  }).returning();

  await db.insert(caseEvents).values({
    caseId: created.id,
    actorId: user!.id,
    type: "creation",
    message: `Dossier créé par transmission du parcours « ${journey!.title} » : ${done}/${actions.length} étapes faites${next ? `, prochaine étape restée en attente : « ${next.label} »` : ""}${pieceDocIds.length ? `, ${pieceDocIds.length} pièce(s) reprise(s) du parcours` : ""}.`,
  });
  await db.insert(caseEvents).values({
    caseId: created.id,
    actorId: user!.id,
    type: "soumission",
    message: "Transmis au bureau d'accompagnement depuis le parcours guidé. Le suivi continue ici ; le parcours reste consultable.",
  });

  // Les pièces préparées dans le parcours sont rattachées au dossier.
  if (pieceDocIds.length) {
    await db.update(documents).set({ caseId: created.id }).where(and(inArray(documents.id, pieceDocIds), eq(documents.ownerId, user!.id)));
  }

  await log(journeyId, user!.id, `Parcours transmis à votre bureau d'accompagnement — dossier ${reference}. Le suivi continue dans le dossier.`);
  await logAudit({ actorId: user!.id, action: "transmission_parcours", entityType: "journey", entityId: journeyId, metadata: { dossier: reference } });
  revalidatePath("/espace/demarches");
  redirect(`/espace/demarches/${created.id}`);
}
