import { sendCommunityMessage } from "@/lib/actions/community";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: raw } = await context.params;
  const requestId = Number(raw);
  if (!Number.isSafeInteger(requestId) || requestId < 1) return Response.json({ ok: false, error: "Échange introuvable." }, { status: 404 });
  let body: { body?: string };
  try { body = await request.json(); }
  catch { return Response.json({ ok: false, error: "Message invalide." }, { status: 400 }); }
  const result = await sendCommunityMessage(requestId, typeof body.body === "string" ? body.body : "");
  return Response.json(result, { status: result.ok ? 201 : result.error.includes("Connexion") ? 401 : result.error.includes("participants") ? 403 : 400 });
}
