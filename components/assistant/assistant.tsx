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
import { conversationCommand, requestText, navigationChoices, suggestedChoice, GUIDE_FINISHED } from "@/lib/assistant/conversation";
import { findScenario } from "@/lib/assistant/engine";
import { matchSituation, normalizeOrientation } from "@/lib/assistant/orientation";
import { SITUATION_BY_KEY, type Question } from "@/lib/situations";
import {
  buildAgenda, buildAnnee, buildPieces, buildPoint, findCaseAnswer, personalIntent, writeIntent,
  type AssistantAction, type AssistantSummary, type PersonalAnswer, type YearEventLite,
} from "@/lib/assistant/personal";
import { assistantCreateDraft, assistantFinalize, assistantSaveAnswer, assistantSetReminder, assistantTransmit } from "@/lib/actions/assistant";
import { Icon } from "@/components/icon";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

type Turn = {
  id: string;
  from: "assistant" | "user";
  text: string;
  chips?: Suggestion[];
  scenarioId?: string;
  /** Assistant niveau 2 : écriture proposée, exécutée seulement après confirmation. */
  action?: AssistantAction;
};

type ActionState = { status: "busy" | "done" | "cancelled" | "error"; message?: string };

type Guide = { scenarioId: string; stepIndex: number };

/** Questionnaire conversationnel : état de l’entretien en cours. */
type Interview = {
  journeyId: number;
  situation: string;
  title: string;
  index: number;
  answers: Record<string, string>;
};

type PendingInterview = { journeyId: number; situation: string; title: string; answers: Record<string, string> };

export function AssistantWidget({ role, userName, summary, canAct = false, yearEvents = null, accountsEnabled = false }: { accountsEnabled?: boolean; role: AssistantRole; userName: string | null; summary?: AssistantSummary | null; canAct?: boolean; yearEvents?: YearEventLite[] | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [input, setInput] = useState("");
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null);
  const [highlightLabel, setHighlightLabel] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, ActionState>>({});
  const [interview, setInterview] = useState<Interview | null>(null);
  const [pendingInterview, setPendingInterview] = useState<PendingInterview | null>(null);
  const interviewBusy = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const lastPath = useRef<string>("");

  useEffect(() => {
    const openFromSearch = (event: Event) => {
      const question = (event as CustomEvent<{ question?: string }>).detail?.question;
      if (question) setInput(question.slice(0, 600));
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
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setTurns((previous) => [...previous, { ...turn, id }]);
    return id;
  }, []);

  // Élément actuellement ouvert, pour des réponses situées (assistant niveau 1).
  const focusLine = useMemo(() => {
    if (!summary) return null;
    const suivi = pathname.match(/^\/espace\/demarches\/suivi\/(\d+)/);
    if (suivi) {
      const actif = summary.journeys.find((item) => item.id === Number(suivi[1]));
      if (actif) return `Le parcours ouvert (« ${actif.title} ») : ${actif.done}/${actif.total} étapes faites${actif.next ? `, prochaine : ${actif.next}` : ""}.`;
      const brouillon = summary.drafts.find((item) => item.id === Number(suivi[1]));
      if (brouillon) return `Le parcours ouvert (« ${brouillon.title} ») : questionnaire à terminer.`;
      return null;
    }
    const dossier = pathname.match(/^\/espace\/demarches\/(\d+)$/);
    if (dossier) {
      const c = summary.cases.find((item) => item.id === Number(dossier[1]));
      return c ? `Le dossier ouvert (${c.reference} « ${c.title} ») fait partie de vos démarches.` : null;
    }
    return null;
  }, [pathname, summary]);

  // Parcours ouvert sur la page de suivi, pour les propositions situées.
  const focusJourney = useMemo(() => {
    if (!summary) return null;
    const suivi = pathname.match(/^\/espace\/demarches\/suivi\/(\d+)/);
    if (!suivi) return null;
    return summary.journeys.find((item) => item.id === Number(suivi[1])) ?? null;
  }, [pathname, summary]);

  const answerPersonal = useCallback((answer: PersonalAnswer) => {
    pushTurn({ from: "assistant", text: answer.text, chips: answer.chips });
  }, [pushTurn]);
  

  // Après « Faire le point » sur un suivi : proposer un rappel sur la
  // prochaine étape (jamais sur une échéance officielle, que le serveur
  // refuserait de toute façon).
  const proposeReminderIfUseful = useCallback(() => {
    if (!canAct || !focusJourney?.nextTask || focusJourney.nextTask.dueKind === "officielle") return;
    pushTurn({
      from: "assistant",
      text: `Je peux aussi poser un rappel personnel sur la prochaine étape de ce parcours : « ${focusJourney.nextTask.label} ».`,
      action: { kind: "rappel", taskId: focusJourney.nextTask.id, journeyId: focusJourney.id, taskLabel: focusJourney.nextTask.label },
    });
  }, [canAct, focusJourney, pushTurn]);

  async function executeAction(turn: Turn, dateChoice?: string) {
    const action = turn.action;
    if (!action || actionState[turn.id]?.status === "busy") return;
    setActionState((previous) => ({ ...previous, [turn.id]: { status: "busy" } }));
    try {
      const result =
        action.kind === "creer_brouillon"
          ? await assistantCreateDraft(action.situation)
          : action.kind === "rappel"
            ? await assistantSetReminder(action.taskId, dateChoice ?? "")
            : action.kind === "finaliser"
              ? await assistantFinalize(action.journeyId)
              : await assistantTransmit(action.journeyId);
      if (!result.ok) {
        setActionState((previous) => ({ ...previous, [turn.id]: { status: "error", message: result.error } }));
        return;
      }
      setActionState((previous) => ({ ...previous, [turn.id]: { status: "done" } }));
      if (action.kind === "creer_brouillon" && result.id) {
        setPendingInterview({
          journeyId: result.id,
          situation: action.situation,
          title: action.situationLabel,
          answers: summary?.drafts.find((d) => d.id === result.id)?.answers ?? {},
        });
      }
      const chips: Suggestion[] =
        action.kind === "creer_brouillon" && result.id
          ? [
              { label: "Répondre avec l’assistant, question par question", kind: "scenario", scenarioId: "__entretien__" },
              { label: "Ouvrir le formulaire", kind: "link", href: `/espace/demarches/nouvelle?reprendre=${result.id}` },
              { label: "Voir Mes démarches", kind: "link", href: "/espace/demarches" },
            ]
          : action.kind === "finaliser" && result.id
            ? [
                { label: "Ouvrir mon plan", kind: "link", href: `/espace/demarches/suivi/${result.id}` },
                { label: "Mes démarches", kind: "link", href: "/espace/demarches" },
              ]
          : action.kind === "transmettre" && result.id
            ? [
                { label: "Ouvrir le dossier créé", kind: "link", href: `/espace/demarches/${result.id}` },
                { label: "Voir Mes démarches", kind: "link", href: "/espace/demarches" },
              ]
            : [{ label: "Ouvrir le suivi du parcours", kind: "link", href: `/espace/demarches/suivi/${action.kind === "rappel" ? action.journeyId : ""}` }];
      pushTurn({ from: "assistant", text: result.message, chips });
      router.refresh();
    } catch {
      setActionState((previous) => ({ ...previous, [turn.id]: { status: "error", message: "L’action n’a pas abouti. Vous pouvez la refaire depuis les formulaires habituels." } }));
    }
  }

  function cancelAction(turn: Turn) {
    setActionState((previous) => ({ ...previous, [turn.id]: { status: "cancelled" } }));
  }

  const clearHighlight = useCallback(() => {
    document.querySelectorAll("[data-assistant-highlight]").forEach((element) => {
      element.removeAttribute("data-assistant-highlight");
    });
    setHighlightLabel(null);
    setHighlightTarget(null);
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

  useEffect(() => {
    if (!highlightTarget) return;
    const apply = () => {
      if (!document.querySelector(`[data-assistant-id="${highlightTarget}"]`)) return false;
      highlight(highlightTarget);
      return true;
    };
    if (apply()) return;
    const observer = new MutationObserver(() => { if (apply()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      if (!apply()) setHighlightLabel("Je ne retrouve pas ce bouton. Utilisez le menu de la page, ou dites-moi où vous êtes bloqué.");
    }, 8000);
    return () => { observer.disconnect(); window.clearTimeout(timeout); };
  }, [highlightTarget, pathname, highlight, guide?.stepIndex]);

  // Message d’accueil : dérivé de l’état (aucun setState dans un effet).
  // Il s’affiche tant qu’aucun échange n’a commencé, puis disparaît du fil.
  const greetingTurn: Turn | null = open && turns.length === 0
    ? {
        id: "accueil",
        from: "assistant",
        text: route
          ? `Bonjour${userName ? ` ${userName.split(" ")[0]}` : ""}. Vous êtes sur « ${route.label} ». ${route.purpose}`
          : "Bonjour. Dites-moi ce que vous voulez faire. Je vous aide à trouver la prochaine étape.",
        chips: suggestions,
      }
    : null;
  const displayTurns = greetingTurn ? [greetingTurn, ...turns] : turns;

  // Au changement de page, proposer l’aide contextuelle.
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
    clearHighlight();
    setGuide({ scenarioId: scenario.id, stepIndex: 0 });
    runStep(scenario.id, 0);
  }

  function runStep(scenarioId: string, stepIndex: number) {
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    const step = scenario.steps[stepIndex];
    if (!step) { setGuide(null); clearHighlight(); return; }
    const destination = step.navigate ? routeForPath(step.navigate) : null;
    if (destination && !destination.roles.includes(role)) {
      pushTurn({ from: "assistant", text: accountsEnabled
        ? "La suite se passe dans votre espace personnel. Connectez-vous pour continuer ; aucune action n’a été effectuée."
        : "La suite demande un compte. Les comptes sont fermés pour le moment ; vous pouvez continuer à consulter les informations publiques. Aucune action n’a été effectuée.",
        chips: [{ label: accountsEnabled ? "Se connecter" : "Comprendre l’accès à Mon espace", kind: "link", href: accountsEnabled ? "/connexion" : "/mon-espace" }] });
      setGuide(null);
      clearHighlight();
      return;
    }
    if (step.navigate && routeForPath(pathname)?.path !== step.navigate) router.push(step.navigate);
    if (step.highlight) {
      document.querySelectorAll("[data-assistant-highlight]").forEach((element) => element.removeAttribute("data-assistant-highlight"));
      setHighlightTarget(step.highlight);
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
      pushTurn({ from: "assistant", text: GUIDE_FINISHED, chips: suggestions });
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

  // ------------------------------------------------------------------
  // Questionnaire conversationnel : une question à la fois, chaque réponse
  // enregistrée dans le brouillon, relecture complète avant de préparer
  // le plan (action « finaliser », confirmée comme les autres).
  // ------------------------------------------------------------------

  function questionChips(q: Question): Suggestion[] {
    const chips: Suggestion[] = [];
    if (q.type === "select") {
      chips.push(...(q.options ?? []).map(([value, label]) => ({ label, kind: "reponse" as const, answerValue: value })));
    }
    if (!q.required) chips.push({ label: "Passer cette question", kind: "reponse", answerValue: "__passer__" });
    chips.push({ label: "Arrêter là pour l’instant", kind: "scenario", scenarioId: "__stop_entretien__" });
    return chips;
  }

  function askQuestion(iv: Interview) {
    const def = SITUATION_BY_KEY.get(iv.situation);
    if (!def) return;
    const q = def.questions[iv.index];
    const lignes = [`Question ${iv.index + 1} sur ${def.questions.length} — ${q.label}`];
    if (q.why) lignes.push(`Pourquoi cette question : ${q.why}`);
    if (q.help) lignes.push(q.help);
    if (q.type === "date") lignes.push("Écrivez la date au format JJ/MM/AAAA (par exemple 12/10/2026), ou touchez une réponse si je vous en propose.");
    if (q.type === "number") lignes.push("Écrivez simplement un nombre.");
    if (q.type === "time") lignes.push("Écrivez l’heure au format HH:MM (par exemple 18:30).");
    pushTurn({ from: "assistant", text: lignes.join("\n"), chips: questionChips(q) });
  }

  function startInterview(p: PendingInterview) {
    const def = SITUATION_BY_KEY.get(p.situation);
    if (!def) return;
    const answers = { ...p.answers };
    const firstOpen = def.questions.findIndex((q) => !answers[q.key]);
    if (firstOpen === -1) {
      finishInterview({ journeyId: p.journeyId, situation: p.situation, title: p.title, index: def.questions.length, answers });
      return;
    }
    const iv: Interview = { journeyId: p.journeyId, situation: p.situation, title: p.title, index: firstOpen, answers };
    setInterview(iv);
    pushTurn({
      from: "assistant",
      text: `Remplissons « ${p.title} » ensemble, une question à la fois. Chaque réponse est enregistrée dans votre brouillon : vous pouvez arrêter quand vous voulez et reprendre plus tard, ici ou dans le formulaire.${firstOpen > 0 ? " Je reprends là où vous vous étiez arrêté." : ""} À la fin, je vous relirai tout avant de préparer quoi que ce soit.`,
    });
    askQuestion(iv);
  }

  function finishInterview(iv: Interview) {
    const def = SITUATION_BY_KEY.get(iv.situation);
    setInterview(null);
    if (!def) return;
    const lignes = ["Voici vos réponses — relisez-les avant que je prépare le plan :"];
    for (const q of def.questions) {
      const value = iv.answers[q.key];
      if (!value) {
        if (q.required) lignes.push(`• ${q.label} (sans réponse — le formulaire vous la redemandera)`);
        continue;
      }
      const shown = q.type === "select" ? (q.options?.find(([v]) => v === value)?.[1] ?? value)
        : q.type === "date" ? new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR")
        : value;
      lignes.push(`• ${q.label} : ${shown}`);
    }
    lignes.push("Une réponse à corriger ? Ouvrez le formulaire, tout y est déjà rempli. Si tout est juste, confirmez la préparation du plan ci-dessous.");
    pushTurn({
      from: "assistant",
      text: lignes.join("\n"),
      action: { kind: "finaliser", journeyId: iv.journeyId, title: iv.title, evenement: iv.situation === "evenement" || iv.situation === "mariage" },
      chips: [{ label: "Ouvrir le formulaire pour corriger", kind: "link", href: `/espace/demarches/nouvelle?reprendre=${iv.journeyId}` }],
    });
  }

  function stopInterview() {
    if (!interview) return;
    const title = interview.title;
    const journeyId = interview.journeyId;
    setInterview(null);
    pushTurn({
      from: "assistant",
      text: `On s’arrête là. Vos réponses sont enregistrées dans le brouillon « ${title} » : vous reprendrez quand vous voulez, ici ou dans le formulaire.`,
      chips: [
        { label: "Ouvrir le formulaire", kind: "link", href: `/espace/demarches/nouvelle?reprendre=${journeyId}` },
        { label: "Mes démarches", kind: "link", href: "/espace/demarches" },
      ],
    });
    router.refresh();
  }

  async function answerQuestion(rawValue: string, echoed: boolean, display?: string) {
    if (!interview || interviewBusy.current) return;
    const def = SITUATION_BY_KEY.get(interview.situation);
    if (!def) return;
    const q = def.questions[interview.index];
    if (!echoed) pushTurn({ from: "user", text: display ?? rawValue });

    if (rawValue === "__passer__") {
      advanceInterview(interview, interview.answers);
      return;
    }

    // Normalisation selon le type de question — jamais d’interprétation libre.
    let saved: string | null = null;
    if (q.type === "select") {
      const typed = normalizeOrientation(rawValue);
      const found = (q.options ?? []).find(([v]) => v === rawValue)
        ?? (q.options ?? []).find(([, label]) => normalizeOrientation(label) === typed)
        ?? (q.options ?? []).find(([, label]) => typed.length > 2 && normalizeOrientation(label).startsWith(typed));
      if (found) saved = found[0];
    } else if (q.type === "date") {
      const iso = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const fr = rawValue.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
      const candidate = iso ? rawValue : fr ? `${fr[3]}-${fr[2].padStart(2, "0")}-${fr[1].padStart(2, "0")}` : null;
      if (candidate) {
        const parsed = new Date(`${candidate}T12:00:00`);
        if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(candidate)) saved = candidate;
      }
    } else if (q.type === "number") {
      const n = Number(rawValue.replace(",", "."));
      if (Number.isFinite(n) && n >= 0) saved = String(n);
    } else if (q.type === "time") {
      const t = rawValue.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (t) saved = `${t[1].padStart(2, "0")}:${t[2]}`;
    } else {
      const clean = rawValue.trim();
      if (clean) saved = clean.slice(0, 600);
      else if (!q.required) saved = null;
    }

    if (saved === null) {
      // (Le cas « passer » est déjà reparti plus haut ; une réponse vide à une
      // question facultative vaut aussi « passer ».)
      if (!q.required && !rawValue.trim()) { advanceInterview(interview, interview.answers); return; }
      pushTurn({
        from: "assistant",
        text: q.type === "select"
          ? "Je n’ai pas reconnu ce choix. Touchez l’une des réponses proposées ci-dessous, ou écrivez-la exactement."
          : q.type === "date"
            ? "Je n’ai pas compris cette date. Écrivez-la au format JJ/MM/AAAA (par exemple 12/10/2026)."
            : "Je n’ai pas compris. Pouvez-vous reformuler en quelques mots ?",
      });
      askQuestion(interview);
      return;
    }

    interviewBusy.current = true;
    try {
      const result = await assistantSaveAnswer(interview.journeyId, q.key, saved as string);
      if (!result.ok) {
        pushTurn({ from: "assistant", text: `Je n’ai pas pu enregistrer cette réponse (${result.error}). Votre brouillon reste en l’état ; nous pouvons réessayer, ou continuer dans le formulaire.` });
        askQuestion(interview);
        return;
      }
    } catch {
      pushTurn({ from: "assistant", text: "Je n’ai pas pu enregistrer cette réponse. Votre brouillon reste en l’état ; nous pouvons réessayer, ou continuer dans le formulaire." });
      askQuestion(interview);
      return;
    } finally {
      interviewBusy.current = false;
    }
    advanceInterview(interview, { ...interview.answers, [q.key]: saved as string });
  }

  function advanceInterview(iv: Interview, answers: Record<string, string>) {
    const def = SITUATION_BY_KEY.get(iv.situation);
    if (!def) return;
    let next = iv.index + 1;
    while (next < def.questions.length && answers[def.questions[next].key]) next++;
    if (next >= def.questions.length) {
      finishInterview({ ...iv, answers, index: def.questions.length });
      return;
    }
    const updated: Interview = { ...iv, answers, index: next };
    setInterview(updated);
    askQuestion(updated);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const original = input.trim();
    const value = requestText(original);
    if (!original || interviewBusy.current) return;
    setInput("");
    pushTurn({ from: "user", text: original });

    // Questionnaire conversationnel en cours : la saisie vaut réponse
    // (quelques mots d’arrêt permettent d’en sortir proprement).
    if (interview) {
      const normalized = normalizeOrientation(original);
      if (["stop", "arreter", "annuler", "plus tard", "pause", "j arrete", "on arrete"].includes(normalized)) stopInterview();
      else void answerQuestion(original, true);
      return;
    }

    const command = conversationCommand(value);
    if (command === "next" && guide) { nextStep(); return; }
    if (command === "previous" && guide) { previousStep(); return; }
    if (command === "stop") {
      if (guide) quitGuide();
      else pushTurn({ from: "assistant", text: "D’accord, on s’arrête là. Aucune nouvelle action n’est lancée. Les propositions déjà affichées restent à confirmer ou à annuler sur leur carte." });
      return;
    }
    if (command === "resume" && summary?.drafts.length) {
      pushTurn({ from: "assistant", text: "Quel brouillon souhaitez-vous reprendre ?", chips: summary.drafts.map((draft) => ({ label: draft.title, kind: "link", href: `/espace/demarches/nouvelle?reprendre=${draft.id}` })) });
      return;
    }
    if (command === "hello" || command === "thanks" || command === "help" || command === "resume" || command === "next" || command === "previous") {
      const step = guide ? scenarios.find((s) => s.id === guide.scenarioId)?.steps[guide.stepIndex] : null;
      pushTurn({ from: "assistant", text: command === "thanks"
        ? "Avec plaisir. Je reste là si vous avez besoin d’un autre coup de main."
        : step ? `On reprend tranquillement. ${step.text}${step.action ? ` ${step.action}` : ""} Dites « suivant » pour continuer, ou « stop » pour quitter le guide.`
        : "Dites-moi ce que vous voulez faire, avec vos mots : préparer un mariage, trouver un producteur, consulter un document… Je vous proposerai la prochaine étape. Pour une action engageante, vous gardez toujours la main.", chips: suggestions });
      return;
    }
    // Un « oui » ne vaut jamais confirmation d'une action engageante.
    if (/^(oui|oui merci|d accord|ok)$/.test(normalizeOrientation(value))) {
      const previous = turns[turns.length - 1];
      pushTurn({ from: "assistant", text: previous?.action
        ? "Pour valider cette action, utilisez le bouton de confirmation sur sa carte. Je ne lance rien sur un simple « oui »."
        : "D’accord. Choisissez l’une des propositions, ou précisez ce que vous voulez faire.", chips: previous?.chips ?? suggestions });
      return;
    }
    // Une réponse courte peut sélectionner une proposition précédente, jamais confirmer une écriture.
    const previousChips = turns[turns.length - 1]?.chips ?? [];
    const chosen = suggestedChoice(value, previousChips);
    if (chosen) { handleSuggestion(chosen); return; }

    if (guide) { setGuide(null); clearHighlight(); }

    // Assistant personnalisé (niveau 1, lecture seule) : référence citée et
    // questions sur les démarches du membre, répondues depuis ses données.
    if (summary) {
      const byReference = findCaseAnswer(summary, value);
      if (byReference) { answerPersonal(byReference); return; }
      const intent = personalIntent(value);
      if (intent === "pieces") { answerPersonal(buildPieces(summary)); return; }
      if (intent === "annee") { answerPersonal(buildAnnee(yearEvents ?? [], new Date())); return; }
      if (intent === "agenda") { answerPersonal(buildAgenda(summary)); return; }
      if (intent === "point") { answerPersonal(buildPoint(summary, focusLine)); proposeReminderIfUseful(); return; }
    }

    // Assistant niveau 2 : une intention d’écriture produit une proposition
    // à confirmer (carte ci-dessous), jamais une exécution directe.
    if (summary && canAct) {
      const wIntent = writeIntent(value);
      if (wIntent === "transmettre") {
        const available = summary.journeys.filter((j) => !j.transmitted);
        if (!focusJourney && available.length > 1) {
          pushTurn({ from: "assistant", text: "Vous avez plusieurs parcours. Ouvrez celui que vous souhaitez transmettre, puis redemandez-moi : je vous présenterai la confirmation pour ce parcours précis.", chips: available.map((j) => ({ label: j.title, kind: "link", href: `/espace/demarches/suivi/${j.id}` })) });
          return;
        }
        const candidate = focusJourney ?? summary.journeys.find((j) => !j.transmitted) ?? null;
        if (!candidate) {
          const deja = summary.journeys.find((j) => j.transmitted);
          pushTurn({
            from: "assistant",
            text: deja
              ? "Votre parcours transmis a déjà son dossier auprès de votre bureau : le suivi continue là-bas, je n’ai rien à transmettre de plus."
              : summary.drafts.length
                ? "Terminez d’abord le questionnaire de votre parcours : c’est lui qui préparera le dossier à transmettre."
                : "Vous n’avez pas encore de parcours à transmettre. Commencez par en préparer un, par situation.",
            chips: [{ label: "Mes démarches", kind: "link", href: "/espace/demarches" }],
          });
          return;
        }
        pushTurn({
          from: "assistant",
          text: `Je peux transmettre le parcours « ${candidate.title} » à votre bureau d’accompagnement. Il deviendra un dossier suivi par votre bureau, qui pourra vous demander des pièces. Le parcours restera consultable, et rien ne part vers un organisme extérieur.`,
          action: { kind: "transmettre", journeyId: candidate.id, title: candidate.title },
        });
        return;
      }
      if (wIntent === "rappel") {
        const available = summary.journeys.filter((j) => j.nextTask && j.nextTask.dueKind !== "officielle");
        if (!focusJourney && available.length > 1) {
          pushTurn({ from: "assistant", text: "Pour quel parcours souhaitez-vous un rappel ? Ouvrez son suivi, puis redemandez-moi de poser le rappel.", chips: available.map((j) => ({ label: j.title, kind: "link", href: `/espace/demarches/suivi/${j.id}` })) });
          return;
        }
        const focused = focusJourney?.nextTask && focusJourney.nextTask.dueKind !== "officielle" ? focusJourney : null;
        const candidate = focused ?? summary.journeys.find((j) => j.nextTask && j.nextTask.dueKind !== "officielle") ?? null;
        if (!candidate?.nextTask) {
          pushTurn({
            from: "assistant",
            text: "Je ne vois pas d’étape ouverte sur laquelle poser un rappel pour le moment : soit vos parcours sont à jour, soit la prochaine étape porte une échéance officielle, qui ne se remplace pas. Ouvrez le suivi d’un parcours pour y voir plus clair.",
            chips: [{ label: "Mes démarches", kind: "link", href: "/espace/demarches" }],
          });
          return;
        }
        pushTurn({
          from: "assistant",
          text: `Je peux poser un rappel personnel sur l’étape « ${candidate.nextTask.label} » du parcours « ${candidate.title} ».`,
          action: { kind: "rappel", taskId: candidate.nextTask.id, journeyId: candidate.id, taskLabel: candidate.nextTask.label },
        });
        return;
      }
    }

    const orientation = matchSituation(value);
    if ((role === "membre" || role === "visiteur") && orientation.kind === "single" && orientation.matches[0].score >= 12) {
      const situation = orientation.matches[0];
      // Niveau 2 : au membre connecté, proposer de créer le brouillon tout de
      // suite (toujours après confirmation explicite).
      if (canAct && summary) {
        const existingJourney = summary.journeys.find((j) => j.situation === situation.key);
        if (existingJourney) {
          pushTurn({
            from: "assistant",
            text: `Vous avez déjà un parcours « ${situation.label} » en cours (${existingJourney.done}/${existingJourney.total} étapes faites). Le plus utile est de le continuer.`,
            chips: [
              { label: "Ouvrir le suivi", kind: "link", href: `/espace/demarches/suivi/${existingJourney.id}` },
              { label: "Toutes mes démarches", kind: "link", href: "/espace/demarches" },
            ],
          });
          return;
        }
        const existingDraft = summary.drafts.find((d) => d.situation === situation.key);
        if (existingDraft) {
          setPendingInterview({ journeyId: existingDraft.id, situation: situation.key, title: situation.label, answers: existingDraft.answers });
          pushTurn({
            from: "assistant",
            text: `Vous aviez déjà commencé « ${situation.label} » : votre brouillon vous attend, rien à recréer. Je peux vous poser les questions une à une, ici même.`,
            chips: [
              { label: "Répondre avec l’assistant, question par question", kind: "scenario", scenarioId: "__entretien__" },
              { label: "Ouvrir le formulaire", kind: "link", href: `/espace/demarches/nouvelle?reprendre=${existingDraft.id}` },
              { label: "Comprendre ce parcours", kind: "link", href: `/accompagnement?besoin=${encodeURIComponent(situation.key)}` },
            ],
          });
          return;
        }
        pushTurn({
          from: "assistant",
          text: `Votre formulation semble concerner « ${situation.label} ». ${situation.explanation}`,
          action: { kind: "creer_brouillon", situation: situation.key, situationLabel: situation.label },
          chips: [{ label: "Comprendre ce parcours d’abord", kind: "link", href: `/accompagnement?besoin=${encodeURIComponent(situation.key)}` }],
        });
        return;
      }
      pushTurn({
        from: "assistant",
        text: `Votre formulation semble concerner « ${situation.label} ». ${situation.explanation} Je ne transmets aucune donnée à un organisme.`,
        chips: [
          { label: "Comprendre ce parcours", kind: "link", href: `/accompagnement?besoin=${encodeURIComponent(situation.key)}` },
          { label: accountsEnabled || role === "membre" ? "Le préparer dans Mon espace" : "Les comptes sont-ils disponibles ?", kind: "link", href: accountsEnabled || role === "membre" ? `/espace/demarches/nouvelle?situation=${encodeURIComponent(situation.key)}` : "/mon-espace" },
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
        text: "Je n’ai pas bien saisi votre demande. Souhaitez-vous plutôt :",
        chips: match.scenarios.map((scenario) => ({ label: scenario.question, kind: "scenario" as const, scenarioId: scenario.id })),
      });
      return;
    }
    if ((role === "membre" || role === "visiteur") && orientation.matches.length) {
      pushTurn({
        from: "assistant",
        text: orientation.kind === "ambiguous" ? "Plusieurs situations pourraient correspondre. Choisissez celle qui vous parle :" : "Cette situation semble proche de votre question. Vérifiez qu’elle vous correspond :",
        chips: orientation.matches.map((situation) => ({ label: situation.label, kind: "link" as const, href: `/accompagnement?besoin=${encodeURIComponent(situation.key)}` })),
      });
      return;
    }
    const destinations = navigationChoices(value, role, accountsEnabled);
    if (destinations.length) {
      pushTurn({ from: "assistant", text: destinations.length === 1 ? "Voici où commencer. Ouvrez cette page ; je reste disponible pour la suite." : "Ces pages peuvent répondre à votre besoin. Laquelle souhaitez-vous ouvrir ?", chips: destinations });
      return;
    }
    pushTurn({
      from: "assistant",
      text: "Je ne suis pas sûr d’avoir compris. Quel résultat souhaitez-vous obtenir ? Vous pouvez aussi chercher une information ou trouver un interlocuteur :",
      chips: role === "gestionnaire" || role === "administrateur" ? [
        { label: "Ouvrir la messagerie de l’équipe", kind: "link", href: "/back-office/messages" },
        { label: "Lire les guides", kind: "link", href: `/informations?q=${encodeURIComponent(value)}` },
      ] : [
        { label: "Rechercher dans les guides", kind: "link", href: `/informations?q=${encodeURIComponent(value)}` },
        { label: "Trouver un interlocuteur", kind: "link", href: "/accompagnement#organismes" },
      ],
    });
  }

  function handleSuggestion(suggestion: Suggestion) {
    if (suggestion.kind === "reponse") {
      void answerQuestion(suggestion.answerValue ?? "", false, suggestion.label);
      return;
    }
    if (suggestion.scenarioId === "__entretien__") {
      if (pendingInterview) startInterview(pendingInterview);
      return;
    }
    if (suggestion.scenarioId === "__stop_entretien__") {
      stopInterview();
      return;
    }
    if (suggestion.kind === "link" && suggestion.href) {
      router.push(suggestion.href);
      pushTurn({ from: "assistant", text: `J’ouvre la page « ${suggestion.label} ».` });
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
                { label: "Voir Le Monde Aime", kind: "link", href: "/le-monde-aime" },
                { label: "Découvrir Mon espace", kind: "link", href: "/mon-espace" },
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

  function dateIn(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  /** Carte de confirmation d’une écriture (assistant niveau 2). */
  function renderActionCard(turn: Turn) {
    const action = turn.action;
    if (!action) return null;
    const state = actionState[turn.id];
    if (state?.status === "cancelled") {
      return <p className="px-1 text-xs text-ink-3">D&apos;accord, je ne fais rien. Vous pourrez toujours le faire depuis les pages habituelles.</p>;
    }
    if (state?.status === "done") return null;
    const busy = state?.status === "busy";
    const btn = "rounded-control px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50";
    return (
      <div className="rounded-card border ring-line bg-muted/80 px-3.5 py-3">
        {state?.status === "error" && (
          <p className="mb-2 text-xs font-medium text-ink-2">{state.message}</p>
        )}
        {action.kind === "creer_brouillon" && (
          <>
            <p className="text-sm font-semibold text-ink">Créer le brouillon « {action.situationLabel} » ?</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/75">Je crée un brouillon vide dans Mes démarches. Aucune donnée n&apos;est envoyée : vous répondrez aux questions ensuite, à votre rythme, avec la possibilité de tout relire avant la moindre transmission.</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void executeAction(turn)} className={`${btn} bg-ink text-canvas hover:bg-ink-2`}>{busy ? "Création…" : "Oui, créer le brouillon"}</button>
              <button type="button" disabled={busy} onClick={() => cancelAction(turn)} className={`${btn} border ring-ink-4 bg-canvas text-ink`}>Pas maintenant</button>
            </div>
          </>
        )}
        {action.kind === "rappel" && (
          <>
            <p className="text-sm font-semibold text-ink">Poser un rappel pour « {action.taskLabel} » ?</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/75">Rappel personnel, sans valeur officielle : vous recevrez une notification ici à l&apos;approche de la date.</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void executeAction(turn, dateIn(1))} className={`${btn} bg-ink text-canvas hover:bg-ink-2`}>{busy ? "En cours…" : "Demain"}</button>
              <button type="button" disabled={busy} onClick={() => void executeAction(turn, dateIn(3))} className={`${btn} bg-ink text-canvas hover:bg-ink-2`}>Dans 3 jours</button>
              <button type="button" disabled={busy} onClick={() => void executeAction(turn, dateIn(7))} className={`${btn} bg-ink text-canvas hover:bg-ink-2`}>Dans 1 semaine</button>
              <button type="button" disabled={busy} onClick={() => cancelAction(turn)} className={`${btn} border ring-ink-4 bg-canvas text-ink`}>Pas maintenant</button>
            </div>
          </>
        )}
        {action.kind === "finaliser" && (
          <>
            <p className="text-sm font-semibold text-ink">Préparer le plan « {action.title} » à partir de ces réponses ?</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/75">Je génère vos étapes et vos pièces depuis les réponses relues ci-dessus.{action.evenement ? " Un projet partagé sera créé dans votre espace pour coordonner l’organisation, comme depuis le formulaire." : ""} Aucune transmission à votre bureau : ce sera une autre étape, seulement si vous la demandez.</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void executeAction(turn)} className={`${btn} bg-ink text-canvas hover:bg-ink-2`}>{busy ? "Préparation…" : "Oui, préparer mon plan"}</button>
              <button type="button" disabled={busy} onClick={() => cancelAction(turn)} className={`${btn} border ring-ink-4 bg-canvas text-ink`}>Pas maintenant</button>
            </div>
          </>
        )}
        {action.kind === "transmettre" && (
          <>
            <p className="text-sm font-semibold text-ink">Transmettre « {action.title} » à votre bureau ?</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/75">Confirmation définitive : un dossier sera créé et suivi par votre bureau d&apos;accompagnement, à partir des réponses que vous avez relues dans ce parcours. Rien ne part vers un organisme extérieur, et le parcours reste consultable.</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void executeAction(turn)} className={`${btn} bg-ink text-canvas hover:bg-ink-2`}>{busy ? "Transmission…" : "Oui, transmettre à mon bureau"}</button>
              <button type="button" disabled={busy} onClick={() => cancelAction(turn)} className={`${btn} border ring-ink-4 bg-canvas text-ink`}>Pas maintenant</button>
            </div>
          </>
        )}
      </div>
    );
  }

  const totalSteps = guide ? scenarios.find((item) => item.id === guide.scenarioId)?.steps.length ?? 0 : 0;
  const lastSuggestions = displayTurns.length > 0 ? displayTurns[displayTurns.length - 1].chips : undefined;

  return (
    <>
      {/* Bulle de conversation, en bas à droite */}
      <div className="fixed bottom-20 right-4 z-50 flex items-center gap-3 md:bottom-5 md:right-5">
        {!open && (
          <span className="hidden rounded-full bg-canvas px-3 py-2 text-sm font-semibold text-ink-2 shadow-md sm:block">
            Besoin d&apos;aide ?
          </span>
        )}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => { if (open) { setOpen(false); triggerRef.current?.focus(); } else setOpen(true); }}
          aria-expanded={open}
          aria-controls="assistant-panel"
          className="grid h-14 w-14 place-items-center rounded-full bg-ink text-canvas shadow-hover transition hover:bg-ink-2"
          aria-label={open ? "Fermer l’assistant de navigation" : "Ouvrir l’assistant de navigation"}
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
          className="fixed inset-x-3 bottom-36 z-50 flex max-h-[70vh] md:bottom-24 flex-col overflow-hidden rounded-card bg-canvas ring-1 ring-line shadow-lifted sm:inset-x-auto sm:bottom-36 sm:right-5 md:bottom-24 sm:w-[400px]"
        >
          <header className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-canvas">
              <Msasprout className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">Assistant de navigation</p>
              <p className="truncate text-xs text-ink-3">
                Guide du site, sans IA générative · {role === "visiteur" ? "visiteur" : role}
              </p>
            </div>
            <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} className="grid h-10 w-10 place-items-center rounded-control text-ink-3 hover:bg-muted" aria-label="Fermer l’assistant">
              <Icon name="alert" className="h-4 w-4 rotate-45" />
            </button>
          </header>

          {guide && (
            <div className="flex items-center gap-2 border-b border-line bg-muted px-4 py-2.5">
              <span className="text-xs font-semibold text-ink">
                Étape {guide.stepIndex + 1} sur {totalSteps}
              </span>
              <div className="mx-1 h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-ink-2 transition-all" style={{ width: `${((guide.stepIndex + 1) / Math.max(1, totalSteps)) * 100}%` }} />
              </div>
              <button type="button" onClick={previousStep} disabled={guide.stepIndex === 0} className="rounded-md px-2 py-1 text-xs font-semibold text-ink disabled:opacity-40">
                Précédent
              </button>
              <button type="button" onClick={nextStep} className="rounded-md bg-ink px-2.5 py-1 text-xs font-semibold text-canvas">
                {guide.stepIndex + 1 === totalSteps ? "Fin du guide" : "Suivant"}
              </button>
              <button type="button" onClick={quitGuide} className="rounded-md border ring-line px-2 py-1 text-xs font-semibold text-ink">
                Quitter le guide
              </button>
            </div>
          )}

          {highlightLabel && (
            <p className="border-b border-line bg-subtle px-4 py-2 text-xs text-ink-3">
              Élément mis en évidence : <strong className="text-ink">{highlightLabel}</strong>
            </p>
          )}

          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto bg-subtle px-4 py-4" aria-live="polite">
            {displayTurns.map((turn) => (
              <div key={turn.id} className="space-y-2">
                <div className={`flex ${turn.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] whitespace-pre-line rounded-card px-3.5 py-2.5 text-sm ${turn.from === "user" ? "bg-ink text-canvas" : "bg-canvas text-ink-2 shadow-rested"}`}>
                    {turn.text}
                  </div>
                </div>
                {turn.action && canAct && renderActionCard(turn)}
              </div>
            ))}
            {lastSuggestions && !guide && (
              <div role="group" aria-label="Choix proposés par l’assistant" className="flex flex-wrap gap-2">
                {lastSuggestions.map((suggestion) => (
                  <button key={`${suggestion.label}-${suggestion.href ?? suggestion.scenarioId ?? ""}`} type="button" onClick={() => handleSuggestion(suggestion)} className="min-h-9 rounded-control ring-1 ring-line bg-canvas px-3 py-2 text-left text-xs font-semibold text-ink-2 shadow-rested hover:border-line">
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}
            {turns.length === 0 && !greetingTurn && <p className="text-sm text-ink-3">Posez votre question ou choisissez une suggestion.</p>}
          </div>

          <div className="border-t border-line bg-canvas px-3 py-3">
            {!lastSuggestions && !guide && <div className="mb-2 flex flex-wrap gap-1.5">
              {summary && (
                <button
                  type="button"
                  onClick={() => { pushTurn({ from: "user", text: "Faire le point sur mes démarches" }); answerPersonal(buildPoint(summary, focusLine)); proposeReminderIfUseful(); }}
                  className="rounded-full border ring-ink bg-ink px-3 py-1.5 text-xs font-semibold text-canvas transition hover:bg-ink-2"
                >
                  Faire le point sur mes démarches
                </button>
              )}
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleSuggestion(suggestion)}
                  className="rounded-full ring-1 ring-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink-2 transition hover:ring-ink hover:text-ink"
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
                maxLength={600}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Décrivez ce que vous voulez faire…"
                className="min-w-0 flex-1 rounded-control ring-1 ring-line px-3 py-2 text-sm outline-none focus:ring-ink"
              />
              <PrimaryButton type="submit" className="!px-3 !py-2 text-xs">Envoyer</PrimaryButton>
            </form>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-4">
              La conversation s’efface au rechargement. Les réponses déjà enregistrées dans un brouillon restent disponibles dans Mes démarches.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-4">
              {canAct
                ? "Avec votre confirmation explicite, je peux créer un brouillon, poser un rappel ou transmettre un parcours à votre bureau d’accompagnement. Je ne décide jamais d’un droit, ne calcule aucun montant et n’envoie rien à un organisme extérieur."
                : summary
                  ? "Je peux faire le point sur vos démarches depuis vos données. Je ne modifie rien : aucune action n’est effectuée sans votre validation dans les formulaires habituels."
                  : "Aide à la navigation uniquement. Aucune réponse réglementaire n’est inventée et aucune action n’est effectuée sans votre validation dans les formulaires habituels."}
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
