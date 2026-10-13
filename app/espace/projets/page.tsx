import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMyLinks } from "@/lib/lma-queries";
import { Card, SectionTitle, EmptyState, LinkButton, formatDate } from "@/components/ui";
import { Icon } from "@/components/icon";
import { CreateCircleForm, InviteResponses } from "@/components/community/circle-panels";

export const dynamic = "force-dynamic";

export default async function MesProjets() {
  const user = (await getCurrentUser())!;
  const links = await getMyLinks(user.id);
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle image="/images/hero-famille.jpg" eyebrow="Mes projets" title="Événements, activités et projets partagés" description="Un projet existe une seule fois : vous le retrouvez ici, sur la carte et dans vos démarches."
        actions={<LinkButton href="/le-monde-aime?onglet=publier"><Icon name="filePlus" className="h-4 w-4" /> Créer un projet</LinkButton>} />
      <InviteResponses invites={links.invites.map((i) => ({ id: i.id, name: i.name, kind: i.kind }))} />
      {links.projects.length === 0 ? <EmptyState title="Aucun projet" description="Créez un projet ou rejoignez-en un depuis la carte." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {links.projects.map((p) => (
            <Link key={p.id} href={`/le-monde-aime/projets/${p.id}`}>
              <Card className="h-full hover:border-emerald-300">
                <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-rose-50 px-2.5 py-1 font-bold text-rose-800">{p.role === "organisateur" ? "Organisateur" : "Participant"}</span>{p.memberStatus === "demande" && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-800">Demande en attente</span>}{p.pendingRequests > 0 && <span className="rounded-full bg-emerald-800 px-2.5 py-1 font-bold text-white">{p.pendingRequests} à traiter</span>}{p.isDemo && <span className="font-bold uppercase text-slate-500">fictif</span>}</div>
                <p className="mt-2 text-lg font-bold text-slate-900">{p.title}</p><p className="text-sm text-slate-500">{p.city} · {formatDate(p.startsAt)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <section>
        <h2 className="text-lg font-bold text-slate-900">Mes cercles privés</h2>
        <p className="text-sm text-slate-600">Famille, association ou groupe local, sur invitation acceptée. Être membre d&apos;un cercle ne donne aucun accès à vos démarches ni à vos documents.</p>
        {links.circles.length > 0 && <div className="mt-3 grid gap-3 md:grid-cols-2">{links.circles.map((c) => <Link key={c.id} href={`/le-monde-aime/cercles/${c.id}`}><Card className="hover:border-emerald-300"><p className="text-xs font-bold text-slate-500"><Icon name="lock" className="mr-1 inline h-3 w-3" />Privé{c.isDemo ? " · fictif" : ""}</p><p className="mt-1 font-bold text-slate-900">{c.name}</p></Card></Link>)}</div>}
        <div className="mt-4"><CreateCircleForm /></div>
      </section>
    </div>
  );
}
