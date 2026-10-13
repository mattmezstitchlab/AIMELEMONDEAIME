import { getCurrentUser } from "@/lib/auth";
import { getJourneyDetail } from "@/lib/journey-queries";
import { ENGAGEMENT_STATUS_LABEL, RULES_VERSION, SITUATION_BY_KEY, TASK_STATUS_LABEL } from "@/lib/situations";

type Ctx = { params: Promise<{ id: string }> };

/** Récapitulatif exportable, réservé au propriétaire de la démarche. */
export async function GET(_req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const user = await getCurrentUser();
  if (!user) return new Response("Authentification requise", { status: 401 });
  if (!Number.isSafeInteger(id)) return new Response("Introuvable", { status: 404 });
  const d = await getJourneyDetail(id, user.id);
  if (!d) return new Response("Introuvable", { status: 404 });
  const def = SITUATION_BY_KEY.get(d.journey.situation);
  const orgs = new Map(d.organisms.map((o) => [o.slug, o]));
  const lines = [
    `AIME® — Récapitulatif de démarche (document de préparation, sans valeur officielle)`,
    `Édité le ${new Date().toLocaleDateString("fr-FR")} · règles ${d.journey.rulesVersion || RULES_VERSION}`,
    ``, `# ${d.journey.title} (${def?.short ?? d.journey.situation})`, ``, `## Ma situation`, d.journey.summary || "—", ``,
    `## Étapes`,
    ...d.tasks.filter((t) => t.kind === "action").map((t, i) => `${i + 1}. [${TASK_STATUS_LABEL[t.status]}] ${t.label}${t.frameworkFlag === "cadre_a_verifier" ? " — CADRE À VÉRIFIER" : ""}\n   Pourquoi : ${t.reason}${t.organismSlugs.length ? `\n   Interlocuteur(s) : ${t.organismSlugs.map((s) => orgs.get(s)?.name ?? s).join(", ")}` : ""}${t.officialUrl ? `\n   Lien officiel : ${t.officialUrl}` : ""}${t.dueAt ? `\n   ${t.dueKind === "officielle" ? "Échéance officielle" : "Rappel personnel"} : ${t.dueAt.toLocaleDateString("fr-FR")}` : ""}`),
    ``, `## Pièces à préparer`, ...d.tasks.filter((t) => t.kind === "piece").map((t) => `- [${TASK_STATUS_LABEL[t.status]}] ${t.label}`),
    ...(d.engagements.length ? [``, `## Engagements d'artistes`, ...d.engagements.map((e) => `- ${e.artistName} : ${ENGAGEMENT_STATUS_LABEL[e.status]}`)] : []),
    ``, `Les statuts « Effectué selon vous », « Contrat signé (déclaré) » et « Embauche déclarée » sont des déclarations de l'utilisateur, non vérifiées.`,
    `Aucune donnée n'a été transmise à un organisme par AIME®. Les organismes compétents restent responsables de leurs décisions.`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="recapitulatif-demarche-${id}.txt"`, "Cache-Control": "private, no-store" } });
}
