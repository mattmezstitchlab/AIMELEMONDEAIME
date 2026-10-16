import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicPage, PageColumn } from "@/components/public-shell";
import { Hero, LinkButton } from "@/components/ui";
import { requireRolePage } from "@/lib/auth";
import { AUTH_ENABLED } from "@/lib/auth-mode";
import { getMyCommunityData } from "@/lib/community-queries";
import { ArtistRequestActions } from "@/components/community/profile-forms";
import { STATUS_LABEL } from "@/lib/lma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon activité prestataire — AIME®", robots: { index: false, follow: false } };
export default async function ProviderWorkspace() {
  if (!AUTH_ENABLED) redirect("/mon-espace");
  const user = await requireRolePage(["membre"]);
  const data = await getMyCommunityData(user.id);
  const services = data.ownListings.filter((l) => l.action === "prestation");
  const requests = data.requests.filter((r) => r.isOwner && r.action === "prestation");
  return <PublicPage>
    <Hero eyebrow="Mon activité" title="Mes prestations et mes demandes." subtitle="Un point de départ commun pour votre profil, vos propositions de services et les demandes reçues. Les engagements artistiques conservent leur suivi dédié." actions={<><LinkButton href="/espace/profil">Compléter mon profil</LinkButton><LinkButton href="/le-monde-aime?onglet=publier" variant="secondary">Publier une prestation</LinkButton><LinkButton href="/le-monde-aime/artiste" variant="secondary">Engagements artistiques</LinkButton></>} />
    <PageColumn className="grid gap-10 py-12 lg:grid-cols-2">
      <section><h2 className="text-2xl">Mes prestations ({services.length})</h2>{!services.length && <p className="mt-4 text-ink-3">Aucune prestation. Commencez par votre profil, puis publiez une proposition de service.</p>}
        <ul className="mt-5 space-y-4">{services.map((s) => <li key={s.id} className="rounded-card p-5 ring-1 ring-line"><h3 className="font-semibold">{s.title}</h3><p className="mt-2 text-sm text-ink-3">{s.city} · {STATUS_LABEL[s.status] ?? s.status}</p><p className="mt-2 text-sm">{s.description}</p></li>)}</ul>
      </section>
      <section><h2 className="text-2xl">Demandes reçues ({requests.length})</h2>{!requests.length && <p className="mt-4 text-ink-3">Aucune demande reçue sur vos prestations.</p>}
        <ul className="mt-5 space-y-4">{requests.map((r) => <li key={r.id} className="rounded-card p-5 ring-1 ring-line"><h3 className="font-semibold">{r.title}</h3><p className="mt-2 text-sm">{r.reference} · {STATUS_LABEL[r.status] ?? r.status}</p><p className="mt-3 whitespace-pre-wrap text-sm text-ink-3">{r.message}</p><ArtistRequestActions requestId={r.id} status={r.status} /></li>)}</ul>
        <LinkButton href="/espace/echanges" variant="secondary" className="mt-6">Ouvrir mes conversations</LinkButton>
      </section>
      <p className="text-sm text-ink-3 lg:col-span-2">Une acceptation confirme un accord dans AIME®, pas un devis signé ni un paiement. Les disponibilités, tarifs et conditions sont à vérifier avec votre interlocuteur.</p>
    </PageColumn>
  </PublicPage>;
}
