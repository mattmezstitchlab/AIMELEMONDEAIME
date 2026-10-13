import { createCommunityListing } from "@/lib/actions/community";

import { communityErrorStatus } from "@/lib/api-status";

export const runtime = "nodejs";

/** Création REST pour les clients externes ; validation et autorisation dans l'action métier partagée. */
export async function POST(request: Request) {
  let form: FormData;
  try { form = await request.formData(); }
  catch { return Response.json({ ok: false, error: "Formulaire invalide." }, { status: 400 }); }
  const result = await createCommunityListing(form);
  return Response.json(result, { status: result.ok ? 201 : communityErrorStatus("creation", result.error) });
}
