import Link from "next/link";
import type { Metadata } from "next";
import { requireRolePage } from "@/lib/auth";
import { SectionTitle, EmptyState } from "@/components/ui";
import { PrintButton } from "@/components/community/print-button";
import { buildYear, relativeLabel, YEAR_EVENT_LABELS, type YearEvent, type YearEventKind } from "@/lib/annee";
import { getYearEvents } from "@/lib/annee-queries";

export const metadata: Metadata = { title: "Mon année à préparer — AIME®" };
export const dynamic = "force-dynamic";

const KIND_STYLES: Record<YearEventKind, string> = {
  echeance: "bg-rose-700 text-white",
  rappel: "bg-slate-200 text-slate-800",
  "rendez-vous": "bg-sky-100 text-sky-900",
  projet: "bg-muted text-ink",
  evenement: "bg-violet-100 text-violet-900",
  trajet: "bg-amber-100 text-amber-900",
  anniversaire: "bg-pink-100 text-pink-900",
};

const fmtWeekday = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });

function EventRow({ e, now }: { e: YearEvent; now: Date }) {
  return (
    <li>
      <Link href={e.href} className="flex items-center gap-4 rounded-card bg-subtle px-4 py-3 transition hover:bg-muted">
        <span className="w-14 shrink-0 text-center">
          <span className="block text-xl font-bold leading-none text-slate-900">{e.date.getDate()}</span>
          <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{fmtWeekday.format(e.date)}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">{e.label}</span>
          {e.detail || (e.kind === "echeance" && e.source) ? (
            <span className="block truncate text-xs text-slate-500">
              {e.detail}
              {e.kind === "echeance" && e.source ? `${e.detail ? " · " : ""}source : ${e.source}` : ""}
            </span>
          ) : null}
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${KIND_STYLES[e.kind]}`}>{YEAR_EVENT_LABELS[e.kind]}</span>
        <span className="hidden w-24 shrink-0 text-right text-xs font-semibold text-slate-600 sm:block">{relativeLabel(e.date, now)}</span>
      </Link>
    </li>
  );
}

export default async function MonAnnee() {
  const user = await requireRolePage(["membre"]);
  const now = new Date();
  const events = await getYearEvents(user.id, user.birthDate);
  const year = buildYear(events, now);
  const toutes = year.months.flatMap((m) => m.events);
  const nbOfficielles = toutes.filter((e) => e.kind === "echeance").length;

  return (
    <div className="flex flex-col gap-8">
      <SectionTitle
        eyebrow="Mon année à préparer"
        title="Votre année, d’un coup d'œil"
        description="Toutes les dates de votre espace, réunies : échéances de vos parcours, rendez-vous, projets, et votre anniversaire. Rien n’est inventé — chaque date vient d’un parcours, d’un rendez-vous, d’un projet ou de votre profil."
        actions={
          <span className="print:hidden">
            <PrintButton />
          </span>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">{year.total} date{year.total > 1 ? "s" : ""} à préparer</span>
        {nbOfficielles > 0 ? <span>· dont {nbOfficielles} échéance{nbOfficielles > 1 ? "s" : ""} officielle{nbOfficielles > 1 ? "s" : ""}</span> : null}
        <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:block" />
        {(Object.keys(YEAR_EVENT_LABELS) as YearEventKind[]).map((k) => (
          <span key={k} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${KIND_STYLES[k]}`}>
            {YEAR_EVENT_LABELS[k]}
          </span>
        ))}
      </div>

      {year.overdue.length > 0 ? (
        <div className="rounded-card border border-rose-200 bg-rose-50 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-semibold text-rose-900">En retard — à traiter d&apos;abord</h2>
          <p className="mt-1 text-sm text-rose-800">Ces dates sont passées et l&apos;étape n&apos;est pas marquée comme terminée. Les reprendre maintenant vaut presque toujours mieux que les laisser vieillir.</p>
          <ul className="mt-4 space-y-2">
            {year.overdue.map((e, i) => (
              <EventRow key={`retard-${i}`} e={e} now={now} />
            ))}
          </ul>
        </div>
      ) : null}

      {year.total === 0 ? (
        <EmptyState
          title="Votre année est encore vierge"
          description="Dès qu’un parcours pose un rappel, qu’un rendez-vous est demandé ou qu’un projet prend date, tout apparaît ici, mois par mois."
          action={
            <span className="flex flex-wrap justify-center gap-3">
              <Link href="/espace/demarches/nouvelle" className="font-semibold text-ink underline">Commencer un parcours</Link>
              <Link href="/le-monde-aime?onglet=publier" className="font-semibold text-ink underline">Créer un projet</Link>
            </span>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {year.months.map((m) => (
            <section key={m.key} aria-label={m.label}>
              <h2 className="text-base font-bold text-slate-900">{m.label}</h2>
              {m.events.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">Rien de prévu pour l&apos;instant.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {m.events.map((e, i) => (
                    <EventRow key={`${m.key}-${i}`} e={e} now={now} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="rounded-card bg-subtle p-5 text-sm leading-6 text-slate-600">
        <strong className="text-slate-800">Comment lire cette page :</strong> les <strong>échéances officielles</strong> sont les seules dates qui engagent un organisme — leur source est indiquée. Les <strong>rappels personnels</strong> sont les dates que vos parcours ont calculées pour vous aider à avancer : utiles, mais ils n&apos;engagent que vous. Un projet ou un événement passé disparaît de l&apos;année ; une étape de parcours en retard, elle, reste affichée tant qu&apos;elle n&apos;est pas terminée.
      </p>
    </div>
  );
}
