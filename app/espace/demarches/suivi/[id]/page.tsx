import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getJourneyDetail, searchArtists } from "@/lib/journey-queries";
import { Card, SectionTitle, formatDate, formatDateTime } from "@/components/ui";
import { ORGANISM_CATEGORY_LABEL, SITUATION_BY_KEY, TASK_STATUS_LABEL } from "@/lib/situations";
import { AddTask, JourneyStatusButton, OrganizerEngagement, SendToArtist, SummaryEditor, TaskControls } from "@/components/espace/journey-ui";
import { priceLabel } from "@/lib/lma";
import { transmitJourneyToBureau } from "@/lib/actions/journeys";
import { getWeddingWorkspace } from "@/lib/wedding-queries";
import { formatEuro } from "@/lib/wedding";

export const metadata: Metadata = { title: "Suivi de démarche — AIME®" };

export const dynamic = "force-dynamic";

export default async function SuiviDemarche({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string }> }) {
  const id = Number((await params).id);
  const user = (await getCurrentUser())!;
  if (!Number.isSafeInteger(id)) notFound();
  const d = await getJourneyDetail(id, user.id);
  const erreur = (await searchParams).erreur;
  if (!d) notFound();
  const { journey: j, tasks, organisms, project } = d;
  const def = SITUATION_BY_KEY.get(j.situation)!;
  const orderedTasks = j.situation === "mariage"
    ? [...tasks].sort((a, b) => (a.dueAt?.getTime() ?? Number.POSITIVE_INFINITY) - (b.dueAt?.getTime() ?? Number.POSITIVE_INFINITY) || a.sortOrder - b.sortOrder)
    : tasks;
  const actions = orderedTasks.filter((t) => t.kind === "action");
  const pieces = orderedTasks.filter((t) => t.kind === "piece");
  const next = actions.find((t) => !["termine", "effectue_declare"].includes(t.status));
  const orgBySlug = new Map(organisms.map((o) => [o.slug, o]));
  const weddingReception = j.answers.reception === "oui" || (!j.answers.reception && Boolean(j.answers.musique));
  const showArtists = j.status === "en_cours" && (j.situation === "evenement" || (j.situation === "mariage" && weddingReception && ["groupe", "dj"].includes(j.answers.musique ?? "")));
  const artists = showArtists ? await searchArtists(j.situation === "mariage" ? "Musique" : (j.answers.discipline ?? ""), project ? { lat: Number(project.lat), lng: Number(project.lng) } : null, user.id) : [];
  const engagedIds = new Set(d.engagements.filter((e) => !["refusee", "annulee"].includes(e.status)).map((e) => e.artistId));
  const wedding = j.situation === "mariage" && project ? await getWeddingWorkspace(project.id) : null;
  const ser = (x: Date | null) => (x ? x.toISOString() : null);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow={`Mes démarches · ${def.short}`} title={j.title} description={def.description} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/espace/demarches" className="text-sm font-semibold text-ink underline">← Mes démarches</Link>
        <div className="flex flex-wrap gap-3"><a href={`/api/demarches/${j.id}/recapitulatif`} className="rounded-control ring-1 ring-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">Télécharger le récapitulatif</a><JourneyStatusButton journeyId={j.id} status={j.status} /></div>
      </div>
      {j.status === "questionnaire" && <Card><p className="text-sm">Le questionnaire n&apos;est pas terminé. <Link className="font-bold text-ink underline" href={`/espace/demarches/nouvelle?reprendre=${j.id}`}>Reprendre</Link></p></Card>}

      {next && <div className="rounded-card bg-ink p-5 text-white"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">Prochaine action</p><p className="mt-1 text-lg font-semibold">{next.label}</p><p className="text-sm text-white/85">{next.reason}</p></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Étapes à suivre</h2>
            <p className="mt-1 text-xs text-slate-500">« Effectué selon vous » est une déclaration de votre part. Aucune étape ne peut être marquée « transmise » ou « confirmée par l&apos;organisme » : aucune connexion officielle n&apos;existe dans cette version.</p>
            <ol className="mt-4 space-y-4">
              {actions.map((t, i) => (
                <li key={t.id} className="rounded-card ring-1 ring-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2"><p className="font-semibold text-slate-900">{i + 1}. {t.label}</p><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{TASK_STATUS_LABEL[t.status]}</span></div>
                  {t.frameworkFlag === "cadre_a_verifier" && <p className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">Cadre à vérifier</p>}
                  {t.detail && <p className="mt-2 text-sm text-slate-700">{t.detail}</p>}
                  <p className="mt-2 text-xs text-slate-500"><strong>Pourquoi cette étape ?</strong> {t.reason}</p>
                  {t.organismSlugs.length > 0 && <p className="mt-2 text-xs text-slate-600">Interlocuteur(s) : {t.organismSlugs.map((s) => orgBySlug.get(s)?.name ?? s).join(", ")}</p>}
                  {t.officialUrl && <a href={t.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-bold text-ink underline">Ouvrir le site officiel ↗</a>}
                  {t.dueAt && <p className="mt-1 text-xs text-slate-600">{t.dueKind === "officielle" ? `Échéance officielle : ${formatDate(t.dueAt)} (source : ${t.dueSource})` : `Rappel personnel : ${formatDate(t.dueAt)}`}</p>}
                  <TaskControls task={{ id: t.id, status: t.status, dueAt: ser(t.dueAt), dueKind: t.dueKind, documentId: t.documentId, kind: t.kind }} docs={d.myDocs} />
                </li>
              ))}
            </ol>
            <AddTask journeyId={j.id} />
          </Card>

          {(j.situation === "evenement" || (j.situation === "mariage" && (showArtists || d.engagements.length > 0))) && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">{j.situation === "mariage" ? "Engager les musiciens ou le DJ" : "Engager un artiste"}</h2>
              <p className="mt-1 text-xs text-slate-500">Demande envoyée → proposition reçue → devis accepté → contrat signé (déclaré) → embauche déclarée. Chaque étape est distincte ; AIME® n&apos;effectue ni signature, ni paiement, ni déclaration.</p>
              {d.engagements.length > 0 && <div className="mt-4 space-y-3">{d.engagements.map((e) => <OrganizerEngagement key={e.id} artistName={e.artistName} docs={d.myDocs} e={{ id: e.id, status: e.status, proposalMode: e.proposalMode, proposalAmount: e.proposalAmount, proposalFramework: e.proposalFramework, proposalNote: e.proposalNote, requestMessage: e.requestMessage, eventDate: e.eventDate.toISOString() }} />)}</div>}
              {showArtists && (
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-slate-800">Artistes visibles sur la carte {j.answers.discipline && j.answers.discipline !== "autre" ? `· ${j.answers.discipline}` : j.situation === "mariage" ? "· Musique" : ""}</h3>
                  {artists.length === 0 ? <p className="mt-2 text-sm text-slate-600">Aucun artiste visible pour l&apos;instant. <Link href="/le-monde-aime?univers=arts" className="font-semibold text-ink underline">Explorer l&apos;univers Arts sur la carte</Link></p> : (
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {artists.slice(0, 8).map((a) => (
                        <li key={a.id} className={`rounded-card border p-4 ${a.matches ? "ring-line bg-white" : "border-slate-200 bg-slate-50"}`}>
                          <p className="font-semibold text-slate-900">{a.name}{a.isDemo ? <span className="ml-2 text-[10px] font-bold uppercase text-slate-500">fictif</span> : null}</p>
                          <p className="text-xs text-slate-500">{a.disciplines.join(" · ")}{a.distance !== null ? ` · à ~${a.distance} km` : ""}{!a.matches ? " · autre discipline" : ""}</p>
                          {a.presentation && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.presentation}</p>}
                          {a.services.length > 0 && <p className="mt-1 text-xs text-slate-600">{a.services.map((s) => `${s.title} (${priceLabel({ priceMode: s.priceMode, price: s.price, action: "prestation" })})`).join(" · ")}</p>}
                          <div className="mt-2 flex flex-wrap items-center gap-3"><Link href={`/le-monde-aime/personnes/${a.id}`} className="text-xs font-semibold text-ink underline">Voir la fiche</Link>{engagedIds.has(a.id) ? <span className="text-xs font-semibold text-slate-500">Demande en cours</span> : <SendToArtist journeyId={j.id} artistId={a.id} services={a.services.map((s) => ({ id: s.id, title: s.title }))} />}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          )}

          {project && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">Projet et ressources locales</h2>
              <p className="mt-1 text-sm text-slate-600">Le projet <Link className="font-semibold text-ink underline" href={`/le-monde-aime/projets/${project.id}`}>{project.title}</Link> rassemble le programme, les besoins et les contributions confirmées. Les participants y voient l&apos;organisation, jamais votre démarche ni vos documents personnels.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">{[["produits locaux", "terre"], ["mobilier et vaisselle", "terre"], ["décoration", "terre"], ["matériel technique", "arts"], ["transport", "terre"], ["ateliers de transmission", "savoirs"]].map(([t, u]) => <Link key={t} href={`/le-monde-aime?univers=${u}&q=${encodeURIComponent(t.split(" ")[0])}`} className="rounded-full ring-1 ring-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:ring-ink-3">Chercher : {t}</Link>)}</div>
              <p className="mt-2 text-xs text-slate-500">Chaque réservation est acceptée explicitement par son propriétaire ; les quantités et dates sont vérifiées côté serveur.</p>
            </Card>
          )}

          {wedding && project && (
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">Invités et budget, en direct du projet</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-card bg-subtle p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Invités</p>
                  <p className="mt-1 text-sm text-slate-700"><strong>{wedding.guestStats.confirmees} personne(s) confirmée(s)</strong> sur {wedding.guestStats.personnesListees} listées · {wedding.guestStats.enAttente} en attente de réponse{wedding.invitesEstimes > 0 ? ` · estimation de départ : ~${wedding.invitesEstimes}` : ""}</p>
                  <Link href={`/le-monde-aime/projets/${project.id}#invites`} className="mt-2 inline-block text-sm font-semibold text-ink underline">Ouvrir la liste des invités</Link>
                  <p className="mt-2 text-sm text-slate-700">Plan de table : <strong>{wedding.tableStats.placeesPersonnes} personne(s) placée(s)</strong>{wedding.tableStats.aPlacerPersonnes > 0 ? ` · ${wedding.tableStats.aPlacerPersonnes} confirmée(s) restent à placer` : ""}</p>
                  <Link href={`/le-monde-aime/projets/${project.id}#plan-de-table`} className="mt-1 inline-block text-sm font-semibold text-ink underline">Ouvrir le plan de table</Link>
                  <Link href={`/le-monde-aime/projets/${project.id}/jour-j`} className="mt-1 block text-sm font-semibold text-ink underline">La page du jour J à imprimer</Link>
                </div>
                <div className="rounded-card bg-subtle p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Budget</p>
                  <p className="mt-1 text-sm text-slate-700">Estimé <strong>{formatEuro(wedding.budgetStats.estimeCents)}</strong> · devis confirmés {formatEuro(wedding.budgetStats.confirmeCents)} · déjà réglé {formatEuro(wedding.budgetStats.regleCents)}{wedding.budgetStats.enveloppeCents !== null ? ` · enveloppe ${formatEuro(wedding.budgetStats.enveloppeCents)}` : ""}</p>
                  {wedding.budgetStats.depasseEnveloppe && <p className="mt-1 text-xs font-semibold text-rose-700">L&apos;estimé dépasse l&apos;enveloppe : c&apos;est le moment d&apos;arbitrer, poste par poste.</p>}
                  <Link href={`/le-monde-aime/projets/${project.id}#budget`} className="mt-2 inline-block text-sm font-semibold text-ink underline">Ouvrir le suivi de budget</Link>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Ces compteurs vivent dans le projet partagé : votre conjoint·e et vos témoins organisateurs y notent les réponses et les devis au même endroit que vous.</p>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card><h2 className="text-lg font-semibold text-slate-900">Ma situation</h2><div className="mt-3"><SummaryEditor journeyId={j.id} summary={j.summary} /></div></Card>
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Transmettre à mon bureau</h2>
            {erreur && <p role="alert" className="mt-2 rounded-control bg-rose-50 px-3 py-2 text-sm text-rose-700">{erreur}</p>}
            {d.linkedCase ? (
              <div className="mt-2 text-sm text-slate-700">
                <p><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink">Transmis à votre bureau</span></p>
                <p className="mt-2">Ce parcours est devenu le dossier <strong>{d.linkedCase.reference}</strong>{d.linkedCase.submittedAt ? `, transmis le ${formatDate(d.linkedCase.submittedAt)}` : ""}. Votre bureau y reprend vos étapes et vos pièces, et vous y répond.</p>
                <Link href={`/espace/demarches/${d.linkedCase.id}`} className="mt-3 inline-block rounded-control bg-ink px-3 py-2 text-xs font-bold text-white">Ouvrir le dossier</Link>
                <p className="mt-2 text-xs text-slate-500">Ce parcours reste consultable ici, en lecture : le suivi se poursuit dans le dossier, sans rien ressaisir.</p>
              </div>
            ) : j.status === "questionnaire" ? (
              <p className="mt-2 text-sm text-slate-600">Terminez le questionnaire pour pouvoir transmettre ce parcours à votre bureau d&apos;accompagnement.</p>
            ) : (
              <div className="mt-2 text-sm text-slate-700">
                <p>Vous préférez être accompagné ? Transmettez ce parcours à votre bureau : il <strong>devient un dossier</strong> qui reprend vos étapes et vos pièces reliées. L&apos;équipe vous répond dans le dossier — inutile de recommencer votre histoire. Dans cette version, l&apos;équipe est simulée, aucun organisme réel n&apos;est destinataire.</p>
                <form action={transmitJourneyToBureau} className="mt-3">
                  <input type="hidden" name="journeyId" value={j.id} />
                  <button type="submit" className="rounded-control bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-ink-2">Transmettre à mon bureau</button>
                </form>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Pièces à préparer</h2>
            {pieces.length === 0 ? <p className="mt-2 text-sm text-slate-600">Aucune pièce identifiée.</p> : <ul className="mt-3 space-y-3">{pieces.map((t) => <li key={t.id} className="rounded-control bg-subtle p-3 text-sm"><p className="font-semibold">{t.label}</p><p className="text-xs text-slate-500">{t.reason}</p><TaskControls task={{ id: t.id, status: t.status, dueAt: ser(t.dueAt), dueKind: t.dueKind, documentId: t.documentId, kind: t.kind }} docs={d.myDocs} /></li>)}</ul>}
            <p className="mt-3 text-xs text-slate-500">Relier un document le garde privé. Pour en déposer un nouveau : <Link href="/espace/documents" className="underline">Mes documents</Link>.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Organismes utiles</h2>
            {organisms.length === 0 ? <p className="mt-2 text-sm text-slate-600">—</p> : <ul className="mt-3 space-y-3 text-sm">{organisms.map((o) => <li key={o.id}><a href={o.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline">{o.name} ↗</a><p className="text-xs text-slate-600">{o.role}</p><p className="text-[11px] text-slate-400">{ORGANISM_CATEGORY_LABEL[o.category]} · {o.contentStatus === "verifie" ? `vérifié le ${formatDate(o.verifiedAt!)}` : o.linkStatus === "verifie" ? `lien vérifié le ${formatDate(o.verifiedAt!)} · description à confirmer` : "à vérifier"} · organisme externe, non partenaire</p></li>)}</ul>}
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Historique</h2>
            <ol className="mt-3 space-y-3 border-l-2 ring-line-soft pl-4 text-sm">{d.events.map((e) => <li key={e.id}><p className="text-slate-700">{e.message}</p><p className="text-xs text-slate-400">{formatDateTime(e.createdAt)}</p></li>)}</ol>
            <p className="mt-3 text-[11px] text-slate-400">Règles d&apos;orientation version {j.rulesVersion || "—"}.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
