import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { HeroCard, LinkRow, TileHeading } from "@/components/marketing/tiles";
import { Icon, type IconName } from "@/components/icon";
import { Card, LinkButton } from "@/components/ui";
import { openCircuits } from "@/lib/circuits";

/*
 * Le tour du site.
 *
 * La page qui répond à « tout, au même endroit » : cinq temps, dans l'ordre
 * où une personne les traverse, et la règle du jeu qui ne change jamais. Elle
 * se lit comme un sommaire — chaque temps dit ce qu'on y fait et ouvre les
 * pages correspondantes — et les circuits y sont listés depuis le catalogue,
 * pour que le tour reste juste quand un circuit s'ajoute.
 */

export const metadata: Metadata = {
  title: "Le tour du site — AIME®",
  description:
    "Cinq temps, une même règle : entrer par un moment de vie, comprendre, préparer, trouver les personnes de son secteur, garder ce qui compte et ce qui se transmet.",
};

const STEPS: Array<{
  anchor: string;
  icon: IconName;
  kicker: string;
  title: string;
  text: string;
  links: Array<{ href: string; label: string; meta: string }>;
}> = [
  {
    anchor: "entrer",
    icon: "heart",
    kicker: "Premier temps",
    title: "Entrer par ce qui vous arrive.",
    text:
      "Un mariage, une naissance, une installation, une saison qui commence, quelqu’un qui s’en va. On n’entre pas ici par un formulaire : on entre par un moment de vie, et c’est lui qui décide de la suite.",
    links: [
      { href: "/", label: "Le récit d’ouverture", meta: "Pourquoi AIME® existe, en quelques lignes" },
      { href: "/accompagnement?besoin=mariage", label: "Le mariage, porte d’entrée", meta: "Dossier civil, invités, budget, jour J — puis ce qui se transmet" },
    ],
  },
  {
    anchor: "comprendre",
    icon: "book",
    kicker: "Deuxième temps",
    title: "Comprendre, sans décider à votre place.",
    text:
      "Des repères clairs sur les démarches, les délais et les interlocuteurs — y compris ce qui dépend de votre mairie ou de votre caisse, et ce qu’AIME® ne décide pas. Rien ici ne remplace un guichet officiel : on explique, vous gardez la main.",
    links: [
      { href: "/informations", label: "Les guides par thème", meta: "Mariage, famille, logement, santé, retraite, transmission…" },
      { href: "/annuaire", label: "Les points d’accueil de votre secteur", meta: "À qui parler, avec les coordonnées officielles" },
    ],
  },
  {
    anchor: "preparer",
    icon: "demarches",
    kicker: "Troisième temps",
    title: "Préparer, étape par étape.",
    text:
      "Le parcours garde le fil : ce qu’on prépare maintenant, ce qui peut attendre, ce qu’il ne faut pas oublier, et qui fait quoi. Vous enregistrez, vous reprenez quand vous voulez — sans recommencer votre histoire à chaque étape.",
    links: [
      { href: "/accompagnement", label: "Choisir un parcours", meta: "Par situation : mariage, famille, logement, activité, cessation" },
      { href: "/mon-espace", label: "Mon espace", meta: "Le dossier, les proches, les échéances — les comptes sont en préparation" },
    ],
  },
  {
    anchor: "trouver",
    icon: "entraide",
    kicker: "Quatrième temps",
    title: "Trouver les personnes.",
    text:
      "C’est le cœur : ce qui pousse, se répare, se prête, se loge, se conduit, s’apprend. Sept circuits et l’entraide de proximité, situés à la commune près — jamais à l’adresse, et jamais sans l’accord de la personne concernée.",
    links: [],
  },
  {
    anchor: "garder",
    icon: "lock",
    kicker: "Cinquième temps",
    title: "Garder, et transmettre.",
    text:
      "Vos documents, vos échanges et votre mémoire au même endroit — avec une place pour ce qui se passe de main en main : un geste, un métier, une recette, une histoire de famille ou de village.",
    links: [
      { href: "/mon-espace", label: "Mon espace", meta: "Vos documents, leurs partages, vos échanges, vos projets" },
      { href: "/circuits/transmission", label: "Transmission et mémoire", meta: "Ce que des personnes acceptent de transmettre, près de chez elles" },
    ],
  },
];

const RULES = [
  "Votre commune suffit : aucune adresse n’est demandée, aucune n’est publiée.",
  "Aucun paiement ne passe par AIME®, aucune réservation : tout se règle entre les personnes.",
  "Rien ne se conclut sans l’accord de celle ou celui que cela concerne.",
  "Ce qui est fictif est signalé comme fictif, et rien n’est certifié à votre place.",
  "Prototype indépendant, non affilié à un organisme : les décisions officielles restent ailleurs.",
];

export default function TourPage() {
  const circuits = openCircuits();

  return (
    <PublicPage>
      <PageColumn className="flex flex-col gap-5 pt-4 sm:pt-6">
        <HeroCard
          eyebrow="Le tour du site"
          title="Tout, au même endroit."
          subtitle="Cinq temps, une seule règle. Vous entrez par ce qui vous arrive, vous comprenez ce qui dépend de vous, vous préparez ce qu’il faut — et vous trouvez les personnes, à côté de chez vous. Voici le chemin complet, dans l’ordre."
        />

        <nav aria-label="Les cinq temps" className="rounded-card bg-subtle p-5 ring-1 ring-line-soft">
          <p className="nav-tiny text-ink-3">Les cinq temps</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {STEPS.map((step, index) => (
              <li key={step.anchor}>
                <Link href={`#${step.anchor}`} className="group flex items-center gap-3 text-sm text-ink-2 transition hover:text-ink">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1 ring-line font-display text-xs text-ink">{index + 1}</span>
                  <span className="min-w-0 truncate">{step.title}</span>
                  <Icon name="arrow" className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        {STEPS.map((step, index) => {
          const links = step.anchor === "trouver"
            ? [
                ...circuits.map((circuit) => ({ href: `/circuits/${circuit.key}`, label: circuit.label, meta: circuit.tagline })),
                { href: "/le-monde-aime", label: "Entraide et projets du voisinage", meta: "Ce qui se donne, se cherche, se prête ou s’organise autour de vous" },
              ]
            : step.links;

          return (
            <section key={step.anchor} id={step.anchor} className="scroll-mt-20">
              <Card className="bg-subtle shadow-none ring-line-soft">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-canvas ring-1 ring-line">
                    <Icon name={step.icon} className="h-5 w-5 text-ink" />
                  </span>
                  <div className="min-w-0">
                    <p className="nav-tiny text-ink-3">{step.kicker} · {index + 1} sur {STEPS.length}</p>
                    <h2 className="mt-1.5 text-[1.35rem] leading-snug tracking-[-0.02em] text-ink">{step.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.text}</p>
                  </div>
                </div>
                {links.length > 0 && (
                  <div className="mt-3 border-t border-line pt-1">
                    {links.map((link) => (
                      <LinkRow key={link.href} href={link.href} title={link.label} meta={link.meta} />
                    ))}
                  </div>
                )}
              </Card>
            </section>
          );
        })}

        <section className="mt-2">
          <TileHeading>La règle du jeu, la même partout.</TileHeading>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2.5 rounded-card bg-canvas p-4 ring-1 ring-line">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                <p className="text-[13px] leading-relaxed text-ink-2">{rule}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-card bg-subtle p-6 text-center ring-1 ring-line-soft sm:p-8">
          <h2 className="text-[1.6rem] leading-tight tracking-[-0.02em] text-ink">Vous ne savez pas par où commencer ?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-3">
            C’est normal : c’est pour ça que le mariage sert de porte d’entrée. On y prépare un moment de vie précis, et on découvre au passage tout le reste.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <LinkButton href="/accompagnement?besoin=mariage" size="lg">
              Commencer par un mariage
              <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/circuits" variant="secondary" size="lg">
              Voir les sept circuits
            </LinkButton>
          </div>
        </section>
      </PageColumn>
    </PublicPage>
  );
}
