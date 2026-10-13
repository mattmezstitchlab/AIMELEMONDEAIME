"use server";

/**
 * Assistant niveau 2 (voir AUDIT-DEMARCHES-ASSISTANT.md) : les seules
 * écritures que l'assistant peut déclencher, et uniquement après la
 * confirmation explicite du membre dans le panneau de conversation.
 *
 * Garanties, dans l'ordre où elles s'appliquent :
 *  1. le widget ne propose ces actions qu'à un membre connecté (jamais à la
 *     visite guidée, en lecture seule) ;
 *  2. chaque action revérifie ici le rôle, refuse la session de démonstration
 *     et délègue aux actions serveur existantes, qui revérifient la propriété
 *     des données (parcours, étape) ;
 *  3. chaque exécution est tracée dans le journal d'audit avec sa provenance.
 *
 * Lignes rouges : aucune décision de droit, aucun calcul de montant, aucun
 * envoi à un organisme extérieur. La transmission vise uniquement le bureau
 * d'accompagnement du membre, destinataire habituel de ses dossiers.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys } from "@/db/schema";
import { AuthError, getSession, requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { SITUATION_BY_KEY } from "@/lib/situations";
import { saveJourneyDraft, setTaskReminder, transmitJourneyCore } from "@/lib/actions/journeys";

export type AResult = { ok: true; message: string; id?: number } | { ok: false; error: string };

const VIA = "assistant_niveau_2";

async function membreActif(): Promise<{ id: number; officeId: number | null }> {
  const user = await requireRole(["membre"]);
  const session = await getSession();
  if (session?.demo === true) {
    throw new Error("La visite guidée est en lecture seule : cette action est désactivée.");
  }
  return user;
}

const refuse = (e: unknown): AResult =>
  e instanceof AuthError
    ? { ok: false, error: "Connectez-vous avec un compte membre." }
    : { ok: false, error: e instanceof Error ? e.message : "Action impossible." };

/** Crée un brouillon de parcours (questionnaire vide, reprise possible). */
export async function assistantCreateDraft(situation: string): Promise<AResult> {
  try {
    const user = await membreActif();
    const def = SITUATION_BY_KEY.get(situation);
    if (!def) return { ok: false, error: "Situation inconnue." };

    // Idempotent : un brouillon de la même situation se reprend, pas de doublon.
    const [existing] = await db
      .select({ id: journeys.id })
      .from(journeys)
      .where(and(eq(journeys.userId, user.id), eq(journeys.situation, situation), eq(journeys.status, "questionnaire")))
      .limit(1);
    if (existing) {
      await logAudit({ actorId: user.id, action: "assistant_creation_brouillon", entityType: "journey", entityId: existing.id, metadata: { situation, via: VIA, issue: "brouillon_existant" } });
      return { ok: true, message: `Vous aviez déjà un brouillon « ${def.short} » en cours : le voici, vous pouvez le reprendre.`, id: existing.id };
    }

    const created = await saveJourneyDraft(situation, {});
    if (!created.ok) return created;
    await logAudit({ actorId: user.id, action: "assistant_creation_brouillon", entityType: "journey", entityId: created.id, metadata: { situation, via: VIA } });
    return { ok: true, message: `Brouillon « ${def.short} » créé dans Mes démarches. Rien n'a été envoyé : répondez aux questions à votre rythme, le parcours préparera ensuite vos étapes.`, id: created.id };
  } catch (e) {
    return refuse(e);
  }
}

/** Pose un rappel personnel sur une étape du membre (jamais officiel). */
export async function assistantSetReminder(taskId: number, date: string): Promise<AResult> {
  try {
    const user = await membreActif();
    if (!Number.isSafeInteger(taskId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { ok: false, error: "Rappel invalide." };
    }
    const result = await setTaskReminder(taskId, date);
    if (!result.ok) return result;
    await logAudit({ actorId: user.id, action: "assistant_rappel", entityType: "journey_task", entityId: taskId, metadata: { date, via: VIA } });
    const fr = new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return { ok: true, message: `Rappel personnel posé pour le ${fr}. Vous serez prévenu·e à l'approche de l'échéance ; ce rappel n'a rien d'officiel.` };
  } catch (e) {
    return refuse(e);
  }
}

/** Transmet un parcours terminé au bureau d'accompagnement du membre. */
export async function assistantTransmit(journeyId: number): Promise<AResult> {
  try {
    const user = await membreActif();
    if (!Number.isSafeInteger(journeyId)) return { ok: false, error: "Parcours invalide." };
    const result = await transmitJourneyCore(journeyId, user);
    if (!result.ok) return result;
    await logAudit({ actorId: user.id, action: "assistant_transmission", entityType: "journey", entityId: journeyId, metadata: { via: VIA, dossier: result.reference, deja_transmis: result.already ? "oui" : "non" } });
    return {
      ok: true,
      message: result.already
        ? `Ce parcours avait déjà été transmis : voici son dossier ${result.reference}.`
        : `Parcours transmis à votre bureau d'accompagnement — dossier ${result.reference}. Le suivi continue dans le dossier ; votre bureau pourra vous demander des pièces, et vous serez prévenu·e ici.`,
      id: result.caseId,
    };
  } catch (e) {
    return refuse(e);
  }
}
