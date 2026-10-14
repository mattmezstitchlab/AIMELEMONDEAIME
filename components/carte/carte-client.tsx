"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FranceMap, type MapPin } from "@/components/carte/france-map";
import { AvailabilityForm, DirectionsLink, OrderButton, OwnerPointActions, OwnerProductActions, PlacePointForm, ProductForm } from "@/components/carte/forms";
import { Icon } from "@/components/icon";
import { PrimaryButton, SecondaryButton, formatAmount } from "@/components/ui";
import { SITUATION_LABELS } from "@/lib/constants";

export type MapOffice = {
  id: number; name: string; city: string; postalCode: string; address: string;
  phone: string; hours: string; region: string; lat: string | null; lng: string | null;
};
export type MapProduct = { id: number; name: string; description: string; category: string; price: string; unit: string; stock: number };
export type MapPoint = {
  id: number; ownerId: number; kind: "producteur" | "presence"; name: string; description: string;
  city: string; lat: string; lng: string; phone: string | null; ownerName?: string; products: MapProduct[];
};
export type MapAvailability = {
  id: number; userId: number; city: string; lat: string; lng: string; skills: string[];
  availabilityNote: string; user: { id: number; fullName: string; situation: string | null } | null;
};

type Layer = "agences" | "producteurs" | "disponibles";

const LAYERS: { key: Layer; label: string; icon: "building" | "leaf" | "velo" }[] = [
  { key: "agences", label: "Points d'accueil", icon: "building" },
  { key: "producteurs", label: "Production & entraide", icon: "leaf" },
  { key: "disponibles", label: "Jeunes disponibles", icon: "velo" },
];

export function CarteClient({
  offices,
  points,
  availabilities,
  user,
}: {
  offices: MapOffice[];
  points: MapPoint[];
  availabilities: MapAvailability[];
  user: { id: number; role: string } | null;
}) {
  const [activeLayers, setActiveLayers] = useState<Layer[]>(["agences", "producteurs", "disponibles"]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placeCoords, setPlaceCoords] = useState<{ lat: number; lng: number } | null>(null);

  const pins = useMemo<MapPin[]>(() => {
    const result: MapPin[] = [];
    if (activeLayers.includes("agences")) {
      for (const office of offices) {
        if (!office.lat || !office.lng) continue;
        result.push({
          id: `agence-${office.id}`, kind: "agence", name: office.name,
          subtitle: `${office.city} · ${office.phone}`, lat: Number(office.lat), lng: Number(office.lng), badge: office.city,
        });
      }
    }
    if (activeLayers.includes("producteurs")) {
      for (const point of points) {
        result.push({
          id: `point-${point.id}`,
          kind: point.kind === "producteur" ? "producteur" : "presence",
          name: point.name,
          subtitle: `${point.city || "France"} · ${point.ownerName}`,
          lat: Number(point.lat), lng: Number(point.lng),
          badge: point.kind === "producteur" ? `${point.products.length} produit(s)` : "Entraide",
        });
      }
    }
    if (activeLayers.includes("disponibles")) {
      for (const availability of availabilities) {
        result.push({
          id: `dispo-${availability.id}`, kind: "disponible",
          name: availability.user?.fullName ?? "Jeune disponible",
          subtitle: availability.city || "France", lat: Number(availability.lat), lng: Number(availability.lng),
          badge: availability.skills[0] ?? "Disponible",
        });
      }
    }
    return result;
  }, [activeLayers, availabilities, offices, points]);

  const selected = pins.find((pin) => pin.id === selectedId) ?? null;
  const canPlacePin = user?.role === "membre";

  function toggleLayer(layer: Layer) {
    setActiveLayers((prev) => (prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]));
  }

  const selectedOffice = selected?.kind === "agence" ? offices.find((o) => `agence-${o.id}` === selected.id) ?? null : null;
  const selectedPoint = selected && selected.kind !== "agence" && selected.kind !== "disponible" ? points.find((p) => `point-${p.id}` === selected.id) ?? null : null;
  const selectedAvailability = selected?.kind === "disponible" ? availabilities.find((a) => `dispo-${a.id}` === selected.id) ?? null : null;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div data-assistant-id="carte-filters" className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer les points affichés">
          {LAYERS.map((layer) => {
            const active = activeLayers.includes(layer.key);
            return (
              <button
                key={layer.key}
                type="button"
                onClick={() => toggleLayer(layer.key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active ? "ring-ink bg-ink text-white" : "border-slate-300 bg-white text-slate-600"
                }`}
              >
                <Icon name={layer.icon} className="h-4 w-4" />
                {layer.label}
                <span className="text-xs opacity-80">
                  {layer.key === "agences" ? offices.filter((o) => o.lat).length : layer.key === "producteurs" ? points.length : availabilities.length}
                </span>
              </button>
            );
          })}
        </div>

        <FranceMap
          pins={pins}
          selectedId={selectedId}
          onSelect={(pin) => { setSelectedId(pin.id); setPlaceCoords(null); }}
          onPickLocation={canPlacePin ? (coords) => { setPlaceCoords(coords); setSelectedId(null); } : undefined}
          canPlacePin={canPlacePin}
        />

        {/* Légende */}
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-ink" aria-hidden="true" /> Point d&apos;accueil (démo)</li>
          <li className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 ring-ink-4 bg-white" aria-hidden="true" /> Production locale</li>
          <li className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-slate-300 bg-white" aria-hidden="true" /> Présence / entraide</li>
          <li className="flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-amber-400" aria-hidden="true" /> Jeune disponible</li>
        </ul>

        {/* Liste accessible des points (équivalent clavier de la carte) */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Liste des points affichés ({pins.length})</h3>
          <ul className="mt-3 divide-y divide-slate-100 rounded-card bg-canvas ring-1 ring-line">
            {pins.map((pin) => (
              <li key={pin.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(pin.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-subtle"
                >
                  <Icon name={pin.kind === "agence" ? "building" : pin.kind === "disponible" ? "velo" : pin.kind === "producteur" ? "leaf" : "entraide"} className="h-4 w-4 text-ink-3" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{pin.name}</span>
                    <span className="block truncate text-xs text-slate-500">{pin.subtitle}</span>
                  </span>
                  <span className="text-xs text-slate-400">{pin.badge}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="sticky top-24 flex flex-col gap-4">
          {placeCoords && canPlacePin && <PlacePointForm lat={placeCoords.lat} lng={placeCoords.lng} onDone={() => setPlaceCoords(null)} />}

          {!selected && !placeCoords && (
            <div className="rounded-card border border-dashed border-slate-300 bg-subtle p-6 text-center">
              <Icon name="pin" className="mx-auto h-9 w-9 text-ink-3" />
              <h2 className="mt-3 text-lg font-semibold text-slate-900">Sélectionnez un point</h2>
              <p className="mt-2 text-sm text-slate-600">
                Cliquez sur une épingle pour voir le détail, les produits disponibles sur place et les actions rapides.
              </p>
              {canPlacePin ? (
                <p className="mt-3 text-sm text-slate-600">Vous pouvez aussi cliquer directement sur la carte pour déposer votre propre point.</p>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  <Link href="/connexion" className="font-semibold text-ink-2 hover:underline">Connectez-vous</Link> pour déposer un point, commander ou vous rendre disponible.
                </p>
              )}
            </div>
          )}

          {selectedOffice && (
            <div className="rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-ink-2">
                <Icon name="building" className="h-3.5 w-3.5" /> Point d&apos;accueil (démonstration)
              </span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{selectedOffice.name}</h2>
              <p className="text-sm text-slate-500">{selectedOffice.region}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />{selectedOffice.address}, {selectedOffice.postalCode} {selectedOffice.city}</li>
                <li className="flex gap-2"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" /><a href={`tel:${selectedOffice.phone.replace(/\s/g, "")}`} className="hover:underline">{selectedOffice.phone}</a></li>
                <li className="flex gap-2"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />{selectedOffice.hours}</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <DirectionsLink lat={Number(selectedOffice.lat)} lng={Number(selectedOffice.lng)} label="Itinéraire" />
                <Link href="/espace/echanges" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:underline">
                  <Icon name="calendar" className="h-4 w-4" /> Prendre rendez-vous
                </Link>
              </div>
            </div>
          )}

          {selectedPoint && (
            <div className="rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${selectedPoint.kind === "producteur" ? "bg-muted text-ink-2" : "bg-slate-100 text-slate-600"}`}>
                <Icon name={selectedPoint.kind === "producteur" ? "leaf" : "entraide"} className="h-3.5 w-3.5" />
                {selectedPoint.kind === "producteur" ? "Production locale" : "Présence / entraide"}
              </span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{selectedPoint.name}</h2>
              <p className="text-sm text-slate-500">
                {selectedPoint.city || "France"} · proposé par {selectedPoint.ownerName}
              </p>
              {selectedPoint.description && <p className="mt-3 text-sm text-slate-700">{selectedPoint.description}</p>}
              {selectedPoint.phone && (
                <p className="mt-2 text-sm text-slate-700">
                  <a href={`tel:${selectedPoint.phone.replace(/\s/g, "")}`} className="font-semibold text-ink-2 hover:underline">{selectedPoint.phone}</a>
                </p>
              )}

              {selectedPoint.products.length > 0 ? (
                <ul className="mt-5 flex flex-col gap-3">
                  {selectedPoint.products.map((product) => (
                    <li key={product.id} className="rounded-card bg-subtle p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.category} · {product.unit}</p>
                        </div>
                        <p className="text-sm font-bold text-ink">{formatAmount(product.price)}</p>
                      </div>
                      {product.description && <p className="mt-1 text-xs text-slate-600">{product.description}</p>}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500">{product.stock > 0 ? `${product.stock} en stock` : "Épuisé"}</span>
                        {user?.role === "membre" && selectedPoint.ownerId !== user.id && product.stock > 0 && <OrderButton productId={product.id} stock={product.stock} />}
                        {user?.role === "membre" && selectedPoint.ownerId === user.id && <OwnerProductActions productId={product.id} />}
                        {!user && (
                          <Link href="/connexion" className="text-xs font-semibold text-ink-2 hover:underline">Connectez-vous pour commander</Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Aucun produit en vente sur ce point pour le moment.</p>
              )}

              {user?.role === "membre" && selectedPoint.ownerId === user.id ? (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <ProductForm pointId={selectedPoint.id} />
                  <div className="mt-3"><OwnerPointActions pointId={selectedPoint.id} /></div>
                </div>
              ) : (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <DirectionsLink lat={Number(selectedPoint.lat)} lng={Number(selectedPoint.lng)} label="Voir l'itinéraire" />
                </div>
              )}
            </div>
          )}

          {selectedAvailability && (
            <div className="rounded-card bg-canvas ring-1 ring-line p-6 shadow-rested">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Icon name="velo" className="h-3.5 w-3.5" /> Jeune disponible
              </span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{selectedAvailability.user?.fullName}</h2>
              <p className="text-sm text-slate-500">
                {selectedAvailability.city || "France"}
                {selectedAvailability.user?.situation ? ` · ${SITUATION_LABELS[selectedAvailability.user.situation] ?? ""}` : ""}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {selectedAvailability.skills.map((skill) => (
                  <li key={skill} className="rounded-full bg-subtle px-3 py-1 text-xs font-medium text-slate-700">{skill}</li>
                ))}
              </ul>
              {selectedAvailability.availabilityNote && <p className="mt-3 text-sm text-slate-700">{selectedAvailability.availabilityNote}</p>}
              <p className="mt-4 text-xs text-slate-500">
                Mise en relation fictive : dans ce prototype, aucun contact n&apos;est transmis automatiquement. Passez par la messagerie de votre espace pour échanger.
              </p>
              {user?.role === "membre" && (
                <Link href="/espace/echanges" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:underline">
                  <Icon name="echanges" className="h-4 w-4" /> Écrire un message
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Espace personnel du membre sur la carte : ses points, commandes et disponibilité. */
export function MonEspaceCarte({
  myPoints,
  purchases,
  sales,
  availability,
  userId,
}: {
  myPoints: MapPoint[];
  purchases: { id: number; reference: string; quantity: number; status: string; pickupAt: Date | null; note: string; productName: string; pointName: string; pointCity: string }[];
  sales: { id: number; reference: string; quantity: number; status: string; pickupAt: Date | null; note: string; productName: string; buyerName: string; pointName: string }[];
  availability: { id: number; city: string; skills: string[]; availabilityNote: string; status: string; lat: string; lng: string } | null;
  userId: number;
}) {
  const [tab, setTab] = useState<"points" | "commandes" | "dispo">("points");
  const ORDER_LABEL: Record<string, string> = { commandee: "En attente", prete: "Prête", recuperee: "Récupérée", annulee: "Annulée" };

  return (
    <div className="rounded-card bg-canvas ring-1 ring-line p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Mon espace local</h2>
        <div className="flex gap-2" role="tablist" aria-label="Sections de mon espace local">
          {([
            ["points", `Mes points (${myPoints.length})`],
            ["commandes", `Commandes (${purchases.length + sales.length})`],
            ["dispo", "Ma disponibilité"],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? "bg-ink text-white" : "bg-subtle text-slate-600"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "points" && (
        <div className="mt-5">
          {myPoints.length === 0 ? (
            <p className="text-sm text-slate-600">Vous n&apos;avez pas encore de point. Cliquez sur la carte pour déposer votre premier lieu de production ou de présence.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {myPoints.map((point) => (
                <li key={point.id} className="rounded-card bg-subtle p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{point.name}</p>
                      <p className="text-xs text-slate-500">{point.city} · {point.kind === "producteur" ? "Production locale" : "Présence / entraide"}</p>
                    </div>
                    <div className="flex gap-2">
                      <OwnerPointActions pointId={point.id} />
                    </div>
                  </div>
                  {point.products.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {point.products.map((product) => (
                        <li key={product.id} className="rounded-control bg-canvas px-3 py-2 text-xs text-slate-700">
                          {product.name} · {formatAmount(product.price)} / {product.unit} · stock {product.stock}
                        </li>
                      ))}
                    </ul>
                  )}
                  <ProductForm pointId={point.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "commandes" && (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Mes commandes</h3>
            {purchases.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Aucune commande pour le moment.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {purchases.map((order) => (
                  <li key={order.id} className="rounded-card bg-subtle p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{order.quantity} × {order.productName}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{ORDER_LABEL[order.status]}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{order.reference} · {order.pointName} ({order.pointCity})</p>
                    {order.pickupAt && <p className="text-xs text-slate-500">Retrait prévu : {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.pickupAt))}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Commandes reçues</h3>
            {sales.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Aucune commande reçue pour l&apos;instant.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {sales.map((order) => (
                  <li key={order.id} className="rounded-card bg-subtle p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{order.quantity} × {order.productName}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{ORDER_LABEL[order.status]}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{order.reference} · {order.buyerName}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "dispo" && (
        <div className="mt-5">
          {availability ? (
            <div className="rounded-card bg-subtle p-4">
              <p className="text-sm font-semibold text-slate-900">
                {availability.status === "disponible" ? "Vous êtes visible sur la carte." : "Votre disponibilité est suspendue."}
              </p>
              <p className="mt-1 text-xs text-slate-500">{availability.city} · {availability.skills.join(", ")}</p>
              <div className="mt-3 flex gap-2">
                <AvailabilityToggle current={availability.status as "disponible" | "indisponible"} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Rendez-vous disponible pour des missions de proximité : livraison, aide aux champs, tenue de stand…</p>
          )}
          <div className="mt-4">
            <AvailabilityForm
              defaultValues={availability ? { city: availability.city, skills: availability.skills, availabilityNote: availability.availabilityNote } : undefined}
              lat={availability ? Number(availability.lat) : 48.4474}
              lng={availability ? Number(availability.lng) : 1.4877}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">Compte connecté : #{userId}</p>
        </div>
      )}
    </div>
  );
}

function AvailabilityToggle({ current }: { current: "disponible" | "indisponible" }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = current === "disponible" ? "indisponible" : "disponible";
  return (
    <div className="flex items-center gap-3">
      <PrimaryButton
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const { toggleWorkerAvailability } = await import("@/lib/actions/local");
          const result = await toggleWorkerAvailability(next);
          if (!result.ok) setError(result.error);
          setPending(false);
        }}
      >
        {pending ? "Mise à jour…" : next === "disponible" ? "Reprendre les missions" : "Suspendre mes missions"}
      </PrimaryButton>
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    </div>
  );
}
