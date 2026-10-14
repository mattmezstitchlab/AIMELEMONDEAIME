import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { PublicPage } from "@/components/public-shell";
import { Container, Hero, SectionHeading, Tag } from "@/components/ui";
import { Icon } from "@/components/icon";
import { MILESTONES, PILOT_CRITERIA, POSITIONING, SOURCES } from "@/lib/vision";

export const metadata: Metadata = {
  title: "Notre méthode et nos limites — AIME®",
  description: "Ce que fait le prototype AIME®, ce qui existe déjà dans les services publics et ce qui exige un audit ou une habilitation.",
};

const STATUS: Record<string, { text: string; className: string }> = {
  fonctionne: { text: "Fonctionne dans ce prototype", className: "bg-state-success-soft text-state-success ring-state-success-line" },
  a_verifier: { text: "À vérifier avant déploiement", className: "bg-state-warning-soft text-state-warning ring-state-warning-line" },
  habilitation: { text: "Habilitation nécessaire", className: "bg-state-danger-soft text-state-danger ring-state-danger-line" },
};

export default function VisionPage() {
  return (
    <PublicPage solidHeader>
      <Hero
        size="lg"
        eyebrow="Notre méthode · prototype indépendant"
        title="Une expérience simple. Des preuves vérifiables."
        subtitle="AIME® ne remplace aucun organisme. Nous réunissons, dans un même espace privé, la préparation des moments de vie et les ressources du territoire. Ici, vous voyez précisément ce qui fonctionne et ce qui reste à construire."
        actions={
          <>
            <Link href="/accompagnement" className="inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-[15px] font-medium text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-ink-2">
              Décrire un besoin
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/decouvrir" className="inline-flex h-11 items-center gap-2 rounded-control bg-canvas px-5 text-[15px] font-medium text-ink-2 ring-1 ring-line transition hover:bg-subtle hover:text-ink">
              Voir Mon espace (démo)
            </Link>
          </>
        }
      />

      <section className="border-b border-line bg-subtle">
        <Container className="py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: "01", title: "Votre histoire", text: "Saisir le strict nécessaire et pouvoir corriger, reprendre ou supprimer ce qui vous appartient.", icon: "shield" as const },
              { n: "02", title: "Votre territoire", text: "Trouver personnes, offres, besoins et projets sur une carte, sans exposer d’adresse privée.", icon: "pin" as const },
              { n: "03", title: "Vos décisions", text: "Distinguer ce que vous avez préparé, ce qui a été réellement envoyé et ce qu’un organisme a confirmé.", icon: "lock" as const },
            ].map((item) => (
              <div key={item.n} className="rounded-card bg-canvas p-6 shadow-rested ring-1 ring-line">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs tracking-[0.14em] text-ink-4">{item.n}</span>
                  <Icon name={item.icon} className="h-5 w-5 text-ink-3" />
                </div>
                <h2 className="mt-5 text-xl text-ink">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-canvas">
        <Container className="py-16 lg:py-20">
          <SectionHeading
            eyebrow="Comparaison honnête"
            title="Ce qui existe déjà — et notre place."
            description="Aucune de ces lignes ne relève du partenariat : elles documentent simplement ce que d’autres font déjà mieux que nous."
          />
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {POSITIONING.map((line) => (
              <li key={line} className="flex gap-3 rounded-card bg-subtle p-5 text-sm leading-relaxed text-ink-2 ring-1 ring-line-soft">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={1.8} aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y border-line bg-subtle">
        <Container className="py-16 lg:py-20">
          <SectionHeading
            eyebrow="État réel"
            title="Ce qui marche, ce qui reste."
            description="Chaque chantier énonce ce qui est disponible aujourd’hui et ce qu’il faudrait avant d’aller plus loin."
          />
          <div className="mt-8 divide-y divide-line">
            {MILESTONES.map((m) => (
              <article key={m.title} className="grid gap-4 py-7 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ring-1 ${STATUS[m.status].className}`}>
                    {STATUS[m.status].text}
                  </span>
                  <h3 className="mt-3 text-lg leading-snug text-ink">{m.title}</h3>
                </div>
                <div className="space-y-2 text-sm leading-relaxed text-ink-2">
                  <p><strong>Aujourd’hui :</strong> {m.present}</p>
                  <p className="text-ink-3"><strong>Avant d’aller plus loin :</strong> {m.next}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-4">
            Aucune connexion FranceConnect, API Particulier ou transmission vers un organisme n’est active. Les points d’accueil
            historiques de la démo ne sont pas des guichets officiels certifiés.
          </p>
        </Container>
      </section>

      <section className="bg-canvas">
        <Container className="py-16 lg:py-20">
          <SectionHeading
            eyebrow="Recette à conduire"
            title="À mesurer avec de vraies personnes."
            description="Ce sont des critères de validation, pas des résultats acquis ni une certification d’accessibilité."
          />
          <ol className="mt-8 grid gap-3 md:grid-cols-2">
            {PILOT_CRITERIA.map((item, index) => (
              <li key={item} className="flex gap-4 rounded-card bg-muted p-5 text-sm leading-relaxed text-ink-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-canvas font-display text-[11px] text-ink-3 ring-1 ring-line">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-night text-white/70">
        <Container className="py-16 lg:py-20">
          <p className="eyebrow text-white/55">Sources primaires consultées</p>
          <h2 className="mt-4 max-w-3xl text-3xl leading-tight text-white sm:text-4xl">Vérifier chaque proposition à sa source.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
            Les liens suivants documentent notre positionnement. Ils ne valent pas partenariat ni intégration. Les contenus réglementaires
            doivent être révisés avant tout usage réel.
          </p>
          <ul className="mt-9 grid gap-3 md:grid-cols-2">
            {SOURCES.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col rounded-card bg-canvas/[0.04] p-5 ring-1 ring-white/10 transition hover:bg-canvas/[0.07] hover:ring-white/25"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white">
                    {source.name}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="mt-2 text-xs leading-relaxed text-white/60">{source.lesson}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Tag tone="outline">Prototype indépendant</Tag>
            <p className="text-xs text-white/55">Dernière revue des repères réglementaires : voir les dates citées dans les fiches.</p>
          </div>
        </Container>
      </section>
    </PublicPage>
  );
}
