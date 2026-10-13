import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOverview } from "@/lib/journey-queries";
import { getAllNotifications } from "@/lib/queries";
import { Card, SectionTitle, EmptyState, formatDate } from "@/components/ui";
import { Icon } from "@/components/icon";
import { SITUATIONS, TASK_STATUS_LABEL } from "@/lib/situations";
import { NotificationList } from "./notification-list";
import { OrientationEntry } from "@/components/orientation-entry";

export const dynamic = "force-dynamic";

export default async function Apercu() {
  const user = (await getCurrentUser())!;
  const o = await getOverview(user.id);
  const notifs = (await getAllNotifications(user.id)).slice(0, 5);
  const next = o.active.find((j) => j.next) ?? null;
  const toAnswer = o.engagementsToAnswer.length + o.incomingRequests.length + o.casesToComplete.length;
  return (
    <div className="flex flex-col gap-8">
      <SectionTitle image="/images/hero-espace.jpg" eyebrow="Mon aperçu" title={`Bonjour ${(user.displayName ?? user.fullName).split(" ")[0]}`} description="Vous expliquez votre situation. AIME® vous aide à trouver les personnes, les ressources et les démarches pour avancer." />

      {next?.next ? (
        <Link href={`/espace/demarches/suivi/${next.id}`} className="group flex items-center gap-4 rounded-2xl bg-emerald-800 p-6 text-white shadow-sm hover:bg-emerald-900">
          <Icon name="arrow" className="h-8 w-8 shrink-0" />
          <div className="flex-1"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">Prochaine action · {next.title}</p><p className="mt-1 text-lg font-semibold">{next.next.label}</p><p className="text-sm text-white/80">{TASK_STATUS_LABEL[next.next.status]}</p></div>
        </Link>
      ) : null}

      <section aria-labelledby="besoin" className="space-y-4">
        <div>
          <h2 id="besoin" className="text-2xl font-bold text-[#1d1d1f]">De quoi avez-vous besoin aujourd&apos;hui ?</h2>
          <p className="mt-1 text-sm text-slate-600">Décrivez votre besoin : nous proposons un parcours, vous gardez le choix.</p>
        </div>
        <OrientationEntry />
        <details className="rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="min-h-10 cursor-pointer text-sm font-bold text-slate-800 focus-visible:outline-offset-2">Parcourir les {SITUATIONS.length} situations proposées</summary>
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {SITUATIONS.map((s) => (
              <Link key={s.key} href={`/espace/demarches/nouvelle?situation=${s.key}`} className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-[#fafaf9] p-4 hover:border-slate-400">
                <Icon name={s.icon} className="h-6 w-6 shrink-0 text-slate-700" />
                <span><span className="block text-sm font-semibold text-slate-900">{s.label}</span><span className="text-xs text-slate-600">{s.pilot ? "Parcours complet" : "Orientation et préparation"}</span></span>
              </Link>
            ))}
          </div>
        </details>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Démarches en cours</h2>
          {o.active.length + o.drafts.length === 0 ? <div className="mt-4"><EmptyState title="Aucune démarche en cours" description="Choisissez une situation ci-dessus pour commencer." /></div> : (
            <ul className="mt-4 space-y-3">
              {o.drafts.map((j) => <li key={j.id}><Link href={`/espace/demarches/nouvelle?reprendre=${j.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm"><span><strong>{j.title}</strong> · questionnaire à terminer</span><span className="font-bold text-emerald-800">Reprendre →</span></Link></li>)}
              {o.active.map((j) => <li key={j.id}><Link href={`/espace/demarches/suivi/${j.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#fafaf9] px-4 py-3 text-sm hover:bg-emerald-50"><span><strong>{j.title}</strong><span className="block text-xs text-slate-500">{j.done}/{j.total} étapes · prochaine : {j.next?.label ?? "—"}</span></span><Icon name="arrow" className="h-4 w-4 text-emerald-700" /></Link></li>)}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">À traiter</h2>
          {toAnswer === 0 ? <p className="mt-3 text-sm text-slate-600">Aucune demande ne nécessite votre réponse.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {o.engagementsToAnswer.map((e) => <li key={`e${e.id}`}><Link className="font-semibold text-emerald-800 underline" href={e.artistId === user.id ? "/le-monde-aime/artiste" : `/espace/demarches/suivi/${e.journeyId}`}>{e.artistId === user.id ? "Une demande d'engagement artistique attend votre proposition" : "Une proposition d'artiste attend votre réponse"}</Link></li>)}
              {o.incomingRequests.map((r) => <li key={`r${r.id}`}><Link className="font-semibold text-emerald-800 underline" href="/espace/echanges">Demande reçue : {r.title}</Link></li>)}
              {o.casesToComplete.map((c) => <li key={`c${c.id}`}><Link className="font-semibold text-emerald-800 underline" href={`/espace/demarches/${c.id}`}>Pièce attendue — {c.title} ({c.reference})</Link></li>)}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Échéances proches</h2>
          {o.dueTasks.length === 0 ? <p className="mt-3 text-sm text-slate-600">Aucune échéance dans les 3 prochaines semaines.</p> : (
            <ul className="mt-3 space-y-2 text-sm">{o.dueTasks.slice(0, 6).map((t) => <li key={t.id} className="rounded-lg bg-[#fafaf9] px-3 py-2"><strong>{formatDate(t.dueAt!)}</strong> · {t.label}<span className="block text-xs text-slate-500">{t.dueKind === "officielle" ? `Échéance officielle — source : ${t.dueSource}` : "Rappel personnel"}</span></li>)}</ul>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Mes projets</h2>
          {o.myProjects.length === 0 ? <p className="mt-3 text-sm text-slate-600">Aucun projet. <Link href="/le-monde-aime?onglet=publier" className="font-semibold text-emerald-800 underline">Créer un projet</Link></p> : <ul className="mt-3 space-y-2 text-sm">{o.myProjects.slice(0, 5).map((p) => <li key={p.id}><Link href={`/le-monde-aime/projets/${p.id}`} className="font-semibold text-emerald-800 underline">{p.title}</Link><span className="block text-xs text-slate-500">{p.city} · {formatDate(p.startsAt)} · {p.role === "organisateur" ? "organisateur" : "participant"}</span></li>)}</ul>}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          <NotificationList items={notifs.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, isRead: n.isRead }))} />
        </Card>
      </div>
    </div>
  );
}
