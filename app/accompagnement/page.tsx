import Link from "next/link";
import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { Container, EmptyState, Hero, LinkButton, SectionHeading, Tag, formatDate } from "@/components/ui";
import { Icon } from "@/components/icon";
import { CircuitLinks } from "@/components/marketing/tiles";
import { WEDDING_CIRCUITS, circuitFor } from "@/lib/circuits";
import { MockWindow, TimelineMock } from "@/components/marketing/mocks";
import { getOrganisms } from "@/lib/journey-queries";
import { ORGANISM_CATEGORY_LABEL, SITUATIONS, SITUATION_BY_KEY, RULES_REVIEWED_AT } from "@/lib/situations";
import { OrientationEntry } from "@/components/orientation-entry";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Accompagnement des démarches — AIME®", description: "Vous expliquez votre situation. AIME® vous aide à trouver les personnes, les ressources et les démarches pour avancer." };

const MARRIAGE_STEPS = [
  { number: "01", icon: "building" as const, title: "Dossier civil en mairie", text: "Date, commune, pièces des futurs époux et témoins, éventuel contrat et publication des bans. La mairie confirme les modalités et les délais." },
  { number: "02", icon: "heart" as const, title: "Célébration et fête, au choix", text: "La cérémonie civile seule suffit. Si vous le souhaitez, ajoutez une cérémonie laïque ou religieuse, une réception, un repas, des photos ou de la musique." },
  { number: "03", icon: "users" as const, title: "Invités et jour J", text: "Pour une fête, rassemblez RSVP, budget, programme, plan de table et contributions des proches dans le projet partagé." },
  { number: "04", icon: "refresh" as const, title: "Après l’union", text: "Retrouvez le livret de famille, les remerciements et les démarches à vérifier selon votre situation." },
];

/** Trois niveaux de service, énoncés sans ambiguïté. */
const CAPABILITIES = [
  { title: "Orientation", text: "Expliquer, identifier les interlocuteurs, ouvrir les services officiels.", state: "Disponible" as const },
  { title: "Préparation", text: "Étapes, pièces, rappels personnels, récapitulatif exportable.", state: "Disponible" as const },
  { title: "Connexion officielle", text: "Récupérer ou transmettre des données à un organisme, avec intégration et autorisation.", state: "Non disponible" as const },
];

export default async function Accompagnement({ searchParams }: { searchParams: Promise<{ besoin?: string }> }) {
  const { besoin } = await searchParams;
  const selected = besoin ? SITUATION_BY_KEY.get(besoin) : undefined;
  const user = await getCurrentUser();
  const selectedPath = selected ? `/espace/demarches/nouvelle?situation=${encodeURIComponent(selected.key)}` : "/espace/demarches/nouvelle";
  const selectedHref = user ? selectedPath : `/connexion?next=${encodeURIComponent(selectedPath)}`;
  const isWedding = selected?.key === "mariage";
  const orgs = isWedding ? [] : await getOrganisms();
  const cats = Object.keys(ORGANISM_CATEGORY_LABEL);

  return (
    <PublicPage>
      <Hero
        size={isWedding ? "lg" : "md"}
        eyebrow={isWedding ? "AIME® · Mariage" : selected ? `AIME® · ${selected.short}` : "AIME® · Accompagnement"}
        title={isWedding ? "Préparer votre mariage et tout ce qui l’entoure." : selected?.label ?? "Vous expliquez votre situation."}
        subtitle={selected?.description ?? "AIME® vous aide à trouver les personnes, les ressources et les démarches pour avancer — dans un seul espace, sans recommencer votre histoire à chaque étape."}
        actions={
          <>
            <LinkButton href={selectedHref} size="lg">
              {selected ? "Continuer le parcours" : "Choisir une situation"}
              <Icon name="arrow" className="h-4 w-4" />
            </LinkButton>
            <LinkButton href={isWedding ? "/informations/mariage" : "#organismes"} variant="secondary" size="lg">
              {isWedding ? "Guides et repères" : "Les organismes de référence"}
            </LinkButton>
          </>
        }
        media={
          isWedding ? (
            <MockWindow title="Rétroplanning" meta="Repères indicatifs">
              <div className="px-4 py-4">
                <TimelineMock />
              </div>
              <div className="flex items-center gap-2 border-t border-line px-4 py-3 text-[11px] text-ink-4">
                <Icon name="alert" className="h-3.5 w-3.5" />
                Les délais réels sont fixés par votre mairie.
              </div>
            </MockWindow>
          ) : undefined
        }
      />

      {isWedding ? (
        <section id="etapes-mariage" className="scroll-mt-20 border-b border-line bg-subtle">
          <Container wide className="py-16 lg:py-20">
            <SectionHeading
              eyebrow="Parcours mariage complet · dans l’ordre"
              title="Du dossier civil à l’après-union."
              description="Commencez par la mairie. La fête, les prestataires et les services autour ne sont jamais des conditions pour avancer : choisissez uniquement ce qui correspond à votre mariage."
            />
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {MARRIAGE_STEPS.map((step) => (
                <li key={step.number} className="flex flex-col rounded-card bg-canvas p-6 shadow-rested ring-1 ring-line">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs tracking-[0.14em] text-ink-4">ÉTAPE {step.number}</span>
                    <Icon name={step.icon} className="h-5 w-5 text-ink-3" />
                  </div>
                  <h3 className="mt-5 text-lg leading-snug text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-3">{step.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <LinkButton href={selectedHref} size="lg">
                Commencer le parcours mariage
                <Icon name="arrow" className="h-4 w-4" />
              </LinkButton>
              <Link href="/informations/mariage" className="text-sm font-medium text-ink underline underline-offset-4">
                Consulter les guides mariage
              </Link>
            </div>
            <div className="mt-10">
              <CircuitLinks
                title="Ce dont un mariage a besoin, près de chez vous."
                text="Le parcours s'occupe du dossier et du jour J ; les circuits s'occupent du reste — avec la même règle partout : votre commune suffit, aucune adresse n'est publiée, rien ne se conclut sans l'accord des personnes."
                items={WEDDING_CIRCUITS.map((item) => ({
                  href: `/circuits/${item.key}`,
                  label: circuitFor(item.key)?.label ?? item.key,
                  why: item.why,
                }))}
              />
            </div>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-3">
              Le projet partagé aide à organiser la fête si vous en prévoyez une. Les artistes ne sont proposés que si vous choisissez un
              groupe ou un DJ ; ils ne font pas partie des démarches civiles obligatoires.
            </p>
          </Container>
        </section>
      ) : selected ? (
        <section className="border-b border-line bg-subtle">
          <Container wide className="py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
              <div>
                <p className="eyebrow">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                  Parcours suggéré · orientation, pas une décision
                </p>
                <h2 className="mt-4 text-3xl text-ink sm:text-4xl">{selected.label}</h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-3">{selected.description}</p>
                <LinkButton href={selectedHref} className="mt-8">
                  Préparer ce parcours dans Mon espace
                  <Icon name="arrow" className="h-4 w-4" />
                </LinkButton>
                <p className="mt-3 text-xs text-ink-4">La connexion sert uniquement à enregistrer et reprendre vos réponses privées.</p>
              </div>
              <div className="panel p-6">
                <p className="text-sm font-medium text-ink">Quelques questions, une par étape :</p>
                <ol className="mt-4 space-y-3">
                  {selected.questions.slice(0, 3).map((q, index) => (
                    <li key={q.key} className="flex gap-3 text-sm text-ink-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted font-display text-[11px] text-ink-3">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{q.label.replace(" (facultatif)", "")}</span>
                    </li>
                  ))}
                </ol>
                {(selected.key === "demenagement" || selected.key === "deces_proche") && (
                  <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-ink-3">
                    Guide officiel :{" "}
                    <a
                      href={selected.key === "demenagement" ? "https://www.service-public.gouv.fr/particuliers/vosdroits/F14128" : "https://www.service-public.gouv.fr/particuliers/vosdroits/F16507"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-ink underline underline-offset-4"
                    >
                      Service-Public.gouv.fr
                      <Icon name="external" className="h-3.5 w-3.5" />
                    </a>
                    <span className="mt-1 block text-xs text-ink-4">AIME® ne réalise aucune déclaration à votre place.</span>
                  </p>
                )}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      {!isWedding && (
        <section className="bg-canvas">
          <Container wide className="py-16 lg:py-20">
            <SectionHeading
              eyebrow="Orientation"
              title="De quoi avez-vous besoin aujourd’hui ?"
              description="Décrivez votre situation en quelques mots : l’assistant de navigation vous propose le parcours adapté, sans diagnostic ni décision administrative."
            />
            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
              <OrientationEntry />
              <div>
                <p className="text-sm font-medium text-ink">Ou parcourez les situations :</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {SITUATIONS.map((s) => {
                    const path = `/espace/demarches/nouvelle?situation=${s.key}`;
                    const href = user ? path : `/connexion?next=${encodeURIComponent(path)}`;
                    return (
                      <Link
                        key={s.key}
                        href={href}
                        className="group rounded-card bg-muted p-5 transition hover:bg-canvas hover:shadow-hover hover:ring-1 hover:ring-line"
                      >
                        <Icon name={s.icon} className="h-6 w-6 text-ink-2" />
                        <p className="mt-3 text-base font-medium text-ink">{s.label}</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink-3">{s.description}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {CAPABILITIES.map((capability) => (
                <div key={capability.title} className="rounded-card bg-subtle p-6 ring-1 ring-line-soft">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-medium text-ink">{capability.title}</p>
                    <Tag tone={capability.state === "Disponible" ? "outline" : "neutral"}>{capability.state}</Tag>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-3">{capability.text}</p>
                  {capability.state === "Non disponible" && (
                    <p className="mt-2 text-xs text-ink-4">Aucune intégration active à ce jour.</p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-4">
              AIME® ne demande jamais les mots de passe de vos comptes administratifs et ne contourne aucun accès officiel. Il ne promet ni
              aide, ni validation, ni ouverture de droits : les organismes compétents restent responsables de leurs décisions.
            </p>
          </Container>
        </section>
      )}

      {!isWedding && (
        <section id="organismes" className="scroll-mt-20 border-t border-line bg-subtle">
          <Container wide className="py-16 lg:py-20">
            <SectionHeading
              eyebrow="Organismes de référence"
              title="Organismes et services de référence"
              description={`Organismes externes référencés pour vous orienter. Ce ne sont pas des partenaires d’AIME®. Pour chaque fiche : rôle, public, territoire, lien officiel et état de vérification. Règles d’orientation revues le ${new Date(RULES_REVIEWED_AT).toLocaleDateString("fr-FR")}.`}
            />

            {orgs.length === 0 && (
              <div className="mt-10">
                <EmptyState
                  icon="building"
                  title="Fiches indisponibles pour le moment"
                  description="L’annuaire des organismes de référence s’affichera dès que la base de données du site sera configurée. En attendant, consultez directement les sites officiels."
                />
              </div>
            )}

            {cats.map((c) => {
              const list = orgs.filter((o) => o.category === c);
              if (!list.length) return null;
              return (
                <div key={c} className="mt-10">
                  <h3 className="text-xl text-ink">{ORGANISM_CATEGORY_LABEL[c]}</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((o) => {
                      const verified = o.contentStatus === "verifie";
                      const linkChecked = !verified && o.linkStatus === "verifie";
                      const stateLabel = verified
                        ? `Vérifié le ${formatDate(o.verifiedAt!)}${o.source ? " · source citée" : ""}`
                        : linkChecked
                          ? `Lien officiel accessible le ${formatDate(o.verifiedAt!)} · description à vérifier`
                          : "À vérifier : lien non joignable lors du dernier contrôle";
                      return (
                        <article key={o.id} className="flex flex-col rounded-card bg-canvas p-5 shadow-rested ring-1 ring-line">
                          <a
                            href={o.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-base font-medium text-ink underline underline-offset-4"
                          >
                            {o.name}
                            <Icon name="external" className="h-3.5 w-3.5" />
                          </a>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-3">{o.role}</p>
                          <p className="mt-3 text-xs text-ink-4">
                            Public : {o.audience} · Territoire : {o.territory}
                          </p>
                          <p className={`mt-3 flex items-start gap-1.5 text-[11px] ${verified ? "text-ink" : "text-ink-3"}`}>
                            <Icon name={verified ? "check" : "alert"} className="mt-px h-3.5 w-3.5 shrink-0" />
                            {stateLabel}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <p className="mt-10 text-sm text-ink-3">
              Les points d’accueil listés sont des lieux de démonstration fictifs.{" "}
              <Link href="/annuaire" className="font-medium text-ink underline underline-offset-4">
                Voir les points d’accueil
              </Link>
            </p>
          </Container>
        </section>
      )}
    </PublicPage>
  );
}
