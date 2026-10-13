import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public-shell";
import { Hero, LinkButton } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { SITUATIONS, type Situation } from "@/lib/situations";

type UniversePage = {
  slug: string;
  label: string;
  tagline: string;
  description: string;
  image: string;
  icon: IconName;
  mapUniverse?: string;
  find: string[];
  situations: string[];
  publishHint: string;
};

const PAGES: UniversePage[] = [
  {
    slug: "terre",
    label: "Terre & quotidien",
    tagline: "Produits locaux, entraide et vie de tous les jours.",
    description:
      "Le quotidien près de chez vous : paniers de légumes et produits fermiers, dons et besoins essentiels, objets et matériel à donner, prêter ou louer, trajets de proximité, jardins partagés et découverte des métiers.",
    image: "/images/univers-terre.jpg",
    icon: "sprout",
    mapUniverse: "terre",
    find: ["Produits locaux et agriculture", "Dons et besoins essentiels", "Objets et matériel", "Trajets et livraisons", "Jardins partagés et lieux"],
    situations: ["activite", "emploi", "quotidien", "logement"],
    publishHint: "Proposez vos produits, un objet, un trajet — ou publiez un besoin, et recevez les propositions du voisinage.",
  },
  {
    slug: "arts",
    label: "Arts & rencontres",
    tagline: "Musiciens, artistes, lieux et moments partagés.",
    description:
      "La vie culturelle du territoire : musiciens et artistes, techniciens, lieux culturels et salles, concerts et ateliers, matériel de spectacle et espaces de répétition.",
    image: "/images/univers-arts.jpg",
    icon: "music",
    mapUniverse: "arts",
    find: ["Concerts et prestations artistiques", "Lieux et espaces de répétition", "Matériel de spectacle", "Ateliers et rencontres"],
    situations: ["evenement", "emploi"],
    publishHint: "Proposez une prestation, un concert ou un atelier — ou cherchez un artiste, un lieu, du matériel.",
  },
  {
    slug: "savoirs",
    label: "Savoirs & générations",
    tagline: "Transmettre, apprendre, raconter.",
    description:
      "Les savoir-faire qui se transmettent : cuisine, couture, réparation, musique, jardinage, récits de vie et mémoire locale, entre générations.",
    image: "/images/univers-savoirs.jpg",
    icon: "graduation",
    mapUniverse: "savoirs",
    find: ["Ateliers et savoir-faire", "Cuisine, couture et réparation", "Récits de vie et mémoire locale", "Rencontres entre générations"],
    situations: ["quotidien", "emploi", "proche"],
    publishHint: "Proposez un atelier, partagez une recette ou un récit — ou dites ce que vous aimeriez apprendre.",
  },
  {
    slug: "evenements",
    label: "Événements et artistes",
    tagline: "Organiser une fête, engager un artiste, tout préparer.",
    description:
      "Fête de village, mariage, repas associatif, concert : trouvez un artiste, préparez l'engagement pas à pas, rassemblez le mobilier, les produits et le transport — chaque contribution est acceptée par son propriétaire.",
    image: "/images/hero-famille.jpg",
    icon: "calendar",
    mapUniverse: "arts",
    find: ["Artistes et prestations", "Matériel pour événement", "Lieux et salles", "Produits locaux pour le repas", "Transport"],
    situations: ["evenement"],
    publishHint: "Créez un projet d'événement, listez vos besoins, puis demandez chaque contribution séparément.",
  },
  {
    slug: "aidants",
    label: "Accompagner un proche",
    tagline: "Autonomie, handicap et soutien aux aidants.",
    description:
      "Quand un proche perd en autonomie ou vit avec un handicap : trouver les bons interlocuteurs, organiser l'aide au quotidien et souffler, sans jamais partager de données médicales.",
    image: "/images/hero-conseiller.jpg",
    icon: "heart",
    find: ["Aide au quotidien et déplacements", "Cercles privés familiaux", "Structures d'accompagnement externes"],
    situations: ["proche", "quotidien"],
    publishHint: "Créez un cercle privé pour coordonner l'aide en famille, ou publiez un besoin d'aide au quotidien.",
  },
  {
    slug: "administratif",
    label: "Vie administrative",
    tagline: "Comprendre, préparer, suivre — sans s'y perdre.",
    description:
      "Démarches et organismes de référence : santé, famille, emploi, activité, retraite, logement. AIME® vous oriente et vous aide à préparer vos dossiers ; les organismes restent seuls décisionnaires.",
    image: "/images/hero-espace.jpg",
    icon: "shield",
    find: ["Santé, famille, logement, retraite", "Emploi, activité, formation", "Organismes officiels et liens vérifiés"],
    situations: ["activite", "emploi", "famille", "logement", "retraite", "quotidien"],
    publishHint: "Décrivez votre situation une seule fois : AIME® prépare avec vous les étapes, les pièces et les rappels.",
  },
];

const BY_SLUG = new Map(PAGES.map((p) => [p.slug, p]));
const SIT_BY_KEY = new Map<string, Situation>(SITUATIONS.map((s) => [s.key, s]));

export function generateStaticParams() {
  return PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const page = BY_SLUG.get((await params).slug);
  return { title: page ? `${page.label} — AIME®` : "Univers — AIME®" };
}

export default async function UniversePage({ params }: { params: Promise<{ slug: string }> }) {
  const page = BY_SLUG.get((await params).slug);
  if (!page) notFound();
  const situations = page.situations.map((k) => SIT_BY_KEY.get(k)).filter((s): s is Situation => Boolean(s));
  const mapHref = page.mapUniverse ? `/le-monde-aime?univers=${page.mapUniverse}` : "/le-monde-aime";

  return (
    <PublicPage>
      <Hero
        size="lg"
        image={page.image}
        eyebrow="Univers AIME®"
        title={page.label}
        subtitle={page.tagline}
        actions={
          <>
            <LinkButton href={mapHref}>
              Explorer la carte <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/le-monde-aime?onglet=publier" variant="ghost">Publier</LinkButton>
          </>
        }
      />

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center gap-4">
              <Icon name={page.icon} className="h-12 w-12 text-emerald-600" />
              <h2 className="text-3xl font-bold text-[#1d1d1f]">Que trouve-t-on ici ?</h2>
            </div>
            <p className="mt-5 text-lg leading-relaxed text-slate-700">{page.description}</p>
            <ul className="mt-6 space-y-3">
              {page.find.map((f) => (
                <li key={f} className="flex items-start gap-3 text-slate-700">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-[#fafaf9] p-7">
            <h3 className="text-xl font-bold text-slate-900">Comment participer ?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{page.publishHint}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href={mapHref}>Voir sur la carte</LinkButton>
              <Link href="/inscription" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Créer mon espace
              </Link>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Les démarches pas à pas demandent un compte gratuit. La carte, elle, se visite librement.
            </p>
          </div>
        </div>
      </section>

      {situations.length > 0 && (
        <section className="bg-[#fafaf9]">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-bold text-[#1d1d1f]">Les situations liées</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Décrivez votre situation : AIME® prépare avec vous les étapes, les pièces et les interlocuteurs.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {situations.map((s) => (
                <Link key={s.key} href={`/espace/demarches/nouvelle?situation=${s.key}`} className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-lg">
                  <Icon name={s.icon} className="h-8 w-8 text-emerald-600" />
                  <p className="mt-3 text-lg font-bold text-slate-900">{s.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{s.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                    {s.pilot ? "Parcours complet" : "Être orienté"} <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicPage>
  );
}
