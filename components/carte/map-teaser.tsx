"use client";

import { FranceMap, type MapPin } from "@/components/carte/france-map";
import { Icon } from "@/components/icon";

const TEASER_PINS: MapPin[] = [
  { id: "t1", kind: "agence", name: "Point d’accueil", subtitle: "Paris", lat: 48.85, lng: 2.35 },
  { id: "t2", kind: "agence", name: "Point d’accueil", subtitle: "Lyon", lat: 45.76, lng: 4.84 },
  { id: "t3", kind: "agence", name: "Point d’accueil", subtitle: "Nantes", lat: 47.22, lng: -1.55 },
  { id: "t4", kind: "agence", name: "Point d’accueil", subtitle: "Bordeaux", lat: 44.84, lng: -0.58 },
  { id: "t5", kind: "agence", name: "Point d’accueil", subtitle: "Lille", lat: 50.63, lng: 3.06 },
  { id: "t6", kind: "producteur", name: "Production locale", subtitle: "Bretagne", lat: 48.51, lng: -2.76 },
  { id: "t7", kind: "producteur", name: "Production locale", subtitle: "Beauce", lat: 48.45, lng: 1.49 },
  { id: "t8", kind: "disponible", name: "Jeune disponible", subtitle: "Toulouse", lat: 43.6, lng: 1.44 },
];

/** Aperçu statique de la carte, utilisé sur la page d’accueil. */
export function MapTeaser() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <FranceMap pins={TEASER_PINS} selectedId={null} onSelect={() => {}} />
    </div>
  );
}

export function MapTeaserLegend() {
  return (
    <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
      <li className="flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-ink" aria-hidden="true" /> Agences</li>
      <li className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 ring-ink-4 bg-canvas" aria-hidden="true" /> Production locale</li>
      <li className="flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-amber-400" aria-hidden="true" /> Jeunes disponibles</li>
    </ul>
  );
}

export function MapTeaserIcon() {
  return <Icon name="pin" className="h-5 w-5" />;
}
