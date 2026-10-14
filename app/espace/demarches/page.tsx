import type { Metadata } from "next";
import { requireRolePage } from "@/lib/auth";
import { getMyJourneys } from "@/lib/journey-queries";
import { getMemberCases } from "@/lib/queries";
import { SectionTitle, LinkButton, EmptyState, formatDate } from "@/components/ui";
import { DemarchesList, type DemarcheItem } from "@/components/espace/demarches-list";
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
        actions={<div data-assistant-id="demarches-new" className="inline-flex"><LinkButton href="/espace/demarches/nouvelle"><Icon name="filePlus" className="h-4 w-4" /> Nouvelle démarche</LinkButton></div>} />
      <div className="rounded-card border border-line bg-muted p-4 text-sm text-ink">
        <strong>Ce que fait AIME® dans cette version :</strong> orientation (interlocuteurs, liens officiels) et préparation (étapes, pièces, rappels, récapitulatif).
        <strong> Aucune connexion officielle n&apos;est active</strong> : rien n&apos;est transmis à un organisme réel, et les organismes restent seuls responsables de leurs décisions. Les dossiers sont suivis par une équipe d&apos;accompagnement de démonstration.
      </div>
      {items.length === 0 ? (
        <EmptyState title="Aucune démarche pour l’instant" description="Décrivez votre situation : nous préparons avec vous les prochaines étapes." action={<LinkButton href="/espace/demarches/nouvelle">Commencer</LinkButton>} />
      ) : (
        <DemarchesList
          items={items.map((item): DemarcheItem => ({
            key: item.key,
            href: item.href,
            kicker: item.kicker,
            title: item.title,
            kind: item.kind,
            status: item.status,
            detail: item.detail,
            progress: item.progress,
            updatedLabel: formatDate(item.updatedAt),
            isDemo: item.isDemo,
          }))}
        />
      )}
    </div>
  );
}
