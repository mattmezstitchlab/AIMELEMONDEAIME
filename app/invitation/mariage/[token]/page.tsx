import type { Metadata } from "next";
import { PublicPage } from "@/components/public-shell";
import { Icon } from "@/components/icon";
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
      <main className="min-h-[70vh] bg-subtle px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-2xl rounded-panel bg-canvas p-7 shadow-rested ring-1 ring-line sm:p-9">
          {invite ? (
            <>
              <p className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                Invitation temporaire
              </p>
              <h1 className="mt-4 text-3xl leading-tight text-ink">Un proche vous invite à aider</h1>
              <p className="mt-4 text-base leading-relaxed text-ink-2">
                <strong>{invite.label}</strong> vous propose un accès limité au projet « {invite.projectTitle} », à {invite.city}.
              </p>

              <div className="mt-6 rounded-card bg-muted p-5">
                <p className="text-sm font-medium text-ink">Votre rôle</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{roleLabel(invite.role)}</p>
                <p className="mt-3 text-xs leading-relaxed text-ink-4">
                  Le lien expire le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(invite.expiresAt)}. Il peut aussi être
                  révoqué à tout moment par une personne organisatrice.
                </p>
              </div>

              <div className="mt-4 flex gap-3 rounded-card bg-subtle p-5 text-xs leading-relaxed text-ink-3 ring-1 ring-line-soft">
                <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                <p>
                  Ce lien ne crée pas de compte et n’ouvre pas l’espace personnel complet. Il ne permet pas de consulter les documents, les
                  échanges privés, le budget ni d’autres projets. N’acceptez que si vous connaissez la personne qui vous l’a transmis ;
                  toute personne disposant du lien peut exercer ce rôle limité.
                </p>
              </div>

              <form action={acceptWeddingAccessLink} className="mt-6">
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-control bg-ink px-5 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:bg-ink-2"
                >
                  Ouvrir l’espace partagé
                  <Icon name="arrow" className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-4 text-xs leading-relaxed text-ink-4">
                Après ouverture, une session limitée et sécurisée sera conservée sur cet appareil jusqu’à expiration ou révocation.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">Lien indisponible</p>
              <h1 className="mt-4 text-3xl leading-tight text-ink">Cette invitation n’est plus valide</h1>
              <p className="mt-4 text-sm leading-relaxed text-ink-3">
                Le lien a peut-être expiré, été révoqué ou remplacé. Demandez aux personnes qui organisent le mariage de vous transmettre
                une nouvelle invitation.
              </p>
            </>
          )}
        </div>
      </main>
    </PublicPage>
  );
}
