import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { PublicPage } from "@/components/public-shell";
import { Container, Hero, SectionHeading, Tag } from "@/components/ui";
import { Icon } from "@/components/icon";
import { CIRCUITS, openCircuits, plannedCircuits } from "@/lib/circuits";

/*
 * Les circuits.
 *
 * Une page d'entrée qui explique la méthode, puis une page par circuit. Ajouter
 * un circuit, c'est ajouter une entrée dans lib/circuits.ts et son tableau :
 * rien d'autre ne change, et les règles ci-dessous restent vraies.
 */

export const metadata: Metadata = {
  title: "Les circuits — AIME®",
  description:
    "Producteurs, coups de main, associations : des fiches situées par la commune, sans carte ni adresse exacte, et rien qui se conclut sans l'accord des personnes.",
};

export default function CircuitsPage() {
  const open = openCircuits();
  const planned = plannedCircuits();
  return (
    <PublicPage>
      <Hero
        image="/images/univers-terre.jpg"
        eyebrow="Les circuits · prototype indépendant"
        title="Un circuit, c'est une règle du jeu simple : on se situe par sa commune, on dit ce qu'on propose, et l'accord se fait entre les personnes."
        subtitle="Chaque circuit partage la même mécanique : une fiche, une commune et un code postal, un point approximatif, aucune adresse exacte demandée. Ce qui change d'un circuit à l'autre, ce sont les mots et ce qu'on y dépose."
        actions={
          <Link href="/le-monde-aime" className="inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-[15px] font-medium text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-ink-2">
            Voir toutes les publications
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      <section className="border-b border-line bg-subtle">
        <Container className="py-16 lg:py-20">
          <SectionHeading
            eyebrow={`${open.length} circuit(s) ouvert(s) aujourd'hui`}
            title="Les circuits ouverts."
            description="Ce qui suit est disponible maintenant. Le reste se construit dans le même moule, circuit par circuit, quand vous le décidez."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {open.map((circuit) => (
              <article key={circuit.key} className="flex flex-col rounded-card bg-canvas p-6 shadow-rested ring-1 ring-line">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-line">
                    <Icon name={circuit.icon} className="h-5 w-5 text-ink" />
                  </span>
                  <Tag>Ouvert</Tag>
                </div>
                <h2 className="mt-4 text-xl leading-snug text-ink">{circuit.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{circuit.tagline}</p>
                <dl className="mt-4 space-y-2 text-xs text-ink-3">
                  {circuit.guarantees.slice(0, 2).map((line) => (
                    <div key={line} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" strokeWidth={1.8} aria-hidden="true" />
                      <dd>{line}</dd>
                    </div>
                  ))}
                </dl>
                <Link href={`/circuits/${circuit.key}`} className="mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-control bg-ink px-5 text-[15px] font-medium text-canvas transition hover:bg-ink-2">
                  {circuit.deposit.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-canvas">
        <Container className="py-16 lg:py-20">
          <SectionHeading
            eyebrow="La méthode, la même partout"
            title="Ce qui ne change jamais d'un circuit à l'autre."
            description="Ces règles sont écrites dans le code du site, pas seulement dans la page : elles valent pour chaque circuit, présent et à venir."
          />
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {[
              "Aucun paiement ne circule sur le site : les prix sont indicatifs et le règlement se fait au retrait, entre les personnes.",
              "Rien ne se réserve sans l'accord de la personne concernée, et rien ne s'impose à qui que ce soit.",
              "Une fiche est située par sa commune et son code postal : le point reste approximatif, jamais une adresse.",
              "Chaque fiche se retire en un geste, et une disponibilité se suspend d'un seul interrupteur.",
            ].map((rule) => (
              <li key={rule} className="flex gap-3 rounded-card bg-subtle p-5 text-sm leading-relaxed text-ink-2 ring-1 ring-line-soft">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={1.8} aria-hidden="true" />
                {rule}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {planned.length === 0 && (
        <section className="border-t border-line bg-subtle">
          <Container className="py-14">
            <SectionHeading
              eyebrow="La suite"
              title="Rien d'autre n'est ouvert aujourd'hui."
              description="Un circuit s'écrit dans le même moule : un catalogue de mots, des règles vérifiées par des tests, puis une relecture avant d'ouvrir. Le prochain le sera quand il sera prêt, pas avant."
            />
          </Container>
        </section>
      )}

      {planned.length > 0 && (
        <section className="border-t border-line bg-subtle">
          <Container className="py-16 lg:py-20">
            <SectionHeading
              eyebrow="Déjà préparés"
              title="Les circuits suivants."
              description="La mécanique est prête : il reste à écrire leur tableau et à le relire avec vous. Aucun n'est accessible en écriture tant qu'il n'est pas ouvert ici."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {planned.map((circuit) => (
                <article key={circuit.key} className="rounded-card bg-canvas p-6 ring-1 ring-line">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-line">
                      <Icon name={circuit.icon} className="h-5 w-5 text-ink-3" />
                    </span>
                    <Tag tone="outline">En préparation</Tag>
                  </div>
                  <h2 className="mt-4 text-xl leading-snug text-ink">{circuit.label}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{circuit.tagline}</p>
                  <p className="mt-3 text-xs leading-relaxed text-ink-3">{circuit.pending}</p>
                  <Link href={`/circuits/${circuit.key}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink underline">
                    Voir le circuit prévu
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="bg-canvas">
        <Container className="py-16">
          <SectionHeading
            eyebrow="Ce qui existe déjà"
            title="Les circuits ne remplacent rien."
            description="Le Monde Aime reste la liste publique des propositions, besoins, projets et trajets. Un circuit est un cadre plus précis pour un type de fiche : la même maison, une pièce de plus."
            actions={
              <Link href="/le-monde-aime" className="inline-flex h-11 items-center gap-2 rounded-control bg-canvas px-5 text-[15px] font-medium text-ink-2 ring-1 ring-line transition hover:bg-subtle hover:text-ink">
                Explorer Le Monde Aime
              </Link>
            }
          />
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-4">
            AIME® est un prototype indépendant, non affilié à un organisme. Les circuits affichent des fiches déclaratives : ni label, ni contrôle qualité, ni engagement de résultat.
          </p>
        </Container>
      </section>
    </PublicPage>
  );
}
