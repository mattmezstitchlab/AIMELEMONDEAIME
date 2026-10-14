import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/lma-queries";
import { SectionTitle, Card } from "@/components/ui";
import { ProfileForm } from "@/components/community/profile-forms";

export const metadata: Metadata = { title: "Mon profil — AIME®" };

export const dynamic = "force-dynamic";

export default async function MonProfil({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const user = (await getCurrentUser())!;
  const { bienvenue } = await searchParams;
  const { user: u, hasPhoto } = (await getMyProfile(user.id))!;
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Mon profil" title={bienvenue ? "Bienvenue ! Complétez votre profil" : "Activités, compétences, disponibilités"} description="Une même personne peut être artiste, agriculteur, parent, bénévole ou retraité. Tout est facultatif." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><h2 className="font-bold text-slate-900">Confidentialité</h2><ul className="mt-2 space-y-1 text-sm text-slate-600"><li>• <strong>Public</strong> (si vous le choisissez) : nom d&apos;affichage, présentation, activités, position approximative.</li><li>• <strong>Projets</strong> : informations d&apos;organisation partagées avec les participants.</li><li>• <strong>Privé</strong> : vos démarches, réponses et documents. Personne d&apos;autre n&apos;y accède sans partage explicite.</li></ul></Card>
        <Card><h2 className="font-bold text-slate-900">Espace artiste et technicien</h2><p className="mt-2 text-sm text-slate-600">Disciplines, fiche technique, prestations, demandes d&apos;engagement reçues.</p><Link href="/le-monde-aime/artiste" className="mt-3 inline-block text-sm font-bold text-ink underline">Ouvrir l&apos;espace artiste →</Link></Card>
      </div>
      <Card>
        <ProfileForm data={{ userId: u.id, displayName: u.displayName ?? "", bio: u.bio ?? "", activities: u.activities.join(", "), interests: u.interests.join(", "), universes: u.universes, offersText: u.offersText ?? "", needsText: u.needsText ?? "", transmitText: u.transmitText ?? "", availabilityNote: u.availabilityNote ?? "", travelRadiusKm: u.travelRadiusKm, profileVisible: u.profileVisible, profileCity: u.profileCity ?? u.city ?? "", lat: u.profileLat ? Number(u.profileLat) : null, lng: u.profileLng ? Number(u.profileLng) : null, hasPhoto }} />
      </Card>
    </div>
  );
}
