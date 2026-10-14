import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Info } from "lucide-react";
import { PublicPage } from "@/components/public-shell";
import { Container, Hero, SectionHeading, Tag } from "@/components/ui";
import { Icon } from "@/components/icon";
import { CircuitBoard } from "@/components/circuits/circuit-board";
import { CircuitListings } from "@/components/circuits/circuit-listings";
import { CircuitTrips, type CircuitTripRow } from "@/components/circuits/circuit-trips";
import { CircuitPeople, type CircuitPersonRow } from "@/components/circuits/circuit-people";
import {
  CIRCUITS, DEFAULT_ORDER_STATUS_LABELS, circuitFor,
  type Circuit, type CircuitHandRow, type CircuitMine, type CircuitOrderRow, type CircuitStructureRow,
} from "@/lib/circuits";
import { getCurrentUser } from "@/lib/auth";
import { getAvailableHands, getLocalStructures, getMemberCircuitData } from "@/lib/queries";
import { getCircuitListings, getCircuitTrips, getMyCommunityData } from "@/lib/community-queries";
import { getTransmitters } from "@/lib/lma-queries";
import { communityCategoryEnum, type CommunityCategory } from "@/db/schema";
import type { Listing, OwnListing, TripRequest } from "@/components/community/community-app";
import { splitCommuneLabel } from "@/lib/point";

/*
 * Un circuit, en listes.
 *
 * Aucune carte : la commune, le code postal et le mot-clé suffisent. Le
 * serveur assemble ici des lignes simples, le tableau (client) ne s'occupe que
 * des filtres et des formulaires.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const circuit = circuitFor((await params).key);
  if (!circuit) return { title: "Circuit introuvable — AIME®" };
  return { title: `${circuit.label} — AIME®`, description: circuit.tagline };
}

function publicName(display: string | null, full: string) {
  return display?.trim() || full.split(" ")[0];
}

function orderRow(circuit: Circuit, raw: {
  id: number; reference: string; quantity: number; status: string; pickupAt: Date | string | null;
  productName: string; pointName: string; city: string; counterparty: string; isSeller: boolean;
}): CircuitOrderRow {
  const labels = circuit.words.statusLabels ?? DEFAULT_ORDER_STATUS_LABELS;
  return {
    id: raw.id,
    reference: raw.reference,
    quantity: raw.quantity,
    status: raw.status,
    statusLabel: labels[raw.status as keyof typeof labels] ?? raw.status,
    itemName: raw.productName,
    structureName: raw.pointName,
    city: raw.city,
    counterparty: raw.counterparty,
    pickupAt: raw.pickupAt
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(raw.pickupAt))
      : null,
    isSeller: raw.isSeller,
  };
}

export default async function CircuitPage({ params }: { params: Promise<{ key: string }> }) {
  const circuit = circuitFor((await params).key);
  if (!circuit) notFound();

  const user = await getCurrentUser();
  const isMember = user?.role === "membre";

  let structures: CircuitStructureRow[] = [];
  let hands: CircuitHandRow[] = [];
  let mine: CircuitMine | null = null;

  // Circuit d'annonces (logements et hébergement) : la catégorie du Monde Aime
  // qui nourrit le circuit, et mes propres annonces.
  const isListingCategory = (value: string | undefined): value is CommunityCategory =>
    Boolean(value) && (communityCategoryEnum as readonly string[]).includes(value as string);
  const listingCategory = isListingCategory(circuit.listingCategory) ? circuit.listingCategory : undefined;
  const isListings = circuit.status === "ouvert" && circuit.board === "annonces" && Boolean(listingCategory);
  let listings: Listing[] = [];
  let myListings: OwnListing[] = [];
  if (isListings && listingCategory) {
    listings = await getCircuitListings(listingCategory).catch(() => []);
  }

  // Circuit de personnes : celles et ceux qui acceptent de transmettre.
  const isPeople = circuit.status === "ouvert" && circuit.board === "personnes";
  let people: CircuitPersonRow[] = [];
  if (isPeople) {
    const rows = await getTransmitters().catch(() => []);
    people = rows.map((row) => ({ ...row, isMine: user?.id === row.id }));
  }

  // Circuit de trajets : les trajets publiés dans Le Monde Aime, les mêmes ici.
  const isTrips = circuit.status === "ouvert" && circuit.board === "trajets";
  let trips: CircuitTripRow[] = [];
  let myTripRequests: TripRequest[] = [];
  if (isTrips) {
    trips = await getCircuitTrips().catch(() => []);
  }

  if (circuit.status === "ouvert" && circuit.board === "structures") {
    const points = await getLocalStructures().catch(() => []);
    structures = points
      .filter((point) => point.kind === circuit.pointKind)
      .map((point) => ({
        id: point.id,
        name: point.name,
        description: point.description,
        city: point.city,
        kind: point.kind,
        ownerName: point.ownerName,
        phone: point.phone,
        isMine: user?.id === point.ownerId,
        items: point.products.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          price: item.price,
          unit: item.unit,
          stock: item.stock,
          isMine: user?.id === point.ownerId,
        })),
      }));
  }

  if (circuit.status === "ouvert" && circuit.board === "hands") {
    const rows = await getAvailableHands().catch(() => []);
    hands = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      name: row.person ? publicName(row.person.displayName, row.person.fullName) : "Habitant de la commune",
      city: row.city,
      skills: row.skills,
      note: row.availabilityNote,
      since: new Date(row.createdAt).toISOString(),
      isMine: user?.id === row.userId,
      hasProfile: row.person?.profileVisible === true,
    }));
  }

  if (isMember && user && (isListings || isTrips)) {
    const community = await getMyCommunityData(user.id).catch(() => null);
    if (isListings && listingCategory) {
      myListings = (community?.ownListings ?? []).filter((listing) => listing.category === listingCategory);
    }
    myTripRequests = community?.tripRequests ?? [];
  }

  if (isMember && user && circuit.status === "ouvert") {
    const raw = await getMemberCircuitData(user.id).catch(() => null);
    if (raw) {
      const myStructures: CircuitStructureRow[] = raw.myPoints
        .filter((point) => point.kind === circuit.pointKind)
        .map((point) => ({
          id: point.id,
          name: point.name,
          description: point.description,
          city: point.city,
          kind: point.kind,
          ownerName: publicName(user.displayName, user.fullName),
          phone: point.phone,
          isMine: true,
          items: point.products.map((item) => ({
            id: item.id, name: item.name, description: item.description, category: item.category,
            price: item.price, unit: item.unit, stock: item.stock, isMine: true,
          })),
        }));
      mine = {
        isMember: true,
        structures: myStructures,
        received: raw.sales.map((sale) => orderRow(circuit, {
          id: sale.id, reference: sale.reference, quantity: sale.quantity, status: sale.status, pickupAt: sale.pickupAt,
          productName: sale.productName, pointName: sale.pointName, city: "", counterparty: sale.buyerName, isSeller: true,
        })),
        placed: raw.purchases.map((purchase) => orderRow(circuit, {
          id: purchase.id, reference: purchase.reference, quantity: purchase.quantity, status: purchase.status, pickupAt: purchase.pickupAt,
          productName: purchase.productName, pointName: purchase.pointName, city: purchase.pointCity, counterparty: purchase.pointName, isSeller: false,
        })),
        availability: raw.availability
          ? {
              skills: raw.availability.skills,
              city: splitCommuneLabel(raw.availability.city).commune,
              note: raw.availability.availabilityNote,
              status: raw.availability.status,
            }
          : null,
      };
    }
  }

  const closed = circuit.status !== "ouvert";

  return (
    <PublicPage>
      <Hero
        size="md"
        eyebrow={`Circuit · ${circuit.status === "ouvert" ? "ouvert" : "en préparation"}`}
        title={`${circuit.label}.`}
        subtitle={circuit.intro}
        actions={
          closed ? (
            <Link href="/circuits" className="inline-flex h-11 items-center gap-2 rounded-control bg-canvas px-5 text-[15px] font-medium text-ink-2 ring-1 ring-line transition hover:bg-subtle hover:text-ink">
              Voir les circuits ouverts
            </Link>
          ) : (
            <Link href="#tableau" className="inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-[15px] font-medium text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-ink-2">
              Voir les fiches
            </Link>
          )
        }
      />

      <section className="border-b border-line bg-subtle">
        <Container className="py-14">
          <div className="grid gap-4 md:grid-cols-3">
            {circuit.steps.map((step, index) => (
              <div key={step.title} className="rounded-card bg-canvas p-6 shadow-rested ring-1 ring-line">
                <span className="font-display text-xs tracking-[0.14em] text-ink-4">0{index + 1}</span>
                <h2 className="mt-4 text-lg leading-snug text-ink">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {closed ? (
        <section className="bg-canvas">
          <Container className="py-16 lg:py-20">
            <SectionHeading
              eyebrow="Pas encore ouvert"
              title="Ce circuit est préparé, pas accessible."
              description={circuit.pending}
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <ul className="space-y-3 rounded-card bg-subtle p-5 ring-1 ring-line-soft">
                <li className="text-xs font-bold uppercase tracking-wide text-ink-3">Déjà décidé</li>
                {circuit.guarantees.map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={1.8} aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
              <ul className="space-y-3 rounded-card bg-subtle p-5 ring-1 ring-line-soft">
                <li className="text-xs font-bold uppercase tracking-wide text-ink-3">Limites annoncées d&apos;avance</li>
                {circuit.limits.map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-2">
              En attendant, ce que vous cherchez se publie dans Le Monde Aime — une proposition, un besoin, un projet, un trajet.{" "}
              <Link href="/le-monde-aime?onglet=publier" className="font-semibold text-ink underline">Publier une demande</Link>
            </p>
          </Container>
        </section>
      ) : (
        <section id="tableau" className="bg-canvas">
          <Container className="py-14 lg:py-16">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
              <SectionHeading
                eyebrow={circuit.board === "hands"
                  ? `${hands.length} disponibilité(s)`
                  : circuit.board === "annonces"
                    ? `${listings.length} annonce(s)`
                    : circuit.board === "trajets"
                      ? `${trips.length} trajet(s)`
                      : circuit.board === "personnes"
                        ? `${people.length} personne(s)`
                        : `${structures.length} fiche(s)`}
                title={circuit.words.boardTitle}
                description={circuit.deposit.text}
              />
              <span className="inline-flex items-center gap-2 text-xs text-ink-3">
                <Icon name={circuit.icon} className="h-4 w-4" />
                {circuit.short}
              </span>
            </div>
            <div className="mt-8">
              {isPeople ? (
                <CircuitPeople
                  circuit={circuit}
                  people={people}
                  isMember={isMember}
                  inlineOffer={user?.transmitText ?? null}
                />
              ) : isTrips ? (
                <CircuitTrips
                  circuit={circuit}
                  trips={trips}
                  mine={myTripRequests}
                  userId={user?.id ?? null}
                  isMember={isMember}
                />
              ) : isListings ? (
                <CircuitListings
                  circuit={circuit}
                  listings={listings}
                  mine={myListings}
                  userId={user?.id ?? null}
                  isMember={isMember}
                />
              ) : (
                <CircuitBoard circuit={circuit} structures={structures} hands={hands} mine={mine} signedIn={Boolean(user)} />
              )}
            </div>
          </Container>
        </section>
      )}

      <section className="border-t border-line bg-subtle">
        <Container className="py-14">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl leading-tight tracking-[-0.02em] text-ink">Ce que ce circuit garantit.</h2>
              <ul className="mt-4 space-y-3">
                {circuit.guarantees.map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={1.8} aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl leading-tight tracking-[-0.02em] text-ink">Ce qu&apos;il ne fait pas.</h2>
              <ul className="mt-4 space-y-3">
                {circuit.limits.map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.8} aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-ink-4">
                Prototype indépendant, non affilié à un organisme. Les fiches sont déclaratives et signalées comme fictives lorsqu&apos;elles servent la démonstration.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-line pt-6">
            <h2 className="text-sm font-bold text-ink">Ce qui va souvent avec</h2>
            <div className="mt-2">
              {circuit.neighbours.map((voisin) => {
                const autre = circuitFor(voisin.key);
                if (!autre) return null;
                return (
                  <Link
                    key={voisin.key}
                    href={`/circuits/${autre.key}`}
                    className="group flex items-center justify-between gap-4 border-b border-line py-3.5 transition last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] text-ink">{autre.label}</span>
                      <span className="mt-0.5 block text-xs text-ink-3">{voisin.why}</span>
                    </span>
                    <Icon name="arrow" className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                );
              })}
            </div>
            <p className="mt-5 text-xs text-ink-4">
              <Link href="/circuits" className="underline">Voir les sept circuits et ce qu&apos;ils ouvrent</Link> · la même règle partout : votre commune suffit.
            </p>
          </div>
        </Container>
      </section>
    </PublicPage>
  );
}
