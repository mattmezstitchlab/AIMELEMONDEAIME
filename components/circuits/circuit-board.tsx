"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { SecondaryButton } from "@/components/ui";
import { normalizeText, dateText } from "@/components/community/community-app";
import {
  DeleteItemButton, DeleteStructureButton, HandForm, HandToggle, ItemForm, OrderForm, OrderStatusButtons, StructureForm,
  catalogueWords,
} from "@/components/circuits/circuit-forms";
import type { Circuit, CircuitHandRow, CircuitMine, CircuitOrderRow, CircuitStructureRow } from "@/lib/circuits";

/*
 * Le tableau d'un circuit : une liste, des filtres, et le travail du membre.
 *
 * Aucune carte : ce qui compte, c'est la commune, le mot-clé et ce qui est
 * disponible maintenant. Le producteur voit ses fiches et ses réservations ;
 * tout le monde voit les fiches publiées.
 */

const chip = "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink";
const card = "animate-fade-up rounded-card bg-canvas p-5 ring-1 ring-line shadow-rested";
const field = "mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-4";
const fieldLabel = "block text-xs font-semibold text-ink-2";

const price = (item: { price: string; unit: string }) => {
  const amount = Number(item.price);
  if (!Number.isFinite(amount) || amount <= 0) return "Prix à convenir";
  return `${amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 })} · ${item.unit}`;
};

function StructureCard({ circuit, structure, signedIn, isMember }: {
  circuit: Circuit;
  structure: CircuitStructureRow;
  signedIn: boolean;
  isMember: boolean;
}) {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  // Une fiche ne se montre pas sans son catalogue : les mots viennent du circuit.
  const catalogue = catalogueWords(circuit);
  return (
    <article className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={chip}>{circuit.short}</span>
          <h3 className="mt-2 text-lg leading-snug text-ink">{structure.name}</h3>
          <p className="mt-1 text-xs text-ink-3">
            <Icon name="pin" className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            {structure.city || "Commune non précisée"} · position approximative · fiche de {structure.ownerName}
            {structure.isMine ? " (vous)" : ""}
          </p>
        </div>
        {structure.phone && (
          <a href={`tel:${structure.phone.replace(/\s/g, "")}`} className="shrink-0 rounded-full ring-1 ring-line px-3 py-1.5 text-xs font-semibold text-ink-2">
            Téléphoner
          </a>
        )}
      </div>

      {structure.description && <p className="mt-3 text-sm leading-relaxed text-ink-2">{structure.description}</p>}

      <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-3">{catalogue.catalogueLabel}</h4>
      {structure.items.length === 0 ? (
        <p className="mt-1 text-sm text-ink-3">Rien de publié pour l&apos;instant{structure.isMine ? " — ajoutez votre première ligne juste en dessous." : "."}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {structure.items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-ink-3">{item.category}</p>
                  {item.description && <p className="mt-0.5 text-xs text-ink-2">{item.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink">{price(item)}</p>
                  <p className="text-xs text-ink-3">
                    {item.stock > 0 ? `${item.stock} ${circuit.words.stockWord}` : circuit.words.soldOut}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {structure.isMine ? (
                  <>
                    <span className="text-xs text-ink-3">Votre ligne</span>
                    <DeleteItemButton itemId={item.id} />
                  </>
                ) : !isMember ? (
                  <Link href="/mon-espace" className="text-xs font-semibold text-ink underline">
                    {signedIn ? "Réservé aux comptes membres" : "Comptes bientôt ouverts"}
                  </Link>
                ) : item.stock > 0 ? (
                  <button
                    type="button"
                    onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
                    aria-expanded={openItem === item.id}
                    className="h-10 rounded-full bg-ink px-4 text-xs font-semibold text-canvas"
                  >
                    {openItem === item.id ? "Fermer" : catalogue.orderLabel}
                  </button>
                ) : (
                  <span className="text-xs text-ink-3">Plus rien à réserver pour l&apos;instant.</span>
                )}
              </div>
              {openItem === item.id && <OrderForm circuit={circuit} item={item} onDone={() => setOpenItem(null)} />}
            </li>
          ))}
        </ul>
      )}

      {structure.isMine && (
        <div className="mt-4 border-t border-line pt-4">
          {adding ? (
            <ItemForm circuit={circuit} structureId={structure.id} />
          ) : (
            <SecondaryButton type="button" className="!px-3 !py-2 text-xs" onClick={() => setAdding(true)}>
              Ajouter un {catalogue.itemSingular}
            </SecondaryButton>
          )}
        </div>
      )}
    </article>
  );
}

function HandCard({ circuit, hand }: { circuit: Circuit; hand: CircuitHandRow }) {
  return (
    <article className={card}>
      <span className={chip}>{circuit.short}</span>
      <h3 className="mt-2 text-base font-bold text-ink">{hand.name}</h3>
      <p className="mt-1 text-xs text-ink-3">
        <Icon name="pin" className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
        {hand.city || "Commune non précisée"} · position approximative · disponible depuis le {dateText(hand.since)}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {hand.skills.map((skill) => (
          <span key={skill} className="rounded-full ring-1 ring-line px-2.5 py-1 text-xs font-semibold text-ink-2">{skill}</span>
        ))}
      </div>
      {hand.note && <p className="mt-2 text-sm leading-relaxed text-ink-2">{hand.note}</p>}
      {hand.hasProfile ? (
        <Link href={`/le-monde-aime/personnes/${hand.userId}`} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-canvas">
          Voir son profil
          <Icon name="arrow" className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ) : (
        <p className="mt-3 text-xs text-ink-3">
          Pas de profil public : publiez une demande dans Le Monde Aime, elle apparaît dans la liste publique où cette personne la trouve.
        </p>
      )}
    </article>
  );
}

function MyWork({ circuit, mine }: { circuit: Circuit; mine: CircuitMine }) {
  const orders = [...mine.received, ...mine.placed];
  return (
    <section aria-labelledby="circuit-mine" data-assistant-id="circuit-mine" className="mt-10 border-t border-line pt-6">
      <h2 id="circuit-mine" className="text-xl leading-tight tracking-[-0.02em] text-ink">Mon atelier</h2>
      <p className="mt-1 text-sm text-ink-2">Vos fiches, vos réservations et votre disponibilité — visibles de vous seul.</p>

      {circuit.board === "structures" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-card bg-muted p-5">
            <h3 className="text-sm font-bold text-ink">{mine.structures.length ? "Mes fiches" : circuit.deposit.label}</h3>
            {mine.structures.length === 0 ? (
              <p className="mt-2 text-xs text-ink-3">{circuit.deposit.text}</p>
            ) : (
              <ul className="mt-2 space-y-4">
                {mine.structures.map((structure) => (
                  <li key={structure.id}>
                    <p className="text-sm font-semibold text-ink">{structure.name}</p>
                    <p className="text-xs text-ink-3">{structure.city} · {structure.items.length} ligne(s) publiée(s)</p>
                    <div className="mt-2"><DeleteStructureButton structureId={structure.id} /></div>
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                {mine.structures.length ? "Ajouter une autre fiche" : circuit.deposit.label}
              </summary>
              <div className="mt-4 rounded-card bg-canvas p-4 ring-1 ring-line">
                <StructureForm circuit={circuit} existing={mine.structures.length > 0} />
              </div>
            </details>
          </div>

          <div className="rounded-card bg-muted p-5">
            <h3 className="text-sm font-bold text-ink">{circuit.words.ordersTitle}</h3>
            {orders.length === 0 ? (
              <p className="mt-2 text-xs text-ink-3">Aucune réservation pour l&apos;instant. Elles apparaîtront ici, avec le statut et le nom de la personne concernée.</p>
            ) : (
              <ul className="mt-3 space-y-4">
                {orders.map((order: CircuitOrderRow) => (
                  <li key={`${order.isSeller ? "recue" : "passee"}-${order.id}`} className="rounded-card bg-canvas p-4 ring-1 ring-line">
                    <p className="text-xs font-bold text-ink-3">
                      {order.isSeller ? `Reçue · ${order.counterparty}` : `Envoyée · ${circuit.words.counterpartyWord} ${order.structureName}`} · {order.reference}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {order.quantity} × {order.itemName} <span className="font-normal text-ink-3">· {order.city}</span>
                    </p>
                    <p className="text-xs text-ink-2">{order.statusLabel}{order.pickupAt ? ` · ${circuit.words.dateLabel.toLowerCase()} le ${order.pickupAt}` : ""}</p>
                    <OrderStatusButtons circuit={circuit} orderId={order.id} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {circuit.board === "hands" && (
        <div className="mt-5 rounded-card bg-muted p-5">
          <h3 className="text-sm font-bold text-ink">{mine.availability ? "Ma disponibilité" : circuit.deposit.label}</h3>
          {mine.availability ? (
            <>
              <p className="mt-2 text-sm text-ink-2">
                {mine.availability.status === "disponible" ? "Vous êtes visible dans la liste." : "Votre disponibilité est suspendue : votre nom n'apparaît pas dans la liste publique."}
              </p>
              <p className="mt-1 text-xs text-ink-3">
                {mine.availability.city} · {mine.availability.skills.join(", ") || "aucun savoir-faire déclaré"}
              </p>
              <div className="mt-3"><HandToggle status={mine.availability.status} /></div>
            </>
          ) : (
            <p className="mt-2 text-xs text-ink-3">{circuit.deposit.text}</p>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              {mine.availability ? "Modifier mes savoir-faire" : circuit.deposit.label}
            </summary>
            <div className="mt-4 rounded-card bg-canvas p-4 ring-1 ring-line">
              <HandForm circuit={circuit} defaults={mine.availability ? { city: mine.availability.city, postalCode: "", skills: mine.availability.skills, note: mine.availability.note } : null} />
            </div>
          </details>
        </div>
      )}
    </section>
  );
}

export function CircuitBoard({ circuit, structures, hands, mine, signedIn }: {
  circuit: Circuit;
  structures: CircuitStructureRow[];
  hands: CircuitHandRow[];
  mine: CircuitMine | null;
  signedIn: boolean;
}) {
  const [commune, setCommune] = useState("");
  const [keyword, setKeyword] = useState("");

  const term = normalizeText(commune.trim());
  const kw = normalizeText(keyword.trim());

  const shownStructures = useMemo(() => structures.filter((structure) => {
    if (term && !normalizeText(structure.city).includes(term)) return false;
    if (kw) {
      const text = normalizeText(`${structure.name} ${structure.description} ${structure.ownerName} ${structure.items.map((item) => `${item.name} ${item.category} ${item.description}`).join(" ")}`);
      if (!text.includes(kw)) return false;
    }
    return true;
  }), [structures, term, kw]);

  const shownHands = useMemo(() => hands.filter((hand) => {
    if (term && !normalizeText(hand.city).includes(term)) return false;
    if (kw) {
      const text = normalizeText(`${hand.name} ${hand.city} ${hand.skills.join(" ")} ${hand.note}`);
      if (!text.includes(kw)) return false;
    }
    return true;
  }), [hands, term, kw]);

  const total = circuit.board === "hands" ? shownHands.length : shownStructures.length;
  const isMember = mine?.isMember ?? false;
  const hasFilters = Boolean(term || kw);

  return (
    <div>
      <section aria-labelledby="circuit-filters" data-assistant-id="circuit-filters" className="rounded-card bg-muted p-5">
        <h2 id="circuit-filters" className="text-sm font-bold text-ink">Affiner</h2>
        <form role="search" onSubmit={(event) => event.preventDefault()} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabel} htmlFor="circuit-filter-city">Commune</label>
            <input id="circuit-filter-city" value={commune} onChange={(event) => setCommune(event.target.value)} placeholder="Chartres" className={field} />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="circuit-filter-kw">
              {circuit.words.searchLabel}
            </label>
            <input
              id="circuit-filter-kw"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={circuit.words.searchHint}
              className={field}
            />
          </div>
        </form>
        {hasFilters && (
          <button type="button" onClick={() => { setCommune(""); setKeyword(""); }} className="mt-3 text-xs font-semibold text-ink underline">
            Réinitialiser
          </button>
        )}
      </section>

      <p className="mt-5 text-sm text-ink-3" aria-live="polite">
        {total} {circuit.board === "hands" ? "disponibilité(s)" : "fiche(s)"} affichée(s) · positions approximatives, déduites de la commune.
        {!signedIn && " Les comptes ouvrent bientôt : les listes restent consultables par tous."}
      </p>

      {total === 0 ? (
        <section className="mt-4 rounded-card bg-muted p-8 text-center">
          <p className="text-sm text-ink-2">{hasFilters ? "Rien ne correspond à ces filtres pour l'instant." : circuit.empty}</p>
          {hasFilters && (
            <button type="button" onClick={() => { setCommune(""); setKeyword(""); }} className="mt-3 text-sm font-semibold text-ink underline">
              Voir toutes les fiches
            </button>
          )}
        </section>
      ) : circuit.board === "hands" ? (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {shownHands.map((hand) => <li key={hand.id}><HandCard circuit={circuit} hand={hand} /></li>)}
        </ul>
      ) : (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {shownStructures.map((structure) => (
            <li key={structure.id}><StructureCard circuit={circuit} structure={structure} signedIn={signedIn} isMember={isMember} /></li>
          ))}
        </ul>
      )}

      {mine
        ? <MyWork circuit={circuit} mine={mine} />
        : (
          <p className="mt-8 rounded-card bg-muted p-4 text-sm text-ink-2">
            Pour publier dans ce circuit, il faudra un compte membre.{" "}
            <Link href="/mon-espace" className="font-bold text-ink underline">Mon espace</Link>
          </p>
        )}
    </div>
  );
}
