"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ROUTES,
  TARGETS,
  scenariosForRole,
  suggestionsForPath,
  routeForPath,
  type AssistantRole,
  type Suggestion,
} from "@/lib/assistant/registry";
import { findScenario } from "@/lib/assistant/engine";
import { matchSituation } from "@/lib/orientation";
import { Icon } from "@/components/icon";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

type Turn = {
  id: string;
  from: "assistant" | "user";
  text: string;
  chips?: Suggestion[];
  scenarioId?: string;
};

type Guide = { scenarioId: string; stepIndex: number };

const OPEN_KEY = "assistant-open";

export function AssistantWidget({ role, userName }: { role: AssistantRole; userName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [input, setInput] = useState("");
  const [highlightLabel, setHighlightLabel] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const lastPath = useRef<string>("");

  useEffect(() => {
    const openFromSearch = (event: Event) => {
      const question = (event as CustomEvent<{ question?: string }>).detail?.question;
      if (question) setInput(question.slice(0, 120));
      setOpen(true);
    };
    window.addEventListener("aime:assistant:open", openFromSearch);
    return () => window.removeEventListener("aime:assistant:open", openFromSearch);
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const route = routeForPath(pathname);
  const suggestions = useMemo(() => suggestionsForPath(pathname, role), [pathname, role]);
  const scenarios = useMemo(() => scenariosForRole(role), [role]);

  const pushTurn = useCallback((turn: Omit<Turn, "id">) => {
    setTurns((previous) => [...previous, { ...turn, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]);
  }, []);

  const clearHighlight = useCallback(() => {
    document.querySelectorAll("[data-assistant-highlight]").forEach((element) => {
      element.removeAttribute("data-assistant-highlight");
    });
    setHighlightLabel(null);
  }, []);

  const highlight = useCallback((targetId: string) => {
    const target = TARGETS.find((item) => item.id === targetId);
    if (!target) return;
    document.querySelectorAll("[data-assistant-highlight]").forEach((element) => element.removeAttribute("data-assistant-highlight"));
    const element = document.querySelector(`[data-assistant-id="${targetId}"]`);
    if (!element) {
      setHighlightLabel(`Élément « ${target.label} » absent de cette page.`);
      return;
    }
    element.setAttribute("data-assistant-highlight", "true");
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    element.scrollIntoView({ behavior: "smooth", block: isMobile ? "start" : "center" });
    setHighlightLabel(target.label);
    window.setTimeout(() => {
      if (element instanceof HTMLElement) element.focus?.({ preventScroll: true });
    }, 400);
  }, []);

  // Message d'accueil : dérivé de l'état (aucun setState dans un effet).
  // Il s'affiche tant qu'aucun échange n'a commencé, puis disparaît du fil.
  const greetingTurn: Turn | null = open && turns.length === 0
    ? {
        id: "accueil",
        from: "assistant",
        text: route
          ? `Bonjour${userName ? ` ${userName.split(" ")[0]}` : ""}. Vous êtes sur « ${route.label} ». ${route.purpose}`
          : "Bonjour. Je peux vous guider dans le site.",
        chips: suggestions,
      }
    : null;
  const displayTurns = greetingTurn ? [greetingTurn, ...turns] : turns;

  // Au changement de page, proposer l'aide contextuelle.
  // Ajout différé après le rendu de la nouvelle page (synchronisation externe).
  useEffect(() => {
    if (!open) { lastPath.current = pathname; return; }
    if (lastPath.current && lastPath.current !== pathname) {
      const current = routeForPath(pathname);
      if (current) {
        const timer = window.setTimeout(() => {
          pushTurn({ from: "assistant", text: `Nous sommes maintenant sur « ${current.label} ». ${current.purpose}`, chips: suggestionsForPath(pathname, role) });
        }, 0);
        lastPath.current = pathname;
        return () => window.clearTimeout(timer);
      }
    }
    lastPath.current = pathname;
  }, [pathname, open, pushTurn, role]);

  // Défilement automatique du fil
  useEffect(() => {
    if (open && threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [turns, open]);

  function startScenario(scenarioId: string, question?: string) {
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    if (question) pushTurn({ from: "user", text: question });
    pushTurn({ from: "assistant", text: scenario.answer, scenarioId: scenario.id });
    setGuide({ scenarioId: scenario.id, stepIndex: 0 });
    runStep(scenario.id, 0);
  }

  function runStep(scenarioId: string, stepIndex: number) {
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    const step = scenario.steps[stepIndex];
    if (!step) { setGuide(null); clearHighlight(); return; }
    if (step.navigate && routeForPath(pathname)?.path !== step.navigate) router.push(step.navigate);
    if (step.highlight) {
      window.setTimeout(() => highlight(step.highlight!), 450);
    } else {
      clearHighlight();
    }
    pushTurn({
      from: "assistant",
      text: `${step.text}${step.action ? `\n👉 ${step.action}` : ""}`,
      scenarioId,
    });
  }

  function nextStep() {
    if (!guide) return;
    const scenario = scenarios.find((item) => item.id === guide.scenarioId);
    if (!scenario) return;
    const nextIndex = guide.stepIndex + 1;
    if (nextIndex >= scenario.steps.length) {
      pushTurn({ from: "assistant", text: "Parcours terminé. Souhaitez-vous autre chose ?", chips: suggestions });
      setGuide(null);
      clearHighlight();
      return;
    }
    setGuide({ scenarioId: guide.scenarioId, stepIndex: nextIndex });
    runStep(guide.scenarioId, nextIndex);
  }

  function previousStep() {
    if (!guide || guide.stepIndex === 0) return;
    const previousIndex = guide.stepIndex - 1;
    setGuide({ scenarioId: guide.scenarioId, stepIndex: previousIndex });
    runStep(guide.scenarioId, previousIndex);
  }

  function quitGuide() {
    setGuide(null);
    clearHighlight();
    pushTurn({ from: "assistant", text: "Guide fermé. Vous pouvez continuer à naviguer normalement, tous les menus restent accessibles.", chips: suggestions });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    setInput("");
    pushTurn({ from: "user", text: value });

    // Intentions transverses
    const lowered = value.toLowerCase();
    if (lowered.includes("bonjour") || lowered.includes("salut")) {
      pushTurn({ from: "assistant", text: "Bonjour ! Dites-moi ce que vous cherchez, ou choisissez une suggestion ci-dessous.", chips: suggestions });
      return;
    }

    const orientation = matchSituation(value);
    if ((role === "membre" || role === "visiteur") && orientation.kind === "single" && orientation.matches[0].score >= 12) {
      const situation = orientation.matches[0];
      pushTurn({
        from: "assistant",
        text: `Votre formulation semble concerner « ${situation.label} ». ${situation.explanation} Je ne transmets aucune donnée à un organisme.`,
        chips: [
          { label: "Comprendre ce parcours", kind: "link", href: `/accompagnement?besoin=${encodeURIComponent(situation.key)}` },
          { label: "Le préparer dans Mon espace", kind: "link", href: `/espace/demarches/nouvelle?situation=${encodeURIComponent(situation.key)}` },
        ],
      });
      return;
    }

    const match = findScenario(value, role);
    if (match.kind === "scenario") {
      startScenario(match.scenario.id, undefined);
      return;
    }
    if (match.kind === "ambiguous") {
      pushTurn({
        from: "assistant",
        text: "Je n'ai pas bien saisi votre demande. Souhaitez-vous plutôt :",
        chips: match.scenarios.map((scenario) => ({ label: scenario.question, kind: "scenario" as const, scenarioId: scenario.id })),
      });
      return;
    }
    if ((role === "membre" || role === "visiteur") && orientation.matches.length) {
      pushTurn({
        from: "assistant",
        text: orientation.kind === "ambiguous" ? "Plusieurs situations pourraient correspondre. Choisissez celle qui vous parle :" : "Cette situation semble proche de votre question. Vérifiez qu'elle vous correspond :",
        chips: orientation.matches.map((situation) => ({ label: situation.label, kind: "link" as const, href: `/accompagnement?besoin=${encodeURIComponent(situation.key)}` })),
      });
      return;
    }
    pushTurn({
      from: "assistant",
      text: "Je n'ai pas de réponse préparée à cette question. Je ne veux pas inventer d'information réglementaire. Vous pouvez :",
      chips: role === "gestionnaire" || role === "administrateur" ? [
        { label: "Ouvrir la messagerie de l'équipe", kind: "link", href: "/back-office/messages" },
        { label: "Lire les guides", kind: "link", href: `/informations?q=${encodeURIComponent(value)}` },
      ] : [
        { label: "Rechercher dans les guides", kind: "link", href: `/informations?q=${encodeURIComponent(value)}` },
        { label: "Trouver un interlocuteur", kind: "link", href: "/accompagnement#organismes" },
      ],
    });
  }

  function handleSuggestion(suggestion: Suggestion) {
    if (suggestion.kind === "link" && suggestion.href) {
      router.push(suggestion.href);
      pushTurn({ from: "assistant", text: `J'ouvre la page « ${suggestion.label} ».` });
      return;
    }
    if (suggestion.scenarioId === "__page__") {
      pushTurn({
        from: "assistant",
        text: route
          ? `« ${route.label} » sert à : ${route.purpose}`
          : "Cette page fait partie du prototype de démonstration.",
        chips: suggestions,
      });
      return;
    }
    if (suggestion.scenarioId === "__guide__") {
      pushTurn({
        from: "assistant",
        text: "Voici les parcours que je peux vous guider pas à pas :",
        chips: scenarios.map((scenario) => ({ label: scenario.question, kind: "scenario" as const, scenarioId: scenario.id })),
      });
      return;
    }
    if (suggestion.scenarioId === "__search__") {
      const chips: Suggestion[] =
        role === "membre"
          ? [
              { label: "Ouvrir Mes démarches", kind: "link", href: "/espace/demarches" },
              { label: "Nouvelle démarche", kind: "link", href: "/espace/demarches/nouvelle" },
            ]
          : role === "visiteur"
            ? [
                { label: "Parcourir les guides pratiques", kind: "link", href: "/informations?vue=guides" },
                { label: "Voir la carte de France", kind: "link", href: "/le-monde-aime" },
                { label: "Créer mon espace", kind: "link", href: "/inscription" },
              ]
            : [{ label: "Ouvrir les dossiers", kind: "link", href: "/back-office/dossiers" }];
      pushTurn({
        from: "assistant",
        text: "Voici les pages utiles pour trouver une démarche :",
        chips,
      });
      return;
    }
    if (suggestion.scenarioId) startScenario(suggestion.scenarioId, suggestion.label);
  }

  // Échap ferme le panneau
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const totalSteps = guide ? scenarios.find((item) => item.id === guide.scenarioId)?.steps.length ?? 0 : 0;
  const lastSuggestions = displayTurns.length > 0 ? displayTurns[displayTurns.length - 1].chips : undefined;

  return (
    <>
      {/* Bulle de conversation, en bas à droite */}
      <div className="fixed bottom-20 right-4 z-50 flex items-center gap-3 md:bottom-5 md:right-5">
        {!open && (
          <span className="hidden rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-md sm:block">
            Besoin d&apos;aide ?
          </span>
        )}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => { if (open) { setOpen(false); triggerRef.current?.focus(); } else setOpen(true); }}
          aria-expanded={open}
          aria-controls="assistant-panel"
          className="grid h-14 w-14 place-items-center rounded-full bg-emerald-800 text-white shadow-lg transition hover:bg-emerald-900"
          aria-label={open ? "Fermer l'assistant de navigation" : "Ouvrir l'assistant de navigation"}
        >
          {open ? <Icon name="alert" className="h-6 w-6" /> : <Msasprout className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div
          ref={panelRef}
          id="assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Assistant de navigation"
          className="fixed inset-x-3 bottom-36 z-50 flex max-h-[70vh] md:bottom-24 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-2xl sm:inset-x-auto sm:bottom-36 sm:right-5 md:bottom-24 sm:w-[400px]"
        >
          <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-800 text-white">
              <Msasprout className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">Assistant de navigation</p>
              <p className="truncate text-xs text-slate-500">
                Aide contextuelle, sans IA générative · {role === "visiteur" ? "visiteur" : role}
              </p>
            </div>
            <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Fermer l'assistant">
              <Icon name="alert" className="h-4 w-4 rotate-45" />
            </button>
          </header>

          {guide && (
            <div className="flex items-center gap-2 border-b border-slate-100 bg-emerald-50 px-4 py-2.5">
              <span className="text-xs font-semibold text-emerald-800">
                Étape {guide.stepIndex + 1} sur {totalSteps}
              </span>
              <div className="mx-1 h-1.5 flex-1 overflow-hidden rounded-full bg-emerald-100" aria-hidden="true">
                <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${((guide.stepIndex + 1) / Math.max(1, totalSteps)) * 100}%` }} />
              </div>
              <button type="button" onClick={previousStep} disabled={guide.stepIndex === 0} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-800 disabled:opacity-40">
                Précédent
              </button>
              <button type="button" onClick={nextStep} className="rounded-md bg-emerald-800 px-2.5 py-1 text-xs font-semibold text-white">
                {guide.stepIndex + 1 === totalSteps ? "Terminer" : "Suivant"}
              </button>
              <button type="button" onClick={quitGuide} className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-800">
                Quitter le guide
              </button>
            </div>
          )}

          {highlightLabel && (
            <p className="border-b border-slate-100 bg-[#fafaf9] px-4 py-2 text-xs text-slate-600">
              Élément mis en évidence : <strong className="text-slate-900">{highlightLabel}</strong>
            </p>
          )}

          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto bg-[#fafaf9] px-4 py-4" aria-live="polite">
            {displayTurns.map((turn) => (
              <div key={turn.id} className={`flex ${turn.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${turn.from === "user" ? "bg-emerald-800 text-white" : "bg-white text-slate-800 shadow-sm"}`}>
                  {turn.text}
                </div>
              </div>
            ))}
            {lastSuggestions && !guide && (
              <div role="group" aria-label="Choix proposés par l'assistant" className="flex flex-wrap gap-2">
                {lastSuggestions.map((suggestion) => (
                  <button key={`${suggestion.label}-${suggestion.href ?? suggestion.scenarioId ?? ""}`} type="button" onClick={() => handleSuggestion(suggestion)} className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-800 shadow-sm hover:border-slate-600">
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}
            {turns.length === 0 && !greetingTurn && <p className="text-sm text-slate-500">Posez votre question ou choisissez une suggestion.</p>}
          </div>

          <div className="border-t border-slate-100 bg-white px-3 py-3">
            {!lastSuggestions && !guide && <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleSuggestion(suggestion)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <label htmlFor="assistant-input" className="sr-only">Votre question</label>
              <input
                ref={inputRef}
                id="assistant-input"
                value={input}
                maxLength={120}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ex. je déménage, je cherche mon attestation"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
              />
              <PrimaryButton type="submit" className="!px-3 !py-2 text-xs">Envoyer</PrimaryButton>
            </form>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              Aide à la navigation uniquement. Aucune réponse réglementaire n&apos;est inventée et aucune action n&apos;est effectuée sans
              votre validation dans les formulaires habituels.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/** Logo blanc stylisé (épi) utilisé dans la bulle de conversation. */
function Msasprout({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 21c0-5 0-8 4-11-.5 4-1.5 6-4 7m0 4c0-5 0-8-4-11 .5 4 1.5 6 4 7" />
      <circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export { ROUTES };
