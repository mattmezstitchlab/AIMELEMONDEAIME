"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/lib/actions/auth";
import { Field, Input, Notice, PrimaryButton } from "@/components/ui";

const initialState: ActionResult | null = null;

export function LoginForm({ next, available = true }: { next?: string; available?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Adresse e-mail" name="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Mot de passe" name="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state && !state.ok && <Notice tone="danger">{state.error}</Notice>}
      <PrimaryButton type="submit" disabled={pending || !available} size="lg" className="mt-1 w-full">
        {pending ? "Connexion…" : "Me connecter"}
      </PrimaryButton>
    </form>
  );
}
