import Link from "next/link";
import type { Metadata } from "next";
import { requireRolePage } from "@/lib/auth";
import { getOverview } from "@/lib/journey-queries";
import { getAllNotifications } from "@/lib/queries";
import { Card, SectionTitle, EmptyState, formatDate } from "@/components/ui";
import { Icon } from "@/components/icon";
import { SITUATIONS, TASK_STATUS_LABEL } from "@/lib/situations";
import { NotificationList } from "./notification-list";
import { OrientationEntry } from "@/components/orientation-entry";

export const metadata: Metadata = { title: "Mon espace — AIME®" };

export const dynamic = "force-dynamic";

export default async function Apercu() {
  const user = await requireRolePage(["membre"]);
  const o = await getOverview(user.id);
  const notifs = (await getAllNotifications(user.id)).slice(0, 5);
  const next = o.active.find((j) => j.next) ?? null;
  const toAnswer = o.engagementsToAnswer.length + o.incomingRequests.length + o.casesToComplete.length;
  return (
    <div className="flex flex-col gap-8">
      <SectionTitle eyebrow="Mon aperçu" title={`Bonjour ${(user.displayName ?? user.fullName).split(" ")[0]}`} description="Vous expliquez votre situation. AIME® vous aide à trouver les personnes, les ressources et les démarches pour avancer." />

      {next?.next ? (
        <Link
          href={`/espace/demarches/suivi/${next.id}`}
          className="group flex items-center gap-5 rounded-card bg-ink p-6 text-canvas transition hover:bg-ink-2"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-canvas/10">
            <Icon name="arrow" className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="eyebrow text-canvas/60">Prochaine action · {next.title}</span>
            <span className="mt-2 block text-lg text-canvas">{next.next.label}</span>
            <span className="block text-sm text-canvas/65">{TASK_STATUS_LABEL[next.next.status]}</span>
          </span>
          <Icon name="arrow" className="h-4 w-4 shrink-0 text-canvas/60 transition group-hover:translate-x-1" />
        </Link>
      ) : null}

      <section aria-labelledby="besoin" className="space-y-4">
        <div>
          <h2 id="besoin" className="text-2xl text-ink">De quoi avez-vous besoin aujourd&apos;hui ?</h2>
          <p className="mt-1.5 text-sm text-ink-3">Décrivez votre besoin : nous proposons un parcours, vous gardez le choix.</p>
        </div>
        <OrientationEntry />
        <details className="panel p-5">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-medium text-ink-2 [&::-webkit-details-marker]:hidden">
            <Icon name="chevron" className="h-4 w-4" />
            Parcourir les {SITUATIONS.length} situations proposées
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {SITUATIONS.map((s) => (
              <Link key={s.key} href={`/espace/demarches/nouvelle?situation=${s.key}`} className="group flex items-start gap-3 rounded-control bg-subtle p-4 ring-1 ring-line transition hover:bg-canvas hover:shadow-rested">
                <Icon name={s.icon} className="h-5 w-5 shrink-0 text-ink-3" />
                <span>
                  <span className="block text-sm font-medium text-ink">{s.label}</span>
                  <span className="text-xs text-ink-4">{s.pilot ? "Parcours complet" : "Orientation et préparation"}</span>
                </span>
              </Link>
            ))}
          </div>
        </details>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-lg text-ink">Démarches en cours</h2>
          {o.active.length + o.drafts.length === 0 ? <div className="mt-4"><EmptyState title="Aucune démarche en cours" description="Choisissez une situation ci-dessus pour commencer." /></div> : (
            <ul className="mt-4 space-y-3">
              {o.drafts.map((j) => (
                <li key={j.id}>
                  <Link href={`/espace/demarches/nouvelle?reprendre=${j.id}`} className="flex items-center justify-between gap-3 rounded-control bg-state-warning-soft px-4 py-3 text-sm ring-1 ring-state-warning-line transition hover:brightness-[0.99]">
                    <span className="text-state-warning"><strong className="font-medium">{j.title}</strong> · questionnaire à terminer</span>
                    <span className="shrink-0 font-medium text-state-warning">Reprendre</span>
                  </Link>
                </li>
              ))}
              {o.active.map((j) => (
                <li key={j.id}>
                  <Link href={`/espace/demarches/suivi/${j.id}`} className="flex items-center justify-between gap-3 rounded-control px-4 py-3 text-sm ring-1 ring-line transition hover:bg-subtle">
                    <span className="min-w-0">
                      <span className="font-medium text-ink">{j.title}</span>
                      <span className="block text-xs text-ink-4">{j.done}/{j.total} étapes · prochaine : {j.next?.label ?? "—"}</span>
                    </span>
                    <Icon name="arrow" className="h-4 w-4 shrink-0 text-ink-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-lg text-ink">À traiter</h2>
          {toAnswer === 0 ? <p className="mt-3 text-sm text-ink-3">Aucune demande ne nécessite votre réponse.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {o.engagementsToAnswer.map((e) => <li key={`e${e.id}`}><Link className="font-medium text-ink underline underline-offset-4" href={e.artistId === user.id ? "/le-monde-aime/artiste" : `/espace/demarches/suivi/${e.journeyId}`}>{e.artistId === user.id ? "Une demande d’engagement artistique attend votre proposition" : "Une proposition d’artiste attend votre réponse"}</Link></li>)}
              {o.incomingRequests.map((r) => <li key={`r${r.id}`}><Link className="font-medium text-ink underline underline-offset-4" href="/espace/echanges">Demande reçue : {r.title}</Link></li>)}
              {o.casesToComplete.map((c) => <li key={`c${c.id}`}><Link className="font-medium text-ink underline underline-offset-4" href={`/espace/demarches/${c.id}`}>Pièce attendue — {c.title} ({c.reference})</Link></li>)}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg text-ink">Échéances proches</h2>
          <p className="mt-3 text-sm"><Link href="/espace/annee" className="font-medium text-ink underline underline-offset-4">Voir mon année à préparer →</Link></p>
          {o.dueTasks.length === 0 ? <p className="mt-3 text-sm text-ink-3">Aucune échéance dans les 3 prochaines semaines.</p> : (
            <ul className="mt-3 space-y-2 text-sm">{o.dueTasks.slice(0, 6).map((t) => <li key={t.id} className="rounded-control bg-subtle px-3 py-2 text-ink-2"><strong>{formatDate(t.dueAt!)}</strong> · {t.label}<span className="block text-xs text-ink-4">{t.dueKind === "officielle" ? `Échéance officielle — source : ${t.dueSource}` : "Rappel personnel"}</span></li>)}</ul>
          )}
        </Card>
        <Card>
          <h2 className="text-lg text-ink">Mes projets</h2>
          {o.myProjects.length === 0 ? <p className="mt-3 text-sm text-ink-3">Aucun projet. <Link href="/le-monde-aime?onglet=publier" className="font-medium text-ink underline underline-offset-4">Créer un projet</Link></p> : <ul className="mt-3 space-y-2 text-sm">{o.myProjects.slice(0, 5).map((p) => <li key={p.id}><Link href={`/le-monde-aime/projets/${p.id}`} className="font-medium text-ink underline underline-offset-4">{p.title}</Link><span className="block text-xs text-ink-4">{p.city} · {formatDate(p.startsAt)} · {p.role === "organisateur" ? "organisateur" : "participant"}</span></li>)}</ul>}
        </Card>
        <Card>
          <h2 className="text-lg text-ink">Notifications</h2>
          <NotificationList items={notifs.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, isRead: n.isRead }))} />
        </Card>
      </div>
    </div>
  );
}
