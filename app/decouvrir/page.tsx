import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { Card, LinkButton } from "@/components/ui";
import { Icon } from "@/components/icon";
import { loginAsDemo } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Découvrir Mon espace (visite guidée) — AIME®",
  description: "Visitez le vrai espace personnel AIME® avec un compte de démonstration en lecture seule : démarches, projets, échanges et documents réunis. Sans inscription.",
};

const POINTS = [
  { icon: "demarches", title: "Mes démarches", text: "Parcours guidés et dossiers suivis par l'équipe, réunis dans une seule liste." },
  { icon: "echanges", title: "Mes échanges & projets", text: "Demandes sur la carte, projets, cercles privés et messages de votre bureau." },
  { icon: "documents", title: "Mes documents", text: "Vos pièces au même endroit, avec leurs partages contrôlés." },
  { icon: "user", title: "Mon profil", text: "Ce que vous proposez, cherchez ou transmettez près de chez vous." },
] as const;

export default async function DecouvrirPage({ searchParams }: { searchParams: Promise<{ indisponible?: string }> }) {
  const sp = await searchParams;
  return (
    <PublicPage solidHeader>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-14">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Visite guidée</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-900">Découvrez Mon espace, le vrai — en lecture seule.</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Plus d&apos;aperçu recopié : ce bouton vous connecte à un <strong>compte de démonstration</strong> dans
            l&apos;interface réelle. Vous pouvez tout parcourir ; les actions d&apos;écriture sont désactivées,
            et les données affichées sont fictives.
          </p>
        </div>

        {sp.indisponible && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            La visite guidée n&apos;est pas disponible : la base de données n&apos;est peut-être pas configurée ou le compte de démonstration n&apos;y a pas été créé.
            Vous pouvez <a href="/inscription" className="font-bold underline">créer un compte</a> si la base est activée.
          </p>
        )}

        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-bold text-slate-900">Entrer dans la visite</p>
            <p className="mt-1 text-sm text-slate-600">Sans inscription ni mot de passe. Quittez à tout moment par « Se déconnecter ».</p>
          </div>
          <form action={loginAsDemo}>
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900">
              Commencer la visite <Icon name="arrow" className="h-4 w-4" />
            </button>
          </form>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((p) => (
            <Card key={p.title}>
              <Icon name={p.icon} className="h-7 w-7 text-emerald-700" />
              <p className="mt-2 font-bold text-slate-900">{p.title}</p>
              <p className="mt-1 text-sm text-slate-600">{p.text}</p>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <LinkButton href="/inscription" variant="ghost">Créer mon compte gratuitement</LinkButton>
          <LinkButton href="/connexion" variant="ghost">J&apos;ai déjà un compte</LinkButton>
        </div>
      </div>
    </PublicPage>
  );
}
