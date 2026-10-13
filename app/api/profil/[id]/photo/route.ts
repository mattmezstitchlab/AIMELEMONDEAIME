import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { profilePhotos, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** Photo de profil : publique seulement si la personne a choisi d'apparaître sur la carte. */
export async function GET(_req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) return new Response("Introuvable", { status: 404 });
  const [row] = await db.select({ data: profilePhotos.data, mime: profilePhotos.mime, visible: users.profileVisible, active: users.isActive })
    .from(profilePhotos).innerJoin(users, eq(profilePhotos.userId, users.id)).where(and(eq(profilePhotos.userId, id))).limit(1);
  if (!row || !row.active) return new Response("Introuvable", { status: 404 });
  if (!row.visible) {
    const viewer = await getCurrentUser();
    if (!viewer || viewer.id !== id) return new Response("Introuvable", { status: 404 });
  }
  return new Response(new Uint8Array(row.data), { headers: { "Content-Type": row.mime, "Cache-Control": "private, max-age=60", "X-Content-Type-Options": "nosniff" } });
}
