import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityExplorerData, getMyCommunityData } from "@/lib/community-queries";
import { getMapLocalPoints } from "@/lib/queries";
import { getExplorerExtras } from "@/lib/lma-queries";
import { CommunityApp } from "@/components/community/lma-app";
import { PublicPage } from "@/components/public-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Explorer, publier, se relier — Le Monde Aime",
  description: "La terre, les arts et les générations. Trouvez près de vous de quoi vivre, créer et transmettre.",
};

export default async function LeMondeAimePage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  // « Mes liens » est désormais intégré à l'espace personnel unique.
  if ((await searchParams).onglet === "liens") redirect("/espace");
  const [explorer, user, legacyPoints, extras] = await Promise.all([getCommunityExplorerData(), getCurrentUser(), getMapLocalPoints(), getExplorerExtras()]);
  const isMember = user?.role === "membre";
  const mine = isMember ? await getMyCommunityData(user!.id) : null;
  const servicePins = legacyPoints.map((p) => ({
    id: p.id, name: p.name, city: p.city, lat: Number(p.lat), lng: Number(p.lng),
    products: p.products.map((x) => ({ id: x.id, name: x.name, description: x.description, price: x.price, unit: x.unit, stock: x.stock })),
  }));
  return (
    <PublicPage solidHeader lma>
      <Suspense fallback={null}>
        <CommunityApp data={{ ...explorer, servicePins, people: extras.people, projects: extras.projects, stories: extras.stories, mine, user: user ? { id: user.id, role: user.role } : null }} />
      </Suspense>
    </PublicPage>
  );
}
