import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { circleMembers, circlePosts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** Photo d'un partage : visible des membres du cercle, ou de tous si l'auteur l'a publiée. */
export async function GET(_req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) return new Response("Introuvable", { status: 404 });
  const [post] = await db.select().from(circlePosts).where(eq(circlePosts.id, id)).limit(1);
  if (!post || !post.photoData || !post.photoMime) return new Response("Introuvable", { status: 404 });
  if (post.visibility !== "publie") {
    const user = await getCurrentUser();
    if (!user) return new Response("Introuvable", { status: 404 });
    const [member] = await db.select({ id: circleMembers.id }).from(circleMembers)
      .where(and(eq(circleMembers.circleId, post.circleId), eq(circleMembers.userId, user.id), eq(circleMembers.status, "accepte"))).limit(1);
    if (!member) return new Response("Introuvable", { status: 404 });
  }
  return new Response(new Uint8Array(post.photoData), {
    headers: { "Content-Type": post.photoMime, "Cache-Control": post.visibility === "publie" ? "public, max-age=60" : "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
