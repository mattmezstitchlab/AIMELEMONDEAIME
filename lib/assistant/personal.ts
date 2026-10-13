import type { Suggestion } from "@/lib/assistant/registry";
import { CASE_STATUS_LABELS } from "@/lib/constants";
import { normalizeOrientation } from "@/lib/assistant/orientation";

/**
 * Assistant personnalisé, niveau 1 (voir AUDIT-DEMARCHES-ASSISTANT.md) :
 * l'assistant lit les données du membre connecté et répond avec, sans jamais
 * écrire. Toutes les fonctions d'ici sont pures — elles transforment un
 * résumé (chargé côté serveur) en réponses et en liens profonds.
 */
export type AssistantSummary = {
  journeys: { id: number; title: string; done: number; total: number; next: string | null }[];
  drafts: { id: number; title: string }[];
  cases: { id: number; reference: string; title: string; status: string }[];
  dueTasks: { label: string; dueAt: string; official: boolean; journeyId: number }[];
  incoming: number;
  engagements: number;
};

export type PersonalAnswer = { text: string; chips: Suggestion[] };

const link = (label: string, href: string): Suggestion => ({ label, kind: "link", href });
const court = (title: string) => (title.length > 34 ? `${title.slice(0, 33)}…` : title);
const statusFr = (status: string) => CASE_STATUS_LABELS[status] ?? status;
const dateFr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** « Où en sont mes démarches ? » : la vraie synthèse du membre. */
export function buildPoint(summary: AssistantSummary, focus?: string | null): PersonalAnswer {
  const lines: string[] = [];
  if (focus) lines.push(focus);
  const total = summary.journeys.length + summary.drafts.length + summary.cases.length;
  if (total === 0) {
    return {
      text: "Vous n'avez aucune démarche en cours pour le moment. Vous pouvez en commencer une par situation : quelques questions suffisent, et vous pourrez reprendre plus tard.",
      chips: [link("Nouvelle démarche", "/espace/demarches/nouvelle"), link("Mes échanges & projets", "/espace/echanges")],
    };
  }
  lines.push("Voici où vous en êtes :");
  for (const j of summary.journeys) {
    lines.push(`• Parcours « ${j.title} » : ${j.done}/${j.total} étapes faites${j.next ? ` — prochaine : ${j.next}` : ""}.`);
  }
  for (const d of summary.drafts) {
    lines.push(`• Parcours « ${d.title} » : questionnaire à terminer.`);
  }
  if (summary.cases.length) {
    const byStatus = new Map<string, number>();
    for (const c of summary.cases) byStatus.set(c.status, (byStatus.get(c.status) ?? 0) + 1);
    const parts = [...byStatus.entries()].map(([s, n]) => `${n} ${statusFr(s).toLowerCase()}`);
    lines.push(`• Dossiers suivis par votre bureau : ${parts.join(", ")}.`);
  }
  const missing = summary.cases.filter((c) => c.status === "piece_manquante");
  if (missing.length) lines.push(`Attention : ${missing.length} dossier(s) attendent une pièce de votre part.`);
  const chips: Suggestion[] = [
    ...summary.journeys.slice(0, 2).map((j) => link(`Suivi : ${court(j.title)}`, `/espace/demarches/suivi/${j.id}`)),
    ...summary.drafts.slice(0, 1).map((d) => link(`Reprendre : ${court(d.title)}`, `/espace/demarches/nouvelle?reprendre=${d.id}`)),
    link("Tout voir dans Mes démarches", "/espace/demarches"),
  ];
  return { text: lines.join("\n"), chips };
}

/** « Qu'est-ce qui m'attend ? » : échéances, pièces attendues, demandes reçues. */
export function buildAgenda(summary: AssistantSummary): PersonalAnswer {
  const lines: string[] = [];
  const chips: Suggestion[] = [];
  const missing = summary.cases.filter((c) => c.status === "piece_manquante");
  if (missing.length) {
    lines.push("À traiter de votre côté :");
    for (const c of missing) lines.push(`• ${c.reference} « ${c.title} » : une pièce est attendue par votre bureau.`);
    chips.push(...missing.slice(0, 2).map((c) => link(`Compléter ${c.reference}`, `/espace/demarches/${c.id}`)));
  }
  if (summary.dueTasks.length) {
    lines.push("Échéances proches :");
    for (const t of summary.dueTasks.slice(0, 3)) {
      lines.push(`• ${dateFr(t.dueAt)} : ${t.label} (${t.official ? "échéance officielle" : "rappel personnel"}).`);
    }
    chips.push(...summary.dueTasks.slice(0, 2).map((t) => link(`Étape : ${court(t.label)}`, `/espace/demarches/suivi/${t.journeyId}`)));
  }
  if (summary.incoming > 0) {
    lines.push(`Demandes reçues sur la carte : ${summary.incoming} à traiter.`);
    chips.push(link("Voir mes échanges & projets", "/espace/echanges"));
  }
  if (summary.engagements > 0) {
    lines.push(`Engagements d'artistes : ${summary.engagements} réponse(s) attendue(s).`);
    chips.push(link("Ouvrir l'espace artiste", "/le-monde-aime/artiste"));
  }
  if (!lines.length) {
    return {
      text: "Rien ne vous attend dans l'immédiat : aucune pièce manquante, aucune échéance proche, aucune demande en attente. Pensez simplement à vos parcours en cours.",
      chips: [link("Mes démarches", "/espace/demarches"), link("Mes échanges & projets", "/espace/echanges")],
    };
  }
  return { text: lines.join("\n"), chips: [...chips, link("Mes démarches", "/espace/demarches")] };
}

/** « Quelles pièces me manquent ? » */
export function buildPieces(summary: AssistantSummary): PersonalAnswer {
  const missing = summary.cases.filter((c) => c.status === "piece_manquante");
  if (!missing.length) {
    return {
      text: "Aucun de vos dossiers n'attend de pièce de votre part. Si votre bureau en demande une, elle apparaîtra ici et dans le dossier concerné.",
      chips: [link("Mes démarches", "/espace/demarches"), link("Mes documents", "/espace/documents")],
    };
  }
  const lines = missing.map((c) => `• ${c.reference} « ${c.title} » : ouvrez le dossier pour voir la pièce demandée et y répondre.`);
  return {
    text: `Votre bureau attend une pièce pour ${missing.length} dossier(s) :\n${lines.join("\n")}`,
    chips: [...missing.slice(0, 3).map((c) => link(`Compléter ${c.reference}`, `/espace/demarches/${c.id}`)), link("Mes documents", "/espace/documents")],
  };
}

/** Reconnaissance d'une référence de dossier citée dans la question. */
export function findCaseAnswer(summary: AssistantSummary, rawText: string): PersonalAnswer | null {
  const match = rawText.toUpperCase().match(/(?:DOS|MSA)-\d{4}-\d{3,}/);
  if (!match) return null;
  const reference = match[0];
  const found = summary.cases.find((c) => c.reference.toUpperCase() === reference);
  if (!found) {
    return {
      text: `Je ne retrouve pas la référence ${reference} parmi vos dossiers. Je ne peux voir que vos propres démarches — vérifiez la référence, ou retrouvez le dossier dans la liste.`,
      chips: [link("Mes démarches", "/espace/demarches")],
    };
  }
  return {
    text: `Je retrouve votre dossier « ${found.title} » (${found.reference}) : statut ${statusFr(found.status)}.`,
    chips: [link("Ouvrir ce dossier", `/espace/demarches/${found.id}`), link("Toutes mes démarches", "/espace/demarches")],
  };
}

export type PersonalIntent = "pieces" | "agenda" | "point";

/** Intention personnelle détectée dans la question (accents ignorés). */
export function personalIntent(rawText: string): PersonalIntent | null {
  const text = normalizeOrientation(rawText);
  if (["piece manquante", "pieces manquantes", "justificatif", "document manquant", "documents manquants", "que dois je fournir", "pieces a fournir"].some((k) => text.includes(k))) return "pieces";
  if (["qui m attend", "qu est ce qui m attend", "a traiter", "echeance", "prochainement", "a venir", "quoi de neuf", "a faire", "mes priorites"].some((k) => text.includes(k))) return "agenda";
  if (["ou en sont", "ou en est", "mes demarches", "mes dossiers", "avancement", "faire le point", "prochaine action", "prochaines actions", "point sur mes", "resume de mes"].some((k) => text.includes(k))) return "point";
  return null;
}
