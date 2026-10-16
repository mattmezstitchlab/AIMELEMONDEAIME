import { AUTH_ENABLED } from "@/lib/auth-mode";
import Link from "next/link";
import Image from "next/image";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { ImmersiveHero, LandscapeSection } from "@/components/marketing/immersive";
import { LinkButton } from "@/components/ui";
import { openCircuits } from "@/lib/circuits";

const ENTRIES = [
  { number: "01", title: "Préparer un moment de vie", text: "Comprendre les étapes, rassembler les pièces et trouver les bons interlocuteurs. Le mariage est notre point de départ.", href: "/accompagnement", label: "Les parcours", image: "/images/hero-mariage.jpg" },
  { number: "02", title: "Trouver autour de soi", text: "Producteurs, artisans, coups de main, logements, trajets : sept circuits pour se relier à son territoire.", href: "/circuits", label: "Les sept circuits", image: "/images/univers-terre.jpg" },
  { number: "03", title: "Comprendre et transmettre", text: "Des guides pour s’orienter. Des personnes, des projets et des savoir-faire pour continuer ensemble.", href: "/informations", label: "Les guides", image: "/images/univers-savoirs.jpg" },
];

export default function HomePage() {
  return (
    <PublicPage>
      <ImmersiveHero priority image="/images/hero-mariage.jpg" eyebrow="AIME® — Le Monde Aime" title="Un mariage pour se réunir. Des liens pour la suite." text="Préparer votre mariage, trouver les savoir-faire du territoire et donner une place à vos proches. AIME® relie l’événement à ce qui peut continuer après.">
        <LinkButton href="/accompagnement?besoin=mariage" size="lg">Préparer mon mariage</LinkButton>
        <LinkButton href="#explorer" variant="secondary" size="lg">Explorer le site ↓</LinkButton>
      </ImmersiveHero>

      {!AUTH_ENABLED && <PageColumn className="pt-6"><p className="rounded-control bg-subtle p-4 text-sm leading-relaxed text-ink-3">Version publique de découverte : explorez les parcours et préparez votre demande de prestation. Les comptes, la publication et la création de projets ne sont pas encore ouverts. <Link href="/mon-espace" className="font-semibold underline">Voir les disponibilités</Link>.</p></PageColumn>}
      <PageColumn className="grid gap-4 py-8 sm:grid-cols-2 lg:py-12">
        <Link href="/prestataires" className="action-row justify-between"><span><span className="block text-xl font-semibold">Je suis prestataire</span><span className="mt-2 block text-sm text-ink-3">Présenter mon activité ou explorer les services disponibles</span></span><span aria-hidden="true">↗</span></Link>
        <Link href="/invites" className="action-row justify-between"><span><span className="block text-xl font-semibold">Je suis invité ou proche</span><span className="mt-2 block text-sm text-ink-3">Répondre à une invitation ou rejoindre l’organisation</span></span><span aria-hidden="true">↗</span></Link>
      </PageColumn>

      <nav aria-label="Les grandes rubriques du site" className="architecture-nav">
        <PageColumn className="grid grid-cols-2 gap-1 py-5 md:grid-cols-4">
          {[ ["01 · Les parcours", "/accompagnement"], ["02 · Les circuits", "/circuits"], ["03 · Les guides", "/informations"], ["04 · L’entraide", "/le-monde-aime"] ].map(([label, href]) => <Link key={href} href={href} className="flex min-h-12 items-center px-3 text-sm font-semibold transition hover:bg-muted">{label} <span className="ml-auto" aria-hidden="true">↗</span></Link>)}
        </PageColumn>
      </nav>

      <section id="explorer" className="scroll-mt-24 py-16 sm:py-24 lg:py-32">
        <PageColumn>
          <div className="section-lead"><p className="eyebrow">Votre point de départ</p><h2>Trois portes d’entrée.<br />Un même fil.</h2><p>Pas besoin de tout connaître. Choisissez ce qui vous amène aujourd’hui.</p></div>
          <div className="mt-10 grid gap-8 lg:mt-16 lg:grid-cols-3">
            {ENTRIES.map((entry) => <Link key={entry.number} href={entry.href} className="editorial-card group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-card"><Image src={entry.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 80vw, 100vw" className="object-cover grayscale transition duration-500 group-hover:scale-105 motion-reduce:transform-none" /></div>
              <p className="eyebrow mt-6">{entry.number} / {entry.label}</p><h3 className="mt-3 text-2xl sm:text-3xl">{entry.title}</h3><p className="mt-4 max-w-md text-base leading-relaxed text-ink-3">{entry.text}</p><span className="mt-6 inline-flex min-h-11 items-center gap-4 text-sm font-semibold">Explorer <span aria-hidden="true">↗</span></span>
            </Link>)}
          </div>
        </PageColumn>
      </section>

      <LandscapeSection image="/images/hero-famille.jpg" number="01 / Les moments de vie" title="Le mariage, et tout ce qu’il relie." text="Le dossier civil d’abord. La fête, si vous en voulez une. Les proches et le jour J ensuite. Un parcours pour préparer, sans remplacer votre mairie." href="/accompagnement?besoin=mariage" label="Découvrir le parcours mariage" />

      <section className="py-16 sm:py-24 lg:py-32">
        <PageColumn>
          <div className="section-lead"><p className="eyebrow">02 / Le territoire</p><h2>Sept circuits.<br />Des liens tout proches.</h2><p>Choisir une rubrique, trouver une proposition, se mettre d’accord. Votre commune suffit, aucune adresse exacte à publier.</p></div>
          <div className="mt-10 grid gap-x-10 md:grid-cols-2 lg:mt-16">
            {openCircuits().map((circuit, index) => <Link key={circuit.key} href={`/circuits/${circuit.key}`} className="circuit-index group"><span className="text-xs text-ink-4">0{index + 1}</span><span className="min-w-0"><span className="block text-xl sm:text-2xl">{circuit.label}</span><span className="mt-2 block text-sm leading-relaxed text-ink-3">{circuit.tagline}</span></span><span aria-hidden="true" className="ml-auto text-xl transition group-hover:translate-x-1">↗</span></Link>)}
          </div>
          <LinkButton href="/circuits" variant="secondary" className="mt-10">Comprendre les circuits</LinkButton>
        </PageColumn>
      </section>

      <LandscapeSection image="/images/univers-savoirs.jpg" number="03 / Ce qui se transmet" title="Un geste, une histoire, un savoir-faire." text="Ce qui mérite d’être appris ne devrait pas se perdre. Explorez les personnes, les projets et les propositions du Monde Aime." href="/le-monde-aime" label="Explorer l’entraide et les transmissions" />

      <section className="bg-subtle py-16 sm:py-24 lg:py-32">
        <PageColumn className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          <div className="section-lead"><p className="eyebrow">Pour continuer</p><h2>Chaque chose<br />à sa place.</h2><p>Retrouvez les repères utiles, découvrez la méthode ou faites le tour des possibilités avant de commencer.</p></div>
          <nav aria-label="Ressources et accès" className="self-center">
            {[ ["Les guides pratiques", "S’informer par sujet de vie", "/informations"], ["Le tour du site", "Comprendre comment tout se relie", "/le-tour"], ["Les points d’accueil", "Trouver un interlocuteur", "/annuaire"], ["Mon espace", "Comprendre l’accès et la disponibilité des comptes", "/mon-espace"] ].map(([title, text, href]) => <Link className="circuit-index" href={href} key={href}><span><span className="block text-xl">{title}</span><span className="mt-2 block text-sm text-ink-3">{text}</span></span><span aria-hidden="true" className="ml-auto">↗</span></Link>)}
          </nav>
        </PageColumn>
      </section>
    </PublicPage>
  );
}
