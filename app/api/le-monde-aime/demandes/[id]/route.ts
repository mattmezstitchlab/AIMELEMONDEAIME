import { advanceCommunityRequest, decideCommunityRequest } from "@/lib/actions/community";

import { communityErrorStatus } from "@/lib/api-status";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id: raw } = await context.params;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) return Response.json({ ok: false, error: "Demande introuvable." }, { status: 404 });
  let body: { decision?: string; step?: string };
  try { body = await request.json(); }
  catch { return Response.json({ ok: false, error: "Modification invalide." }, { status: 400 }); }
  const result = body.decision === "accepter" || body.decision === "refuser"
    ? await decideCommunityRequest(id, body.decision)
    : ["remettre", "confirmer", "retourner", "annuler"].includes(body.step ?? "")
      ? await advanceCommunityRequest(id, body.step as "remettre" | "confirmer" | "retourner" | "annuler")
      : { ok: false as const, error: "Choisissez accepter, refuser ou une étape d'échange valide." };
  return Response.json(result, { status: result.ok ? 200 : communityErrorStatus("decision", result.error) });
}
