import { PublicPage } from "@/components/public-shell";
import type { Metadata } from "next";
import { Container, EmptyState, Hero, SectionHeading } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db, isDatabaseConfigured } from "@/db";
import { offices } from "@/db/schema";
import { ilike, or } from "drizzle-orm";

export const metadata: Metadata = { title: "Annuaire des points d’accueil — AIME®", description: "Trouvez un point d’accueil près de chez vous." };

export const dynamic = "force-dynamic";

export default async function AnnuairePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  let items: (typeof offices.$inferSelect)[] = [];
  let directoryAvailable = isDatabaseConfigured;
  if (directoryAvailable) {
    try {
      items = q
        ? await db.select().from(offices).where(or(ilike(offices.city, `%${q}%`), ilike(offices.name, `%${q}%`), ilike(offices.postalCode, `%${q}%`), ilike(offices.region, `%${q}%`)))
        : await db.select().from(offices);
    } catch {
      directoryAvailable = false;
    }
  }

  return (
    <PublicPage>
      <Hero
        size="md"
        eyebrow="Points d’accueil AIME® · démonstration"
        title="Un point d’accueil près de chez vous"
        subtitle="Lieux fictifs de démonstration. Pour les organismes officiels (MSA, CAF, CPAM…), consultez la page Accompagnement."
      >
        <form role="search" className="mt-9 flex max-w-xl items-center gap-2 rounded-card bg-canvas p-2 shadow-rested ring-1 ring-line">
          <label htmlFor="q" className="sr-only">Ville, code postal ou région</label>
          <div className="flex min-w-0 flex-1 items-center gap-2 pl-2">
            <Icon name="pin" className="h-4 w-4 shrink-0 text-ink-4" />
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Ville, code postal ou région"
              className="h-10 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
            />
          </div>
          <button
            type="submit"
            className="h-10 shrink-0 rounded-control bg-ink px-4 text-sm font-medium text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-ink-2"
          >
            Rechercher
          </button>
        </form>
      </Hero>

      <section className="bg-canvas">
        <Container className="py-16 lg:py-20">
          <SectionHeading
            eyebrow="Annuaire interne"
            title={q ? `Résultats pour « ${q} »` : "Tous les points d’accueil"}
            description="Ces fiches servent à la démonstration. Les coordonnées réelles des organismes publics se vérifient sur les sites officiels."
          />

          <div className="mt-10">
            {items.length === 0 ? (
              <EmptyState
                title={directoryAvailable ? "Aucun bureau trouvé" : "Annuaire indisponible pour le moment"}
                description={directoryAvailable ? "Essayez une autre ville ou un autre code postal." : "Les lieux de démonstration seront affichés dès que la base de données du site sera configurée."}
              />
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {items.map((office) => (
                  <article key={office.id} className="rounded-card bg-canvas p-7 shadow-rested ring-1 ring-line">
                    <p className="eyebrow">{office.region}</p>
                    <h2 className="mt-3 text-xl text-ink">{office.name}</h2>
                    <ul className="mt-5 space-y-3 text-sm text-ink-2">
                      <li className="flex gap-3">
                        <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                        {office.address}, {office.postalCode} {office.city}
                      </li>
                      <li className="flex gap-3">
                        <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                        <a href={`tel:${office.phone.replace(/\s/g, "")}`} className="hover:underline hover:underline-offset-4">{office.phone}</a>
                      </li>
                      <li className="flex gap-3">
                        <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                        {office.hours}
                      </li>
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>
    </PublicPage>
  );
}
