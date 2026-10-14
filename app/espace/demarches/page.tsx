import Link from "next/link";
import type { Metadata } from "next";
import { requireRolePage } from "@/lib/auth";
import { getMyJourneys } from "@/lib/journey-queries";
import { getMemberCases } from "@/lib/queries";
import { Card, SectionTitle, LinkButton, EmptyState, formatDate } from "@/components/ui";
import { Icon } from "@/components/icon";
import { SITUATION_BY_KEY } from "@/lib/situations";

export const metadata: Metadata = { title: "Mes démarches — AIME®" };

export const dynamic = "force-dynamic";

/**
 * Façade unique « démarche » (chantier 2, temps 1) : le membre voit une seule
 * liste, quel que soit le moteur en coulisses — parcours guidé (journeys) ou
 * dossier instruit par l’équipe d’accompagnement (cases). Le vocabulaire et
 * le design des cartes sont unifiés ; chaque carte mène à son suivi propre.
 */
const CASE_MEMBER_LABEL: Record<string, string> = {
  brouillon: "Brouillon à compléter",
  envoyee: "Transmis à l’équipe",
  en_cours: "En cours d’instruction",
  piece_manquante: "Pièce manquante à fournir",
  terminee: "Terminée",
};

const STATUS_STYLE: Record<string, string> = {
  "Questionnaire à terminer": "bg-amber-50 text-amber-800",
  "Brouillon à compléter": "bg-slate-100 text-slate-700",
  "Pièce manquante à fournir": "bg-rose-50 text-rose-800",
  "En cours": "bg-sky-50 text-sky-800",
  "En cours d’instruction": "bg-sky-50 text-sky-800",
  "Transmis à l’équipe": "bg-sky-50 text-sky-800",
  "Terminée": "bg-muted text-ink",
};

type UnifiedItem = {
  key: string;
  href: string;
  kicker: string;
  title: string;
  kind: string;
  status: string;
  detail: string;
  progress: number | null;
  updatedAt: Date;
  isDemo: boolean;
};

export default async function DemarchesPage() {
  const user = await requireRolePage(["membre"]);
  const [js, memberCases] = await Promise.all([getMyJourneys(user.id), getMemberCases(user.id)]);

  const transmittedJourneyIds = new Set(memberCases.map((c) => c.journeyId).filter((v): v is number => !!v));
  const items: UnifiedItem[] = [
    ...js.filter((j) => !transmittedJourneyIds.has(j.id)).map((j): UnifiedItem => {
      const def = SITUATION_BY_KEY.get(j.situation);
      const status = j.status === "questionnaire" ? "Questionnaire à terminer" : j.status === "terminee" ? "Terminée" : "En cours";
      return {
        key: `parcours-${j.id}`,
        href: j.status === "questionnaire" ? `/espace/demarches/nouvelle?reprendre=${j.id}` : `/espace/demarches/suivi/${j.id}`,
        kicker: def?.short ?? "Parcours",
        title: j.title,
        kind: "Parcours guidé",
        status,
        detail: j.status === "questionnaire"
          ? "Reprenez le questionnaire où vous en étiez."
          : j.status === "terminee"
            ? "Toutes les étapes sont terminées."
            : `${j.done}/${j.total} étapes faites · prochaine : ${j.next?.label ?? "—"}`,
        progress: j.status === "en_cours" && j.total > 0 ? Math.round((j.done / j.total) * 100) : null,
        updatedAt: j.updatedAt,
        isDemo: j.isDemo,
      };
    }),
    ...memberCases.map((c): UnifiedItem => ({
      key: `dossier-${c.id}`,
      href: `/espace/demarches/${c.id}`,
      kicker: c.reference,
      title: c.title,
      kind: "Dossier suivi par l’équipe",
      status: CASE_MEMBER_LABEL[c.status] ?? c.status,
      detail: (c.journeyTitle ? `Né de votre parcours « ${c.journeyTitle} ». ` : "") + (c.status === "piece_manquante"
        ? "L’équipe attend une pièce de votre part."
        : c.status === "brouillon"
          ? "Complétez le formulaire puis transmettez-le à l’équipe."
          : c.submittedAt
            ? `Transmis le ${formatDate(c.submittedAt)}`
            : "Suivi par votre bureau d’accompagnement."),
      progress: null,
      updatedAt: c.updatedAt,
      isDemo: false,
    })),
  ].sort((a, b) => +b.updatedAt - +a.updatedAt);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Mes démarches" title="Accompagner vos moments de vie" description="Comprendre, préparer, organiser et suivre — sans recommencer votre histoire à chaque étape. Parcours guidés et dossiers suivis par l’équipe vivent ici, au même endroit."
        actions={<LinkButton href="/espace/demarches/nouvelle"><Icon name="filePlus" className="h-4 w-4" /> Nouvelle démarche</LinkButton>} />
      <div className="rounded-card border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <strong>Ce que fait AIME® dans cette version :</strong> orientation (interlocuteurs, liens officiels) et préparation (étapes, pièces, rappels, récapitulatif).
        <strong> Aucune connexion officielle n&apos;est active</strong> : rien n&apos;est transmis à un organisme réel, et les organismes restent seuls responsables de leurs décisions. Les dossiers sont suivis par une équipe d&apos;accompagnement de démonstration.
      </div>
      {items.length === 0 ? <EmptyState title="Aucune démarche pour l’instant" description="Décrivez votre situation : nous préparons avec vous les prochaines étapes." action={<LinkButton href="/espace/demarches/nouvelle">Commencer</LinkButton>} /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <Link key={item.key} href={item.href}>
              <Card className="h-full transition hover:bg-subtle">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-ink px-2.5 py-1 font-bold text-canvas">{item.kind}</span>
                  <span className={`rounded-full px-2.5 py-1 font-bold ${STATUS_STYLE[item.status] ?? "bg-slate-100 text-slate-700"}`}>{item.status}</span>
                  {item.isDemo && <span className="font-bold uppercase text-slate-500">exemple fictif</span>}
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-2">{item.kicker}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.detail}</p>
                {item.progress !== null && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-ink-2" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-400">Mis à jour le {formatDate(item.updatedAt)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
