import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityExplorerData, getMyCommunityData } from "@/lib/community-queries";
import { getLocalStructures } from "@/lib/queries";
import { getExplorerExtras } from "@/lib/lma-queries";
import { CommunityApp } from "@/components/community/lma-app";
import { PublicPage } from "@/components/public-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Explorer, publier, se relier — Le Monde Aime",
  description: "La terre, les arts et les générations : trouver près de chez soi de quoi vivre, créer et transmettre, commune par commune.",
};

export default async function LeMondeAimePage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  // « Mes liens » est intégré à l’espace personnel unique.
  if ((await searchParams).onglet === "liens") redirect("/espace");
  const [explorer, user, structures, extras] = await Promise.all([
    getCommunityExplorerData().catch(() => ({ listings: [], trips: [], servicePins: [], agencies: [] })),
    getCurrentUser(),
    getLocalStructures().catch(() => []),
    getExplorerExtras().catch(() => ({ people: [], projects: [], stories: [] })),
  ]);
  const isMember = user?.role === "membre";
  const mine = isMember ? await getMyCommunityData(user!.id) : null;
  // Les fiches de producteurs viennent du circuit des producteurs : la même
  // liste, ici en résumé, avec un lien vers leur tableau complet.
  const servicePins = structures
    .filter((p) => p.kind === "producteur")
    .map((p) => ({
      id: p.id, name: p.name, city: p.city, lat: Number(p.lat), lng: Number(p.lng),
      products: p.products.map((x) => ({ id: x.id, name: x.name, description: x.description, price: x.price, unit: x.unit, stock: x.stock })),
    }));
  return (
    <PublicPage>
      <Suspense fallback={<div className="mx-auto max-w-[1200px] px-4 py-16 text-sm text-ink-3 sm:px-6">Chargement des publications…</div>}>
        <CommunityApp data={{ ...explorer, servicePins, people: extras.people, projects: extras.projects, stories: extras.stories, mine, user: user ? { id: user.id, role: user.role } : null }} />
      </Suspense>
    </PublicPage>
  );
}
