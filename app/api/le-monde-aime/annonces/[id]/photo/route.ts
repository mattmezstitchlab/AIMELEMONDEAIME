import { eq } from "drizzle-orm";
import { db } from "@/db";
import { communityListings } from "@/db/schema";

type RouteContext = { params: Promise<{ id: string }> };
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(_request: Request, context: RouteContext) {
  const { id: raw } = await context.params;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: "Annonce introuvable." }, { status: 404 });
  const [listing] = await db.select({ photoData: communityListings.photoData, photoMime: communityListings.photoMime, status: communityListings.status })
    .from(communityListings).where(eq(communityListings.id, id)).limit(1);
  if (!listing || listing.status !== "publiee" || !listing.photoData || !listing.photoMime || !ALLOWED.has(listing.photoMime)) {
    return Response.json({ error: "Photo indisponible." }, { status: 404 });
  }
  return new Response(new Uint8Array(listing.photoData), {
    headers: {
      "Content-Type": listing.photoMime,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Length": String(listing.photoData.length),
    },
  });
}
