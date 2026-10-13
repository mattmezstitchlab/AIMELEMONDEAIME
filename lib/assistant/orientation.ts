import { SITUATIONS } from "@/lib/situations";

/** Lexique éditorial, sans apprentissage automatique ni envoi de question à un tiers. */
export const INTENT_KEYWORDS: Record<string, string[]> = {
  evenement: ["organiser une fete", "mariage", "engager un artiste", "trouver musicien", "concert", "reception", "fete du village", "sono pour un evenement"],
  activite: ["creer mon activite", "monter mon entreprise", "micro entreprise", "devenir independant", "developper ma ferme", "statut professionnel", "devenir artisan"],
  emploi: ["chercher un emploi", "recherche de travail", "formation", "apprentissage", "reconversion", "chercher un stage", "retrouver du travail"],
  sante: ["arret de travail", "arret maladie", "je suis malade", "maladie professionnelle", "accident du travail", "accident de trajet", "avis d'arret", "prolongation d'arret", "hospitalise", "je suis en arret"],
  famille: ["naissance", "adoption", "mariage civil", "pacs", "separation", "divorce", "enfant", "changement familial"],
  logement: ["chercher un logement", "loyer", "aide au logement", "trouver une location", "bail", "logement social", "mal loge"],
  quotidien: ["besoin essentiel", "faire mes courses", "aide quotidienne", "transport de proximite", "don de vetements", "coup de main", "accompagnement quotidien"],
  proche: ["aider un proche", "aidant", "autonomie", "handicap", "soutenir parent age", "aide aux aidants"],
  retraite: ["preparer ma retraite", "pension", "carriere", "depart retraite", "releve de carriere", "regime retraite"],
  demenagement: ["demenager", "demenagement", "changer d'adresse", "changement d'adresse", "nouvelle adresse", "nouveau domicile", "quitter mon logement", "carte grise apres demenagement"],
  deces_proche: ["un proche est decede", "deces", "mort d'un proche", "perdu un proche", "succession", "obseques", "funerailles", "deuil", "declarer le deces"],
};

const STOPWORDS = new Set(["je", "tu", "me", "ma", "mes", "mon", "un", "une", "des", "les", "aux", "avec", "pour", "dans", "suis", "vais", "voudrais", "cherche", "besoin", "faire", "comment", "aide", "avoir", "qui", "quoi", "chez", "vous", "plus", "sans", "être", "etre"]);

export function normalizeOrientation(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function root(word: string): string {
  return word.length > 5 ? word.replace(/(ements|ement|euses|eurs|euse|eur|euses|ees|ers|er|ee|es|s|e)$/, "") : word;
}

export type OrientationMatch = {
  key: string;
  label: string;
  description: string;
  explanation: string;
  score: number;
};
export type OrientationResult = { kind: "single" | "ambiguous" | "unknown"; matches: OrientationMatch[] };

/** Résultat explicable : jamais de certitude feinte en cas d'ambiguïté. */
export function matchSituation(query: string): OrientationResult {
  const clean = normalizeOrientation(query).slice(0, 150);
  const tokens = [...new Set(clean.split(" ").filter((w) => w.length >= 4 && !STOPWORDS.has(w)))];
  if (!tokens.length) return { kind: "unknown", matches: [] };
  const ranked = SITUATIONS.map((situation) => {
    const phrases = INTENT_KEYWORDS[situation.key] ?? [];
    const phrase = phrases.find((p) => clean.includes(normalizeOrientation(p))) ?? null;
    const vocabulary = normalizeOrientation(`${situation.label} ${situation.short} ${phrases.join(" ")}`);
    const words = new Set(vocabulary.split(" ").filter((w) => w.length >= 4));
    let score = phrase ? 12 + phrase.split(" ").length : 0;
    for (const token of tokens) {
      const matches = [...words].some((w) => root(w) === root(token) && root(w).length >= 4);
      if (matches) score += token.length >= 6 ? 3 : 2;
    }
    return {
      key: situation.key,
      label: situation.label,
      description: situation.description,
      explanation: phrase ? `La formulation « ${phrase} » correspond à ce parcours.` : `Votre question mentionne un thème associé à ce parcours.`,
      score,
    };
  }).filter((m) => m.score >= 3).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "fr"));
  if (!ranked.length) return { kind: "unknown", matches: [] };
  if (ranked.length === 1 || ranked[0].score >= ranked[1].score + 4) return { kind: "single", matches: ranked.slice(0, 1) };
  return { kind: "ambiguous", matches: ranked.slice(0, 3) };
}
