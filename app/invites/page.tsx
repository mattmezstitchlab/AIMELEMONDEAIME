import type { Metadata } from "next";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { Hero, LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: "Invités et proches — AIME®", description: "Retrouver comment répondre à une invitation ou rejoindre un accès partagé au mariage." };

export default function InvitesPage() {
  return <PublicPage>
    <Hero image="/images/hero-famille.jpg" eyebrow="Invités et proches" title="Il est des jours que l’on fait ensemble." subtitle="Pour répondre à une invitation ou aider à l’organisation, utilisez le lien personnel transmis par les personnes qui organisent le mariage. Aucun compte n’est nécessaire pour ces accès par lien." />
    <PageColumn className="grid gap-8 py-12 md:grid-cols-2 lg:gap-16 lg:py-20">
      <section className="rounded-card bg-subtle p-6 sm:p-10">
        <p className="eyebrow">Je suis invité</p><h2 className="mt-4 text-3xl">Répondre à mon invitation.</h2>
        <ol className="mt-6 list-decimal space-y-4 pl-5 leading-relaxed text-ink-3"><li>Retrouvez le message contenant votre lien personnel AIME®.</li><li>Ouvrez ce lien pour consulter l’invitation et renseigner la réponse de votre foyer.</li><li>Validez dans le formulaire. Vous n’avez pas accès aux réponses des autres invités ni au budget.</li></ol>
        <p className="mt-6 font-semibold">Vous n’avez pas le lien ?</p><p className="mt-2 leading-relaxed text-ink-3">Demandez-le directement aux personnes qui organisent. Pour préserver leur vie privée, aucun mariage n’est recherché publiquement par nom.</p>
      </section>
      <section className="rounded-card bg-subtle p-6 sm:p-10">
        <p className="eyebrow">Je donne un coup de main</p><h2 className="mt-4 text-3xl">Rejoindre l’organisation.</h2>
        <p className="mt-6 leading-relaxed text-ink-3">Ouvrez le lien de coordination ou de témoin reçu des organisateurs. Il indique votre rôle, sa durée et les éléments que vous pouvez consulter ou modifier. Il n’ouvre pas leur espace personnel complet.</p>
        <p className="mt-5 leading-relaxed text-ink-3">Un lien expiré ou révoqué ne donne plus accès au projet. Demandez un nouveau lien aux organisateurs ; ne transférez pas votre invitation à une autre personne.</p>
        <LinkButton href="/accompagnement?besoin=mariage" variant="secondary" className="mt-8">Comprendre le parcours mariage</LinkButton>
      </section>
      <p className="text-sm leading-relaxed text-ink-3 md:col-span-2">Ces accès nécessitent une invitation valide et un projet configuré. AIME® n’envoie pas automatiquement les invitations : les organisateurs transmettent eux-mêmes les liens.</p>
    </PageColumn>
  </PublicPage>;
}
