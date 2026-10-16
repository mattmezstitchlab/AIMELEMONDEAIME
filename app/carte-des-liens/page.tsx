import type { Metadata } from "next";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { LinkMapExplorer } from "@/components/link-map-explorer";
export const metadata: Metadata = { title: "Carte des liens — AIME®", description: "Explorer les parcours, ressources et organismes référencés : comprendre les orientations possibles, sans transmission automatique." };
export default function LinkMapPage() {
  return <PublicPage><PageColumn className="py-10 sm:py-16">
    <p className="eyebrow">Comprendre le système, trouver son chemin</p>
    <h1 className="mt-4 text-4xl sm:text-6xl">La carte des liens.</h1>
    <p className="mt-5 max-w-3xl text-base leading-relaxed text-ink-3">Un premier regard sur les moments de vie, les organismes et les ressources qui peuvent se croiser. Choisissez un point pour voir ses relais possibles.</p>
    <p className="mt-6 rounded-card bg-subtle p-5 text-sm leading-relaxed">Carte exploratoire partielle, pas une représentation complète du fonctionnement de la France. Les traits indiquent des orientations possibles ou des ressources : ni partenariat, ni éligibilité, ni échange de données. Les relations entre institutions et vos relations personnelles ne sont pas encore cartographiées.</p>
    <LinkMapExplorer />
  </PageColumn></PublicPage>;
}
