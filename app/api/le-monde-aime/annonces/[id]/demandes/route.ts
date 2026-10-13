import { requestCommunityListing } from "@/lib/actions/community";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: raw } = await context.params;
  const listingId = Number(raw);
  if (!Number.isSafeInteger(listingId) || listingId < 1) return Response.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return Response.json({ ok: false, error: "Demande invalide." }, { status: 400 }); }
  const form = new FormData();
  form.set("listingId", String(listingId));
  form.set("quantity", String(body.quantity ?? 1));
  form.set("message", typeof body.message === "string" ? body.message : "");
  if (typeof body.startsAt === "string") form.set("startsAt", body.startsAt);
  if (typeof body.endsAt === "string") form.set("endsAt", body.endsAt);
  if (typeof body.eventPlanId === "number") form.set("eventPlanId", String(body.eventPlanId));
  const result = await requestCommunityListing(form);
  return Response.json(result, { status: result.ok ? 201 : result.error.includes("Connectez-vous") ? 401 : 400 });
}
