import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { acceptWeddingAccessLink } from "@/lib/actions/wedding-access";
import { getWeddingAccessInvite } from "@/lib/wedding-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Invitation à aider pour un mariage — AIME®",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function roleLabel(role: "coordination" | "temoin") {
  return role === "coordination"
    ? "Coordination : consulter les foyers invités et mettre à jour leurs réponses RSVP et le programme."
    : "Témoin : consulter le programme et le plan de table en lecture seule.";
}

export default async function WeddingAccessInvitationPage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ expired?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const invite = query.expired ? null : await getWeddingAccessInvite(token);
  return (
    <PublicPage solidHeader>
      <main className="min-h-[70vh] bg-[#fafaf9] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8">
          {invite ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Invitation temporaire</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Un proche vous invite à aider</h1>
              <p className="mt-3 text-slate-700"><strong>{invite.label}</strong> vous propose un accès limité au projet « {invite.projectTitle} », à {invite.city}.</p>
              <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950">
                <p className="font-bold">Votre rôle</p>
                <p className="mt-1">{roleLabel(invite.role)}</p>
                <p className="mt-2 text-xs">Le lien expire le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(invite.expiresAt)}. Il peut aussi être révoqué à tout moment par une personne organisatrice.</p>
              </div>
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                <p>Ce lien ne crée pas de compte et n&apos;ouvre pas l&apos;espace personnel complet. Il ne permet pas de consulter les documents, les échanges privés, le budget ni d&apos;autres projets. N&apos;acceptez que si vous connaissez la personne qui vous l&apos;a transmis ; toute personne disposant du lien peut exercer ce rôle limité.</p>
              </div>
              <form action={acceptWeddingAccessLink} className="mt-6">
                <input type="hidden" name="token" value={token} />
                <button type="submit" className="rounded-lg bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900">Ouvrir l&apos;espace partagé</button>
              </form>
              <p className="mt-4 text-xs text-slate-500">Après ouverture, une session limitée et sécurisée sera conservée sur cet appareil jusqu&apos;à expiration ou révocation.</p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Lien indisponible</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Cette invitation n&apos;est plus valide</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">Le lien a peut-être expiré, été révoqué ou remplacé. Demandez aux personnes qui organisent le mariage de vous transmettre une nouvelle invitation.</p>
            </>
          )}
        </div>
      </main>
    </PublicPage>
  );
}
