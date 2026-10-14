import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityExplorerData, getMyCommunityData } from "@/lib/community-queries";
import { getMapLocalPoints } from "@/lib/queries";
import { getExplorerExtras } from "@/lib/lma-queries";
import { CommunityApp } from "@/components/community/lma-app";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { PageIntro } from "@/components/marketing/tiles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Explorer, publier, se relier — Le Monde Aime",
  description: "La terre, les arts et les générations. Trouvez près de vous de quoi vivre, créer et transmettre.",
};

export default async function LeMondeAimePage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  // « Mes liens » est désormais intégré à l’espace personnel unique.
  if ((await searchParams).onglet === "liens") redirect("/espace");
  const [explorer, user, legacyPoints, extras] = await Promise.all([
    getCommunityExplorerData().catch(() => ({ listings: [], trips: [], servicePins: [], agencies: [] })),
    getCurrentUser(),
    getMapLocalPoints().catch(() => []),
    getExplorerExtras().catch(() => ({ people: [], projects: [], stories: [] })),
  ]);
  const isMember = user?.role === "membre";
  const mine = isMember ? await getMyCommunityData(user!.id) : null;
  const servicePins = legacyPoints.map((p) => ({
    id: p.id, name: p.name, city: p.city, lat: Number(p.lat), lng: Number(p.lng),
    products: p.products.map((x) => ({ id: x.id, name: x.name, description: x.description, price: x.price, unit: x.unit, stock: x.stock })),
  }));
  return (
    <PublicPage>
      <PageColumn className="pt-4 sm:pt-6">
        <PageIntro
          eyebrow="Le Monde Aime"
          title="La terre, les arts et les générations."
          text="Producteurs, artistes, associations, projets et entraide : la carte réunit ce qui se passe près de chez vous. Publication libre, coordonnées approximatives, aucune adresse privée exposée."
        />
      </PageColumn>

      {/* Surface applicative : la carte reste sur fond clair, comme un écran
          embarqué dans la page sombre. */}
      <div className="mx-auto mt-5 w-full max-w-[86rem] px-3 sm:px-5">
        <div className="theme-light overflow-hidden rounded-[1.5rem] bg-canvas ring-1 ring-line">
          <Suspense fallback={null}>
            <CommunityApp data={{ ...explorer, servicePins, people: extras.people, projects: extras.projects, stories: extras.stories, mine, user: user ? { id: user.id, role: user.role } : null }} />
          </Suspense>
        </div>
      </div>
    </PublicPage>
  );
}
