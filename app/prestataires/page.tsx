import { ProviderBrief } from "@/components/community/provider-brief";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { Hero, LinkButton } from "@/components/ui";
import { AUTH_ENABLED } from "@/lib/auth-mode";

export const metadata: Metadata = { title: "Prestataires — AIME®", description: "Trouver un prestataire ou découvrir comment proposer ses services autour d’un mariage." };

export default function PrestatairesPage() {
  return <PublicPage>
    <Hero image="/images/univers-arts.jpg" eyebrow="Les personnes qui font le jour J" title="Prestataires, vous avez votre place." subtitle="Vous cherchez un savoir-faire pour votre mariage, ou vous souhaitez proposer le vôtre ? Choisissez votre point de départ." />
    <PageColumn className="grid gap-8 py-12 md:grid-cols-2 lg:gap-16 lg:py-20">
      <section className="rounded-card bg-subtle p-6 sm:p-10">
        <p className="eyebrow">J’organise</p><h2 className="mt-4 text-3xl">Trouver les bonnes personnes.</h2>
        <p className="mt-4 leading-relaxed text-ink-3">Explorez les propositions du territoire. Les disponibilités, les tarifs et les conditions restent à convenir directement avec les personnes ; aucun paiement ni contrat n’est conclu ici.</p>
        <nav aria-label="Trouver des prestataires" className="mt-6">
          {[ ["Artistes et propositions", "/le-monde-aime?univers=arts"], ["Producteurs pour le repas", "/circuits/producteurs"], ["Artisans et savoir-faire", "/circuits/artisans"], ["Logements pour les proches", "/circuits/logements"], ["Trajets et déplacements", "/circuits/transports"] ].map(([label, href]) => <Link className="circuit-index" key={href} href={href}>{label}<span className="ml-auto" aria-hidden="true">↗</span></Link>)}
        </nav>
      </section>
      <section className="rounded-card bg-subtle p-6 sm:p-10">
        <p className="eyebrow">Je propose mes services</p><h2 className="mt-4 text-3xl">Présenter mon activité.</h2>
        <p className="mt-4 leading-relaxed text-ink-3">Les artistes et techniciens disposent d’un espace dédié. Les autres activités s’appuient sur les propositions et les circuits existants : un tableau de bord commun rassemble vos prestations et vos demandes ; les engagements artistiques gardent leur suivi spécialisé.</p>
        <p className="mt-5 leading-relaxed text-ink-3">{AUTH_ENABLED ? "Un compte membre est nécessaire pour publier et gérer vos propositions." : "Les comptes sont actuellement fermés. La consultation est ouverte, mais vous ne pouvez pas encore publier ni gérer de prestations."}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href={AUTH_ENABLED ? "/prestataires/espace" : "/mon-espace"}>{AUTH_ENABLED ? "Mon activité prestataire" : "Disponibilité des comptes"}</LinkButton>
          {AUTH_ENABLED && <LinkButton href="/le-monde-aime?onglet=publier" variant="secondary">Proposer une prestation</LinkButton>}
        </div>
      </section>
      <div className="md:col-span-2"><ProviderBrief /></div>
    </PageColumn>
  </PublicPage>;
}
