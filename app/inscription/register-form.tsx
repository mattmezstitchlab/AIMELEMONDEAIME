"use client";

import { useActionState } from "react";
import { registerAction, type ActionResult } from "@/lib/actions/auth";
import { PrimaryButton } from "@/components/ui";
import { REGISTRATION_SITUATION_KEYS, SITUATION_LABELS } from "@/lib/constants";

const initialState: ActionResult | null = null;
type Office = { id: number; name: string; city: string };

export function RegisterForm({ offices, available = true, next }: { offices: Office[]; available?: boolean; next?: string }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet" name="fullName" required autoComplete="name" />
        <Field label="Adresse e-mail" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mot de passe" name="password" type="password" required autoComplete="new-password" hint="12 caractères minimum" />
        <Field label="Téléphone" name="phone" autoComplete="tel" />
      </div>
      <div>
        <label htmlFor="situation" className="block text-sm font-medium text-slate-700">Votre situation aujourd&apos;hui</label>
        <select id="situation" name="situation" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
          <option value="">Choisissez votre situation</option>
          {REGISTRATION_SITUATION_KEYS.map((value) => <option key={value} value={value}>{SITUATION_LABELS[value]}</option>)}
        </select>
        <p className="mt-1 text-xs text-slate-500">Elle personnalise votre accueil ; vous la préciserez ensuite par vos parcours, et elle pourra évoluer.</p>
      </div>
      <div>
        <label htmlFor="officeId" className="block text-sm font-medium text-slate-700">Votre bureau d&apos;accompagnement</label>
        <select id="officeId" name="officeId" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
          <option value="">Choisissez le bureau le plus proche</option>
          {offices.map((office) => <option key={office.id} value={office.id}>{office.name} — {office.city}</option>)}
        </select>
        <p className="mt-1 text-xs text-slate-500">C&apos;est l&apos;équipe qui pourra suivre les dossiers que vous choisirez de lui transmettre. Modifiable plus tard dans votre profil.</p>
      </div>
      <Field label="Adresse" name="address" autoComplete="street-address" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ville" name="city" required autoComplete="address-level2" />
        <Field label="Code postal" name="postalCode" autoComplete="postal-code" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date de naissance" name="birthDate" type="date" required hint="Inscription réservée aux adultes" />
        <Field label="Situation familiale" name="familyStatus" placeholder="Ex : marié(e), 2 enfants" />
      </div>
      {state && !state.ok && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      <PrimaryButton type="submit" disabled={pending || !available} className="mt-2">{pending ? "Création en cours…" : "Créer mon espace"}</PrimaryButton>
    </form>
  );
}

function Field({ label, name, type = "text", required, autoComplete, hint, placeholder }: { label: string; name: string; type?: string; required?: boolean; autoComplete?: string; hint?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
      <input id={name} name={name} type={type} required={required} autoComplete={autoComplete} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600" />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
