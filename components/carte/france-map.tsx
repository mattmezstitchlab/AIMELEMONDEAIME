"use client";

import { useRef, useState } from "react";
import { FRANCE_REGIONS, MAP_SIZE, projectLatLng, unprojectPoint } from "@/components/france-map-data";
import { Icon, type IconName } from "@/components/icon";

export type MapPinKind = "agence" | "producteur" | "presence" | "disponible" | "offre" | "besoin" | "personne" | "lieu" | "projet";

export type MapPin = {
  id: string;
  kind: MapPinKind;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  badge?: string;
  clusterCount?: number;
};

/* Palette Bauhaus : primaires + encre. Offres = vermillon, besoins = bleu, personnes = violet,
   projets = jaune, trajets = rose, lieux = gris clair, structures externes = encre. */
const KIND_STYLE: Record<MapPinKind, { ring: string; bg: string; text: string; icon: IconName; label: string }> = {
  agence: { ring: "ring-slate-500", bg: "bg-slate-600", text: "text-white", icon: "building", label: "Structure externe" },
  producteur: { ring: "ring-orange-500", bg: "bg-orange-600", text: "text-white", icon: "leaf", label: "Production locale" },
  presence: { ring: "ring-slate-300", bg: "bg-slate-400", text: "text-white", icon: "entraide", label: "Présence / entraide" },
  disponible: { ring: "ring-pink-400", bg: "bg-pink-500", text: "text-white", icon: "velo", label: "Trajet" },
  offre: { ring: "ring-orange-500", bg: "bg-orange-600", text: "text-white", icon: "boutique", label: "Offre" },
  besoin: { ring: "ring-blue-500", bg: "bg-blue-600", text: "text-white", icon: "search", label: "Besoin" },
  personne: { ring: "ring-violet-500", bg: "bg-violet-600", text: "text-white", icon: "user", label: "Personne" },
  lieu: { ring: "ring-slate-300", bg: "bg-slate-400", text: "text-white", icon: "pin", label: "Lieu" },
  projet: { ring: "ring-yellow-300", bg: "bg-yellow-400", text: "text-gray-900", icon: "calendar", label: "Projet" },
};

export const MAP_KIND_LABEL = KIND_STYLE;

function PinButton({ pin, selected, onSelect }: { pin: MapPin; selected: boolean; onSelect: (pin: MapPin) => void }) {
  const { x, y } = projectLatLng(pin.lat, pin.lng);
  const style = KIND_STYLE[pin.kind];
  return (
    <button
      type="button"
      onClick={() => onSelect(pin)}
      aria-label={`${style.label} : ${pin.name}${pin.badge ? ` (${pin.badge})` : ""}`}
      aria-pressed={selected}
       className={`pointer-events-auto absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-2 shadow-rested transition duration-200 hover:z-20 hover:scale-110 ${style.bg} ${style.ring} ${style.text} ${
         selected ? "z-20 scale-110 ring-4 ring-slate-900/35" : "z-10"
       }`}
      style={{ left: `${(x / MAP_SIZE) * 100}%`, top: `${(y / MAP_SIZE) * 100}%` }}
    >
      {pin.clusterCount ? <span className="text-[10px] font-extrabold leading-none">{pin.clusterCount}</span> : <Icon name={style.icon} className="h-4 w-4" />}
    </button>
  );
}

export function FranceMap({
  pins,
  selectedId,
  onSelect,
  onPickLocation,
  canPlacePin,
  maxWidthClass = "max-w-2xl",
  fill = false,
}: {
  pins: MapPin[];
  selectedId: string | null;
  onSelect: (pin: MapPin) => void;
  onPickLocation?: (coords: { lat: number; lng: number }) => void;
  canPlacePin?: boolean;
  maxWidthClass?: string;
  /** Mode plein cadre : la carte occupe tout son conteneur, les panneaux flottent autour. */
  fill?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);

  function handleClick(event: React.MouseEvent<SVGSVGElement>) {
    if (!onPickLocation) return;
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(ctm.inverse());
    onPickLocation(unprojectPoint(local.x, local.y));
  }

  return (
    <div data-assistant-id="carte-map" className={fill ? "relative h-full w-full" : `relative mx-auto w-full ${maxWidthClass}`}>
      <div className={fill ? "absolute inset-0 flex items-center justify-center" : ""}>
      <div className={fill ? "relative h-[94%] aspect-square" : "relative w-full"}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
        className={fill ? "h-full w-full" : "h-auto w-full drop-shadow-[0_18px_40px_rgba(0,0,0,0.08)]"}
        role="img"
        aria-label="Carte des régions françaises avec les points déposés"
        onClick={handleClick}
      >
        <defs>
          <linearGradient id="fr-land" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#F6F1E8" />
            <stop offset="100%" stopColor="#F1EBDD" />
          </linearGradient>
        </defs>
        {FRANCE_REGIONS.map((region) => (
          <path
            key={region.code}
            d={region.d}
            fill={hoverRegion === region.name ? "#EBE1CC" : "url(#fr-land)"}
            stroke="#1A1A1A"
            strokeWidth="1.4"
            strokeLinejoin="round"
            onMouseEnter={() => setHoverRegion(region.name)}
            onMouseLeave={() => setHoverRegion(null)}
          >
            <title>{region.name}</title>
          </path>
        ))}
      </svg>

      <div className="pointer-events-none absolute inset-0" role="group" aria-label="Points sur la carte">
        {pins.map((pin) => (
          <PinButton key={pin.id} pin={pin} selected={pin.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
      </div>
      </div>

      {canPlacePin && !fill && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Icon name="pin" className="h-4 w-4 text-ink-3" />
          Cliquez sur la carte pour déposer votre point à cet endroit précis.
        </p>
      )}
    </div>
  );
}
