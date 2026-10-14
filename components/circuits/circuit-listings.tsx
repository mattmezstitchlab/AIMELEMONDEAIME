"use client";

import { useMemo, useState } from "react";
import { ListingCard, normalizeText, type Listing, type OwnListing } from "@/components/community/community-app";
import { PublishListingForm } from "@/components/community/forms";
import { SuspendListingButton } from "@/components/circuits/circuit-forms";
import type { Circuit } from "@/lib/circuits";

/*
 * Le tableau d'un circuit d'annonces.
 *
 * Le logement (ou le local, ou le matériel) est publié là où tout se publie
 * déjà — dans Le Monde Aime — et le circuit en propose une lecture cadrée :
 * une catégorie, une commune, un mot-clé, et les mots du circuit.
 */

const card = "animate-fade-up rounded-card bg-canvas p-5 ring-1 ring-line shadow-rested";
const field = "mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-4";
const fieldLabel = "block text-xs font-semibold text-ink-2";

export function CircuitListings({ circuit, listings, mine, userId, isMember }: {
  circuit: Circuit;
  listings: Listing[];
  mine: OwnListing[];
  userId: number | null;
  isMember: boolean;
}) {
  const [commune, setCommune] = useState("");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const city = normalizeText(commune.trim());
    const words = normalizeText(keyword.trim());
    return listings.filter((listing) => {
      if (city && !normalizeText(listing.city).includes(city)) return false;
      if (words) {
        const haystack = normalizeText(`${listing.title} ${listing.description} ${listing.city} ${listing.ownerName}`);
        if (!haystack.includes(words)) return false;
      }
      return true;
    });
  }, [listings, commune, keyword]);

  return (
    <div>
      <div id="circuit-filters" className="rounded-card bg-subtle p-4 ring-1 ring-line-soft">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-3">Affiner</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabel} htmlFor="circuit-listing-city">Commune</label>
            <input id="circuit-listing-city" value={commune} onChange={(event) => setCommune(event.target.value)} placeholder="Chartres" className={field} />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="circuit-listing-word">{circuit.words.searchLabel}</label>
            <input id="circuit-listing-word" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={circuit.words.searchHint} className={field} />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-3">
          {filtered.length} annonce(s) affichée(s) · positions approximatives, déduites de la commune.
          {" "}L&apos;adresse exacte se donne après accord entre les personnes.
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-card bg-muted p-5 text-sm text-ink-2">{circuit.empty}</p>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} item={listing} userId={userId} canRequest={isMember} />
          ))}
        </div>
      )}

      {!isMember && (
        <p className="mt-6 rounded-card bg-muted p-4 text-sm text-ink-2">
          Les comptes ouvrent bientôt : les annonces restent consultables par tous, et les demandes viendront avec les comptes.
        </p>
      )}

      {isMember && (
        <section id="circuit-mine" className="mt-10 rounded-card bg-subtle p-5 ring-1 ring-line-soft">
          <h2 className="text-lg leading-snug text-ink">Mon espace</h2>
          <p className="mt-1 text-sm text-ink-2">Vos annonces et vos demandes — visibles de vous seul.</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-card bg-muted p-5">
              <h3 className="text-sm font-bold text-ink">{mine.length ? "Mes annonces" : circuit.deposit.label}</h3>
              {mine.length === 0 ? (
                <p className="mt-2 text-xs text-ink-3">{circuit.deposit.text}</p>
              ) : (
                <ul className="mt-2 space-y-4">
                  {mine.map((listing) => (
                    <li key={listing.id}>
                      <p className="text-sm font-semibold text-ink">{listing.title}</p>
                      <p className="text-xs text-ink-3">{listing.city} · {listing.status === "publiee" ? "publiée" : listing.status}</p>
                      <div className="mt-2"><SuspendListingButton listingId={listing.id} /></div>
                    </li>
                  ))}
                </ul>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-ink">
                  {mine.length ? "Proposer un autre logement" : circuit.deposit.label}
                </summary>
                <div className="mt-4 rounded-card bg-canvas p-4 ring-1 ring-line">
                  <PublishListingForm type="proposition" defaultAction="loue" defaultCategory={circuit.listingCategory} />
                </div>
              </details>
            </div>

            <div className={card}>
              <h3 className="text-sm font-bold text-ink">Comment ça se passe</h3>
              <ul className="mt-3 space-y-3">
                {circuit.guarantees.map((line) => (
                  <li key={line} className="text-sm leading-relaxed text-ink-2">{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
