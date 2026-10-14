"use client";

import { useEffect, useState } from "react";
import { Accessibility } from "lucide-react";

/*
 * Préférences d'affichage : taille du texte, contraste, animations.
 * Les valeurs sont posées sur <html> (data-*) et lues par app/globals.css.
 * Cookie de première partie uniquement — aucune donnée de parcours.
 */

type Prefs = { text: "normal" | "grand"; contrast: "standard" | "renforce"; motion: "auto" | "reduit" };
const DEFAULT: Prefs = { text: "normal", contrast: "standard", motion: "auto" };
const COOKIE = "aime_display";

function applyDataset(prefs: Prefs) {
  const root = document.documentElement;
  root.dataset.textScale = prefs.text;
  root.dataset.contrast = prefs.contrast;
  root.dataset.motion = prefs.motion;
}

function persistPreferences(prefs: Prefs) {
  try {
    document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(prefs))}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* Stockage indisponible : les préférences restent valables pour la page. */
  }
}

/** Lecture unique du cookie, en initialisation paresseuse (pas de setState dans un effet). */
function readStoredPrefs(): Prefs {
  if (typeof document === "undefined") return DEFAULT;
  try {
    const stored = document.cookie.split("; ").find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (!stored) return DEFAULT;
    const parsed = JSON.parse(decodeURIComponent(stored)) as Partial<Prefs>;
    return {
      text: parsed.text === "grand" ? "grand" : "normal",
      contrast: parsed.contrast === "renforce" ? "renforce" : "standard",
      motion: parsed.motion === "reduit" ? "reduit" : "auto",
    };
  } catch { /* Cookie invalide : valeurs par défaut. */ return DEFAULT; }
}

/** Choix binaire présenté comme une paire de pastilles (style Cal.com). */
function Choice<Value extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  onDark,
}: {
  legend: string;
  name: string;
  value: Value;
  options: ReadonlyArray<readonly [Value, string]>;
  onChange: (value: Value) => void;
  onDark?: boolean;
}) {
  return (
    <fieldset>
      <legend className={`text-xs font-medium ${onDark ? "text-white/60" : "text-ink-3"}`}>{legend}</legend>
      <div className={`mt-2 inline-flex rounded-control p-0.5 ${onDark ? "bg-white/10" : "bg-muted"}`}>
        {options.map(([optionValue, label]) => {
          const active = value === optionValue;
          return (
            <label
              key={optionValue}
              className={`cursor-pointer rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition ${
                active
                  ? onDark
                    ? "bg-white text-ink"
                    : "bg-canvas text-ink shadow-rested"
                  : onDark
                    ? "text-white/60 hover:text-white"
                    : "text-ink-3 hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={active}
                onChange={() => onChange(optionValue)}
                className="sr-only"
              />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function DisplayPreferences({
  mode = "footer",
  onDark = false,
}: {
  mode?: "footer" | "sidebar" | "mobile";
  onDark?: boolean;
}) {
  const [prefs, setPrefs] = useState<Prefs>(readStoredPrefs);
  useEffect(() => { applyDataset(prefs); }, [prefs]);
  function change<Key extends keyof Prefs>(key: Key, value: Prefs[Key]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    persistPreferences(next);
  }

  const popover = mode === "mobile";
  const summaryTone = onDark
    ? "text-white/70 hover:bg-white/10 hover:text-white"
    : "text-ink-2 hover:bg-muted hover:text-ink";

  return (
    <details className={popover ? "relative" : "relative"}>
      <summary
        className={`flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-control px-3 text-sm font-medium transition [&::-webkit-details-marker]:hidden ${summaryTone}`}
      >
        <Accessibility className="h-4 w-4" aria-hidden="true" />
        Préférences d&apos;affichage
      </summary>
      <div
        className={`${popover ? "absolute right-0 top-12 z-50 w-72" : "absolute bottom-[calc(100%+0.6rem)] left-0 z-50 w-72"} rounded-card bg-canvas p-5 text-sm text-ink shadow-lifted ring-1 ring-line`}
      >
        <p className="text-xs leading-relaxed text-ink-3">
          Ces réglages restent sur cet appareil. Ils ne modifient ni vos données ni vos démarches.
        </p>
        <div className="mt-4 space-y-3">
          <Choice legend="Taille du texte" name={`text-${mode}`} value={prefs.text} onChange={(v) => change("text", v)} options={[["normal", "Normale"], ["grand", "Grande"]] as const} />
          <Choice legend="Contraste" name={`contrast-${mode}`} value={prefs.contrast} onChange={(v) => change("contrast", v)} options={[["standard", "Standard"], ["renforce", "Renforcé"]] as const} />
          <Choice legend="Animations" name={`motion-${mode}`} value={prefs.motion} onChange={(v) => change("motion", v)} options={[["auto", "Système"], ["reduit", "Réduites"]] as const} />
        </div>
      </div>
    </details>
  );
}
