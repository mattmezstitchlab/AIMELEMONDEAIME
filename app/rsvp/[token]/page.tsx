import { GUEST_INFORMATION_FIELDS } from "@/lib/wedding-portal";
import { InvitationCalendar } from "@/components/community/invitation-calendar";
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
      <main className="min-h-[70vh] bg-canvas px-5 py-12 text-ink-2 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            Réponse à une invitation
          </p>
          <h1 className="mt-4 text-3xl leading-tight text-ink sm:text-4xl">Bonjour {invite.guestName}</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-2">
            Votre foyer est invité à <strong>{invite.projectTitle}</strong>, le {displayDate(invite.weddingDate)} à {invite.city}.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-3">
            Cette page ne donne accès qu’à la réponse de votre foyer. Les autres invités, les notes d’organisation, le budget et les
            documents ne sont pas visibles ici.
          </p>

          <div className="mt-6"><InvitationCalendar title={invite.projectTitle} date={invite.weddingDate} city={invite.city} /></div>
          {invite.guestInformation && <section className="mt-8 space-y-5 rounded-card bg-subtle p-6 ring-1 ring-line">
            <h2 className="text-2xl">Les informations pour votre venue</h2>
            {GUEST_INFORMATION_FIELDS.map(([key, label]) => invite.guestInformation?.[key] ? <div key={key}><h3 className="text-sm font-semibold">{label}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-3">{invite.guestInformation[key]}</p></div> : null)}
          </section>}
          {!invite.guestInformation && <p className="mt-6 text-sm text-ink-3">Les organisateurs n’ont pas encore partagé d’informations pratiques ici. Consultez votre invitation ou contactez-les directement.</p>}
          <div className="mt-8 rounded-card bg-canvas p-6 shadow-rested ring-1 ring-line sm:p-7">
            <WeddingRsvpForm token={token} status={invite.status} persons={invite.persons} details={invite.replyDetails} />
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-ink-4">
            Lien personnel à ne pas transférer · AIME® n’envoie pas de courriel ni de relance en votre nom.
          </p>
        </div>
      </main>
    </PublicPage>
  );
}
