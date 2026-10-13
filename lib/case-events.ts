import "server-only";

import { db } from "@/db";
import { caseEvents } from "@/db/schema";

/**
 * Helpers serveur internes — NE PAS placer dans un fichier "use server" :
 * chaque fonction exportée d'un tel fichier devient un endpoint public
 * (Server Action) invocable par n'importe qui, sans authentification.
 * Les appelants doivent donc avoir déjà vérifié les droits avant d'appeler.
 */
export async function linkDocumentEvent(caseId: number, documentName: string, actorId: number) {
  await db.insert(caseEvents).values({
    caseId,
    actorId,
    type: "document_ajoute",
    message: `Document ajouté : ${documentName}`,
  });
}
