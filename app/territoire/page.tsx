import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: "Autour du Mont Noir — AIME®", description: "Bailleul, Saint-Jans-Cappel et le Mont Noir : un point de départ pour comprendre les liens de part et d’autre de la frontière franco-belge." };

export default function TerritoryPage() {
  return <PublicPage><PageColumn className="py-12 sm:py-20">
    <p className="eyebrow">Bailleul · Saint-Jans-Cappel · Mont Noir</p>
    <h1 className="mt-5 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] leading-[1.05] tracking-tight">Partir d’un lieu,<br />sans s’y enfermer.</h1>
    <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-2">Une frontière traverse le pays. La vie passe de part et d’autre. On demeure ici, on travaille ailleurs ; des proches, des métiers et des habitudes nous attachent aux deux côtés. Encore faut-il savoir à quelle porte frapper.</p>
    <div className="mt-10 flex flex-wrap gap-3"><LinkButton href="/carte-des-liens">Explorer la carte des liens</LinkButton><LinkButton href="/circuits" variant="secondary">Voir les circuits</LinkButton></div>
    <section className="mt-16 grid gap-10 border-t border-line pt-12 md:grid-cols-2">
      <div><p className="eyebrow">La mémoire des lieux</p><h2 className="mt-4 text-3xl">Ce qui demeure. Ce qui se transmet.</h2></div>
      <div className="space-y-5 text-base leading-relaxed text-ink-3"><p>Au Mont Noir, le paysage porte aussi une mémoire littéraire. À Saint-Jans-Cappel, la Villa Marguerite Yourcenar se trouve sur le domaine où l’écrivaine a vécu ses premières années. Elle accueille aujourd’hui des auteurs en résidence.</p><p>Cette présence invite à regarder autrement : un lieu n’est pas seulement un point où se rendre. Il est fait de vies qui s’y sont croisées, de gestes conservés et de choses qu’il reste à apprendre.</p><a href="https://villamargueriteyourcenar.fr/la-residence-d-ecritures" target="_blank" rel="noopener noreferrer" className="inline-block min-h-11 py-2 font-semibold text-ink underline">Découvrir la résidence sur son site officiel ↗</a><p className="text-sm">AIME est un projet indépendant, sans affiliation ni partenariat annoncé avec la Villa ou le Département du Nord. Les textes de cette page sont originaux ; ils ne sont ni des citations ni des textes de Marguerite Yourcenar.</p></div>
    </section>
    <section className="mt-16 rounded-card bg-subtle p-6 sm:p-10">
      <p className="eyebrow">Habiter la frontière</p><h2 className="mt-4 text-3xl">Deux pays. Des situations à distinguer.</h2>
      <p className="mt-5 max-w-3xl leading-relaxed text-ink-3">Résider en France et travailler en Belgique n’est pas la même situation que résider en Belgique et travailler en France. Le statut, le régime d’affiliation et la nature de l’activité peuvent changer les interlocuteurs. Une proximité géographique ne suffit pas à déterminer vos droits.</p>
      <a href="https://www.cleiss.fr/particuliers/frontaliers.html" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block min-h-11 py-2 font-semibold underline">Consulter les repères officiels du CLEISS sur les soins des frontaliers ↗</a>
      <p className="mt-4 text-sm leading-relaxed text-ink-3">Cette ressource concerne la protection sociale et les soins : elle ne remplace pas une vérification de votre situation et ne couvre pas à elle seule la fiscalité, l’état civil ou toutes les situations professionnelles.</p>
    </section>
    <section className="mt-16 max-w-3xl"><h2 className="text-3xl">Un premier ancrage, pas une couverture déjà acquise.</h2><p className="mt-5 leading-relaxed text-ink-3">Le Mont Noir et Bailleul sont le point de départ proposé pour AIME. Cette page ne signifie pas qu’un réseau de partenaires locaux est constitué. La carte représente encore le catalogue français existant ; elle ne détermine pas les organismes compétents en Belgique.</p><p className="mt-4 leading-relaxed text-ink-3">Les formulaires de publication et le calcul de proximité restent limités à la France métropolitaine. La prise en charge des adresses belges, des deux pays de résidence et de travail, et des parcours transfrontaliers reste à développer et à vérifier.</p><Link href="/carte-des-liens" className="mt-6 inline-block min-h-11 py-2 font-semibold underline">Voir le périmètre actuel de la carte</Link></section>
  </PageColumn></PublicPage>;
}
