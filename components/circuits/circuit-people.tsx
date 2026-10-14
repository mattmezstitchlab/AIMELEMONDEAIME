"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { PrimaryButton } from "@/components/ui";
import { normalizeText } from "@/components/community/community-app";
import { saveTransmissionOffer } from "@/lib/actions/profile";
import type { Circuit } from "@/lib/circuits";

/*
 * Le tableau d'un circuit de personnes.
 *
 * Ici, il n'y a pas de fiche à déposer : ce qu'on publie, c'est ce qu'on
 * accepte de transmettre, et cela vit dans le profil public. Le circuit le lit,
 * le filtre par commune et par mot-clé, et laisse chacun décider, depuis son
 * espace, ce qui apparaît ou disparaît.
 */

const card = "animate-fade-up rounded-card bg-canvas p-5 ring-1 ring-line shadow-rested";
const field = "mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-4";
const fieldLabel = "block text-xs font-semibold text-ink-2";

export type CircuitPersonRow = {
  id: number;
  name: string;
  city: string | null;
  bio: string | null;
  activities: string[];
  universes: string[];
  transmitText: string | null;
  availabilityNote: string | null;
  hasPhoto: boolean;
  isDemo: boolean;
  isMine: boolean;
};

function PersonCard({ person }: { person: CircuitPersonRow }) {
  return (
    <article className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug text-ink">{person.name}</h3>
          <p className="mt-1 text-xs text-ink-3">
            <Icon name="pin" className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            {person.city || "Commune non précisée"} · position approximative
          </p>
        </div>
        {person.isMine && <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink">Vous</span>}
      </div>

      {person.transmitText && (
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          <span className="font-semibold text-ink">Accepte de transmettre :</span> {person.transmitText}
        </p>
      )}
      {person.availabilityNote && <p className="mt-2 text-xs text-ink-3">{person.availabilityNote}</p>}
      {person.activities.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {person.activities.slice(0, 4).map((activity) => (
            <li key={activity} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-ink-2">{activity}</li>
          ))}
        </ul>
      )}

      <Link href={`/le-monde-aime/personnes/${person.id}`} className="mt-4 inline-flex h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-canvas">
        Voir la personne
      </Link>
    </article>
  );
}

/** Le formulaire qui dit ce qu'on accepte de transmettre — et qui le retire. */
function TransmissionOffer({ current }: { current: string | null }) {
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [value, setValue] = useState(current ?? "");

  function submit(form: FormData) {
    start(async () => {
      const result = await saveTransmissionOffer(form);
      setFeedback({ ok: result.ok, text: result.ok ? result.message : result.error });
    });
  }

  return (
    <form action={submit} className="mt-3 space-y-3">
      <div>
        <label className={fieldLabel} htmlFor="transmit-text">Ce que j&apos;accepte de transmettre</label>
        <textarea
          id="transmit-text"
          name="transmitText"
          rows={3}
          maxLength={300}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ex. le greffage des arbres fruitiers, la couture, les contes du pays…"
          className={field}
        />
        <p className="mt-1 text-xs text-ink-3">
          Laissez vide puis enregistrez pour retirer votre proposition des listes. Rien ne se publie sans votre accord.
        </p>
      </div>
      {feedback && (
        <p className={`text-xs font-medium ${feedback.ok ? "text-ink-2" : "text-ink"}`} role={feedback.ok ? "status" : "alert"}>
          {feedback.text}
        </p>
      )}
      <PrimaryButton type="submit" disabled={pending} className="!px-4 !py-2 text-xs">
        {pending ? "Enregistrement…" : value.trim() ? "Enregistrer" : "Retirer ma proposition"}
      </PrimaryButton>
    </form>
  );
}

export function CircuitPeople({ circuit, people, isMember, inlineOffer }: {
  circuit: Circuit;
  people: CircuitPersonRow[];
  isMember: boolean;
  /** Ce que le membre accepte de transmettre aujourd'hui. */
  inlineOffer: string | null;
}) {
  const [commune, setCommune] = useState("");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const city = normalizeText(commune.trim());
    const words = normalizeText(keyword.trim());
    return people.filter((person) => {
      if (city && !normalizeText(person.city ?? "").includes(city)) return false;
      if (words) {
        const haystack = normalizeText(`${person.transmitText ?? ""} ${person.activities.join(" ")} ${person.bio ?? ""} ${person.city ?? ""}`);
        if (!haystack.includes(words)) return false;
      }
      return true;
    });
  }, [people, commune, keyword]);

  return (
    <div>
      <div id="circuit-filters" className="rounded-card bg-subtle p-4 ring-1 ring-line-soft">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-3">Affiner</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabel} htmlFor="circuit-person-city">Commune</label>
            <input id="circuit-person-city" value={commune} onChange={(event) => setCommune(event.target.value)} placeholder="Chartres" className={field} />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="circuit-person-word">{circuit.words.searchLabel}</label>
            <input id="circuit-person-word" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={circuit.words.searchHint} className={field} />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-3">{filtered.length} personne(s) affichée(s) · positions approximatives, déduites de la commune.</p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-card bg-muted p-5 text-sm text-ink-2">{circuit.empty}</p>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {filtered.map((person) => <PersonCard key={person.id} person={person} />)}
        </div>
      )}

      {isMember ? (
        <section id="circuit-mine" className="mt-10 rounded-card bg-subtle p-5 ring-1 ring-line-soft">
          <h2 className="text-lg leading-snug text-ink">{circuit.words.ordersTitle}</h2>
          <p className="mt-1 text-sm text-ink-2">
            Ce que vous acceptez de transmettre apparaît ici, et sur votre profil public quand il est visible.
          </p>
          <TransmissionOffer current={inlineOffer} />
        </section>
      ) : (
        <p className="mt-6 rounded-card bg-muted p-4 text-sm text-ink-2">
          Les comptes ouvrent bientôt : les propositions restent consultables par tous, et déclarer ce que vous transmettez viendra avec les comptes.
        </p>
      )}
    </div>
  );
}
