"use client";

import { useEffect, useState } from "react";
import { Accessibility } from "lucide-react";

type Prefs = { text: "normal" | "grand"; contrast: "standard" | "renforce"; motion: "auto" | "reduit" };
const DEFAULT: Prefs = { text: "normal", contrast: "standard", motion: "auto" };
const COOKIE = "aime_display";

function applyPreferences(prefs: Prefs) {
  const root = document.documentElement;
  root.dataset.textScale = prefs.text;
  root.dataset.contrast = prefs.contrast;
  root.dataset.motion = prefs.motion;
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(prefs))};path=/;max-age=31536000;samesite=lax`;
}

/** Préférences de présentation seulement : cookie de première partie, aucune donnée de parcours. */
export function DisplayPreferences({ mode = "footer" }: { mode?: "footer" | "sidebar" | "mobile" }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  useEffect(() => {
    try {
      const stored = document.cookie.split("; ").find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
      if (!stored) return;
      const parsed = JSON.parse(decodeURIComponent(stored)) as Partial<Prefs>;
      const next: Prefs = {
        text: parsed.text === "grand" ? "grand" : "normal",
        contrast: parsed.contrast === "renforce" ? "renforce" : "standard",
        motion: parsed.motion === "reduit" ? "reduit" : "auto",
      };
      setPrefs(next);
      applyPreferences(next);
    } catch { /* Cookie invalide : valeurs par défaut. */ }
  }, []);
  function change<Key extends keyof Prefs>(key: Key, value: Prefs[Key]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    applyPreferences(next);
  }
  const popover = mode === "mobile";
  return (
    <details className={popover ? "relative" : "mx-auto max-w-sm text-left"}>
      <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 [&::-webkit-details-marker]:hidden ${popover ? "px-2 text-xs" : "px-3 text-sm"}`}>
        <Accessibility className="h-5 w-5" aria-hidden="true" />Préférences d&apos;affichage
      </summary>
      <div className={`${popover ? "absolute right-0 top-12 z-50 w-72 shadow-xl" : "mt-2"} rounded-xl border border-slate-200 bg-white p-4 text-sm`}>
        <p className="text-xs leading-relaxed text-slate-600">Ces réglages restent sur cet appareil. Ils ne modifient ni vos données ni vos démarches.</p>
        <fieldset className="mt-4">
          <legend className="text-xs font-bold text-slate-900">Taille du texte</legend>
          <div className="mt-2 flex gap-3">
            {([ ["normal", "Normale"], ["grand", "Grande"] ] as const).map(([value, label]) => <label key={value} className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium"><input type="radio" name={`text-${mode}`} checked={prefs.text === value} onChange={() => change("text", value)} className="h-4 w-4 accent-slate-900" />{label}</label>)}
          </div>
        </fieldset>
        <fieldset className="mt-3">
          <legend className="text-xs font-bold text-slate-900">Contraste</legend>
          <div className="mt-2 flex gap-3">
            {([ ["standard", "Standard"], ["renforce", "Renforcé"] ] as const).map(([value, label]) => <label key={value} className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium"><input type="radio" name={`contrast-${mode}`} checked={prefs.contrast === value} onChange={() => change("contrast", value)} className="h-4 w-4 accent-slate-900" />{label}</label>)}
          </div>
        </fieldset>
        <fieldset className="mt-3">
          <legend className="text-xs font-bold text-slate-900">Animations</legend>
          <div className="mt-2 flex gap-3">
            {([ ["auto", "Système"], ["reduit", "Réduites"] ] as const).map(([value, label]) => <label key={value} className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium"><input type="radio" name={`motion-${mode}`} checked={prefs.motion === value} onChange={() => change("motion", value)} className="h-4 w-4 accent-slate-900" />{label}</label>)}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
