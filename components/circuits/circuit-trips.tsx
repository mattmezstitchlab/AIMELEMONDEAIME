"use client";

import { useMemo, useState } from "react";
import { TripCard, normalizeText, dateText, type Request, type Trip, type TripRequest } from "@/components/community/community-app";
import { TripForm } from "@/components/community/forms";
import { TripRequestActions } from "@/components/community/community-app";
import type { Circuit } from "@/lib/circuits";

/*
 * Le tableau d'un circuit de trajets.
 *
 * Les trajets sont publiés dans Le Monde Aime ; ici, on les lit par commune et
 * par destination, et chaque demande attend l'accord explicite du conducteur.
 */

const field = "mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-4";
const fieldLabel = "block text-xs font-semibold text-ink-2";

export type CircuitTripRow = Trip & { ownerName: string };

export function CircuitTrips({ circuit, trips, mine, userId, isMember }: {
  circuit: Circuit;
  trips: CircuitTripRow[];
  mine: TripRequest[];
  userId: number | null;
  isMember: boolean;
}) {
  const [commune, setCommune] = useState("");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const city = normalizeText(commune.trim());
    const words = normalizeText(keyword.trim());
    return trips.filter((trip) => {
      if (city && !normalizeText(`${trip.startCity} ${trip.endCity}`).includes(city)) return false;
      if (words) {
        const haystack = normalizeText(`${trip.startCity} ${trip.endCity} ${trip.transportMode} ${trip.terms} ${trip.ownerName}`);
        if (!haystack.includes(words)) return false;
      }
      return true;
    });
  }, [trips, commune, keyword]);

  const myTrips = useMemo(
    () => (userId ? trips.filter((trip) => trip.ownerId === userId) : []),
    [trips, userId],
  );

  return (
    <div>
      <div id="circuit-filters" className="rounded-card bg-subtle p-4 ring-1 ring-line-soft">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-3">Affiner</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabel} htmlFor="circuit-trip-city">Commune de départ ou d&apos;arrivée</label>
            <input id="circuit-trip-city" value={commune} onChange={(event) => setCommune(event.target.value)} placeholder="Chartres" className={field} />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="circuit-trip-word">{circuit.words.searchLabel}</label>
            <input id="circuit-trip-word" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={circuit.words.searchHint} className={field} />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-3">
          {filtered.length} trajet(s) affiché(s) · points de départ approximatifs, déduits de la commune.
          {" "}Le lieu exact se convient après accord.
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-card bg-muted p-5 text-sm text-ink-2">{circuit.empty}</p>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              userId={userId}
              canRequest={isMember}
              linkedRequests={[] as Request[]}
              ownerName={trip.ownerName}
            />
          ))}
        </div>
      )}

      {!isMember && (
        <p className="mt-6 rounded-card bg-muted p-4 text-sm text-ink-2">
          Les comptes ouvrent bientôt : les trajets restent consultables par tous, et les demandes de place viendront avec les comptes.
        </p>
      )}

      {isMember && (
        <section id="circuit-mine" className="mt-10 rounded-card bg-subtle p-5 ring-1 ring-line-soft">
          <h2 className="text-lg leading-snug text-ink">Mon espace</h2>
          <p className="mt-1 text-sm text-ink-2">Vos trajets et vos demandes — visibles de vous seul.</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-card bg-muted p-5">
              <h3 className="text-sm font-bold text-ink">{myTrips.length ? "Mes trajets publiés" : circuit.deposit.label}</h3>
              {myTrips.length === 0 ? (
                <p className="mt-2 text-xs text-ink-3">{circuit.deposit.text}</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {myTrips.map((trip) => (
                    <li key={trip.id}>
                      <p className="text-sm font-semibold text-ink">{trip.startCity} → {trip.endCity}</p>
                      <p className="text-xs text-ink-3">
                        {dateText(trip.departureAt)} · {trip.availableCapacity}/{trip.capacity} place(s) · {trip.transportMode}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-ink">
                  {myTrips.length ? "Proposer un autre trajet" : circuit.deposit.label}
                </summary>
                <div className="mt-4 rounded-card bg-canvas p-4 ring-1 ring-line">
                  <TripForm />
                </div>
              </details>
            </div>

            <div className="rounded-card bg-canvas p-5 ring-1 ring-line shadow-rested">
              <h3 className="text-sm font-bold text-ink">{circuit.words.ordersTitle}</h3>
              {mine.length === 0 ? (
                <p className="mt-2 text-xs text-ink-3">
                  Aucune demande pour l&apos;instant. {circuit.words.demandDone}
                </p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {mine.map((request) => (
                    <li key={request.id} className="rounded-card bg-canvas p-4 ring-1 ring-line">
                      <p className="text-xs font-bold text-ink-3">
                        {request.isOwner ? `Reçue · ${request.requesterName}` : `Envoyée · auprès de ${request.ownerName}`}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">{request.startCity} → {request.endCity}</p>
                      <p className="text-xs text-ink-2">{dateText(request.departureAt)} · {request.transportMode}</p>
                      {request.description && <p className="mt-1 text-xs text-ink-2">{request.description}</p>}
                      <TripRequestActions request={request} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
