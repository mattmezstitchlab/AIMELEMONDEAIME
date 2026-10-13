import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicPage } from "@/components/public-shell";
import { getCurrentUser } from "@/lib/auth";
import { getArtistSpace } from "@/lib/lma-queries";
import { getArtistEngagements } from "@/lib/journey-queries";
import { ArtistEngagement } from "@/components/espace/journey-ui";
import { ArtistForm, ArtistRequestActions } from "@/components/community/profile-forms";
import { Section } from "@/components/community/project-panels";
import { STATUS_LABEL, priceLabel } from "@/lib/lma";

export const metadata: Metadata = { title: "Espace artiste — Le Monde Aime", description: "Artistes : présentez votre pratique et recevez des demandes d'engagement." };

export const dynamic = "force-dynamic";

export default async function ArtistePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "membre") redirect("/connexion");
  const space = await getArtistSpace(user.id);
  const engagements = await getArtistEngagements(user.id);
  const a = space.artist;
  return (
    <PublicPage solidHeader>
      <div className="bg-[#fafaf9]">
        <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
          <Link href="/espace" className="text-sm font-semibold text-emerald-800 underline">← Mon espace</Link>
          <header>
            <h1 className="text-3xl font-bold text-slate-900">Espace artiste et technicien</h1>
            <p className="mt-2 text-slate-600">Présentez votre démarche, vos zones et disponibilités, vos prestations et votre fiche technique. Ce même compte sert pour tout le reste.</p>
            <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Version actuelle : pas d&apos;outil de devis chiffré ni de signature de contrat, pas de calcul de droits à l&apos;intermittence ni de démarche administrative automatique. Le tarif est indicatif ou « Sur devis », convenu directement dans l&apos;échange.</p>
          </header>
          <Section title="Mon espace artiste"><ArtistForm data={{ disciplines: a?.disciplines ?? [], presentation: a?.presentation ?? "", zoneNote: a?.zoneNote ?? "", availabilityNote: a?.availabilityNote ?? "", techSheet: a?.techSheet ?? "" }} /></Section>
          <Section title="Demandes d'engagement pour des événements" hint="Répondez par une proposition (gratuite, chiffrée ou sur devis) et indiquez votre cadre d'engagement. Rien n'est confirmé avant l'acceptation de l'organisateur.">
            {engagements.length === 0 ? <p className="text-sm text-slate-600">Aucune demande d&apos;engagement pour le moment.</p> : <div className="space-y-3">{engagements.map((e) => <ArtistEngagement key={e.id} organizerName={e.organizerName} lieu={e.lieu} horaires={e.horaires} technique={e.technique} publicSize={e.public} e={{ id: e.id, status: e.status, proposalMode: e.proposalMode, proposalAmount: e.proposalAmount, proposalFramework: e.proposalFramework, proposalNote: e.proposalNote, requestMessage: e.requestMessage, eventDate: e.eventDate.toISOString() }} />)}</div>}
          </Section>
          <Section title="Mes prestations" hint="Publiées avec « Publier » → Proposition → « Je propose une prestation »."> 
            {space.services.length === 0 ? <p className="text-sm text-slate-600">Aucune prestation publiée. <Link href="/le-monde-aime?onglet=publier" className="font-bold text-emerald-800 underline">Publier une prestation</Link></p> : <ul className="space-y-2">{space.services.map((s) => <li key={s.id} className="rounded-lg bg-slate-50 p-3 text-sm"><strong>{s.title}</strong> · {priceLabel({ priceMode: s.priceMode, price: s.price, action: "prestation" }) || "—"} · {s.city} · {s.status === "publiee" ? "publiée" : s.status}{s.isDemo ? " · exemple fictif" : ""}</li>)}</ul>}
          </Section>
          <Section title="Demandes reçues" hint="Une prestation n'est réservée qu'après votre acceptation. La conversation complète est dans Mes liens → Échanges.">
            {space.requests.length === 0 ? <p className="text-sm text-slate-600">Aucune demande pour le moment.</p> : <ul className="space-y-3">{space.requests.map((r) => <li key={r.id} className="rounded-xl border border-slate-200 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{r.title}</strong><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{STATUS_LABEL[r.status] ?? r.status}</span></div><p className="text-xs text-slate-500">{r.reference} · de {r.requester}{r.projectId ? " · pour un projet" : ""}</p>{r.message && <p className="mt-1 text-slate-700">« {r.message} »</p>}<ArtistRequestActions requestId={r.id} status={r.status} /></li>)}</ul>}
          </Section>
          <Section title="Documents des projets" hint="Documents accessibles selon vos rôles dans chaque projet.">
            {space.documents.length === 0 ? <p className="text-sm text-slate-600">Aucun document de projet accessible.</p> : <ul className="space-y-2">{space.documents.map((d) => <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-sm"><span>{d.filename} <span className="text-xs text-slate-500">· {d.title}</span></span><a className="text-xs font-bold text-emerald-800 underline" href={`/api/projets/${d.projectId}/documents/${d.id}`}>Télécharger</a></li>)}</ul>}
          </Section>
        </div>
      </div>
    </PublicPage>
  );
}
