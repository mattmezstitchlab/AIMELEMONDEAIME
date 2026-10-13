import { PublicPage } from "@/components/public-shell";
import type { Metadata } from "next";
import { Hero, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icon";
import { db } from "@/db";
import { offices } from "@/db/schema";
import { ilike, or } from "drizzle-orm";

export const metadata: Metadata = { title: "Annuaire des points d'accueil — AIME®", description: "Trouvez un point d'accueil près de chez vous." };

export const dynamic = "force-dynamic";

export default async function AnnuairePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const items = q
    ? await db.select().from(offices).where(or(ilike(offices.city, `%${q}%`), ilike(offices.name, `%${q}%`), ilike(offices.postalCode, `%${q}%`), ilike(offices.region, `%${q}%`)))
    : await db.select().from(offices);

  return (
    <PublicPage>
      <Hero tone="terre" eyebrow="Points d'accueil AIME® · démonstration" title="Un point d'accueil près de chez vous" subtitle="Lieux fictifs de démonstration. Pour les organismes officiels (MSA, CAF, CPAM…), consultez la page Accompagnement.">
        <form role="search" className="mt-9 flex max-w-xl overflow-hidden rounded-lg bg-white shadow-xl">
          <label htmlFor="q" className="sr-only">Ville, code postal ou région</label>
          <div className="flex flex-1 items-center gap-2 px-4">
            <Icon name="pin" className="h-5 w-5 text-slate-400" />
            <input id="q" name="q" defaultValue={q} placeholder="Ville, code postal ou région" className="w-full py-4 text-base text-slate-900 outline-none" />
          </div>
          <button type="submit" className="bg-emerald-800 px-6 text-base font-semibold text-white hover:bg-emerald-900">Rechercher</button>
        </form>
      </Hero>

      <div className="mx-auto max-w-6xl px-6 py-20">
        {items.length === 0 ? (
          <EmptyState title="Aucun bureau trouvé" description="Essayez une autre ville ou un autre code postal." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {items.map((office) => (
              <div key={office.id} className="rounded-2xl bg-[#fafaf9] p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{office.region}</p>
                <h2 className="mt-2 text-xl font-semibold text-[#1d1d1f]">{office.name}</h2>
                <ul className="mt-5 space-y-3 text-slate-700">
                  <li className="flex gap-3"><Icon name="pin" className="h-5 w-5 shrink-0 text-emerald-500" />{office.address}, {office.postalCode} {office.city}</li>
                  <li className="flex gap-3"><Icon name="phone" className="h-5 w-5 shrink-0 text-emerald-500" /><a href={`tel:${office.phone.replace(/\s/g, "")}`} className="hover:underline">{office.phone}</a></li>
                  <li className="flex gap-3"><Icon name="clock" className="h-5 w-5 shrink-0 text-emerald-500" />{office.hours}</li>
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicPage>
  );
}
