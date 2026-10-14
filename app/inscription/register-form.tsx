"use client";

import { useActionState } from "react";
import { registerAction, type ActionResult } from "@/lib/actions/auth";
import { Field, Input, Notice, PrimaryButton, Select } from "@/components/ui";
import { REGISTRATION_SITUATION_KEYS, SITUATION_LABELS } from "@/lib/constants";

const initialState: ActionResult | null = null;
type Office = { id: number; name: string; city: string };

export function RegisterForm({ offices, available = true, next }: { offices: Office[]; available?: boolean; next?: string }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  return (
    <form action={formAction} className="mt-7 flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom complet" name="fullName">
          <Input id="fullName" name="fullName" autoComplete="name" required />
        </Field>
        <Field label="Adresse e-mail" name="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Mot de passe" name="password" hint="12 caractères minimum">
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Téléphone" name="phone">
          <Input id="phone" name="phone" autoComplete="tel" />
        </Field>
      </div>

      <Field
        label="Votre situation aujourd’hui"
        name="situation"
        help="Elle personnalise votre accueil ; vous la préciserez ensuite par vos parcours, et elle pourra évoluer."
      >
        <Select id="situation" name="situation" defaultValue="">
          <option value="">Choisissez votre situation</option>
          {REGISTRATION_SITUATION_KEYS.map((value) => <option key={value} value={value}>{SITUATION_LABELS[value]}</option>)}
        </Select>
      </Field>

      <Field
        label="Votre bureau d’accompagnement"
        name="officeId"
        help="C’est l’équipe qui pourra suivre les dossiers que vous choisissez de lui transmettre. Modifiable plus tard dans votre profil."
      >
        <Select id="officeId" name="officeId" defaultValue="">
          <option value="">Choisissez le bureau le plus proche</option>
          {offices.map((office) => <option key={office.id} value={office.id}>{office.name} — {office.city}</option>)}
        </Select>
      </Field>

      <Field label="Adresse" name="address">
        <Input id="address" name="address" autoComplete="street-address" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ville" name="city">
          <Input id="city" name="city" autoComplete="address-level2" required />
        </Field>
        <Field label="Code postal" name="postalCode">
          <Input id="postalCode" name="postalCode" autoComplete="postal-code" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date de naissance" name="birthDate" hint="Inscription réservée aux adultes">
          <Input id="birthDate" name="birthDate" type="date" required />
        </Field>
        <Field label="Situation familiale" name="familyStatus">
          <Input id="familyStatus" name="familyStatus" placeholder="Ex : marié(e), 2 enfants" />
        </Field>
      </div>

      {state && !state.ok && <Notice tone="danger">{state.error}</Notice>}
      <PrimaryButton type="submit" disabled={pending || !available} size="lg" className="mt-1">
        {pending ? "Création en cours…" : "Créer mon espace"}
      </PrimaryButton>
    </form>
  );
}
