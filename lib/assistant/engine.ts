import { SCENARIOS, scenariosForRole, type AssistantRole, type AssistantScenario } from "@/lib/assistant/registry";

/** Retire accents, ponctuation et mots trop courts. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type MatchResult =
  | { kind: "scenario"; scenario: AssistantScenario; score: number }
  | { kind: "ambiguous"; scenarios: AssistantScenario[] }
  | { kind: "none" };

const STOP_WORDS = new Set(["je", "tu", "le", "la", "les", "un", "une", "de", "des", "du", "et", "ou", "a", "au", "aux", "mon", "ma", "mes", "son", "sa", "ses", "que", "qui", "quoi", "comment", "pourquoi", "est", "suis", "avoir", "etes", "etre", "plus", "tres", "sur", "dans", "pour", "par", "avec", "sans", "ce", "cette", "ces", "il", "elle", "on", "nous", "vous", "jeu"]);

export function findScenario(input: string, role: AssistantRole): MatchResult {
  const text = normalize(input);
  if (!text) return { kind: "none" };
  const words = text.split(" ").filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  if (words.length === 0) return { kind: "none" };

  const scored = scenariosForRole(role)
    .map((scenario) => {
      const haystack = normalize([scenario.question, ...scenario.keywords].join(" "));
      let score = 0;
      for (const word of words) {
        if (haystack.includes(word)) score += word.length >= 5 ? 3 : 2;
      }
      // Bonus si la question complète correspond
      if (text === normalize(scenario.question)) score += 20;
      return { scenario, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { kind: "none" };
  if (scored.length === 1) return { kind: "scenario", scenario: scored[0].scenario, score: scored[0].score };
  const [first, second] = scored;
  if (first.score >= 6 && first.score >= second.score * 2) {
    return { kind: "scenario", scenario: first.scenario, score: first.score };
  }
  if (first.score < 6 && second.score <= 2) {
    return { kind: "scenario", scenario: first.scenario, score: first.score };
  }
  return { kind: "ambiguous", scenarios: [first.scenario, second.scenario].slice(0, 3) };
}

export const SCENARIOS_BY_ID = new Map(SCENARIOS.map((scenario) => [scenario.id, scenario]));
