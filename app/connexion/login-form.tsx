"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/lib/actions/auth";
import { PrimaryButton } from "@/components/ui";

const initialState: ActionResult | null = null;

export function LoginForm({ next, available = true }: { next?: string; available?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Adresse e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600"
        />
      </div>
      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}
      <PrimaryButton type="submit" disabled={pending || !available} className="mt-2">
        {pending ? "Connexion…" : "Me connecter"}
      </PrimaryButton>
    </form>
  );
}
