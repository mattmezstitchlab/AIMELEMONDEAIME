import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public-shell";
import { WeddingRsvpForm } from "@/components/community/wedding-rsvp-form";
import { getWeddingRsvpInvite } from "@/lib/wedding-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Répondre à l’invitation — AIME®",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function displayDate(value: string) {
  if (!value) return "date à confirmer";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

export default async function WeddingRsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getWeddingRsvpInvite(token);
  if (!invite) notFound();

  return (
    <PublicPage solidHeader>
      <main className="min-h-[70vh] bg-[#fafaf9] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Réponse à une invitation</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Bonjour {invite.guestName}</h1>
          <p className="mt-3 text-slate-700">Votre foyer est invité à <strong>{invite.projectTitle}</strong>, le {displayDate(invite.weddingDate)} à {invite.city}.</p>
          <p className="mt-2 text-sm text-slate-600">Cette page ne donne accès qu&apos;à la réponse de votre foyer. Les autres invités, les notes d&apos;organisation, le budget et les documents ne sont pas visibles ici.</p>
          <div className="mt-6">
            <WeddingRsvpForm token={token} status={invite.status} persons={invite.persons} />
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">Lien personnel à ne pas transférer · AIME® n&apos;envoie pas de courriel ni de relance en votre nom.</p>
        </div>
      </main>
    </PublicPage>
  );
}
