import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public-shell";
import { getPersonProfile } from "@/lib/lma-queries";
import { ACTION_LABELS } from "@/lib/lma";

export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();
  const p = await getPersonProfile(id);
  if (!p) notFound();
  return (
    <PublicPage solidHeader lma>
      <div className="bg-[#fafaf9]">
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
          <Link href="/le-monde-aime" className="text-sm font-semibold text-emerald-800 underline">← Retour à la carte</Link>
          <header className="flex flex-wrap items-center gap-5 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            {p.hasPhoto ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/profil/${p.id}/photo`} alt="" className="h-24 w-24 rounded-full object-cover" /> : <span className="grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-3xl font-bold text-emerald-800" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>}
            <div>
              {p.isDemo && <span className="mb-1 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">Profil fictif</span>}
              <h1 className="text-3xl font-bold text-slate-900">{p.name}</h1>
              <p className="text-sm text-slate-500">{p.city ?? "France"} · zone d&apos;environ {p.travelRadiusKm} km · position approximative</p>
              <div className="mt-2 flex flex-wrap gap-2">{p.activities.map((a) => <span key={a} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{a}</span>)}</div>
            </div>
          </header>
          <section className="space-y-3 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm text-sm text-slate-700">
            {p.bio && <p>{p.bio}</p>}
            {p.offersText && <p><strong>Propose :</strong> {p.offersText}</p>}
            {p.needsText && <p><strong>Recherche :</strong> {p.needsText}</p>}
            {p.transmitText && <p><strong>Souhaite transmettre :</strong> {p.transmitText}</p>}
            {p.availabilityNote && <p><strong>Disponibilités :</strong> {p.availabilityNote}</p>}
            {p.interests.length > 0 && <p><strong>Centres d&apos;intérêt :</strong> {p.interests.join(", ")}</p>}
          </section>
          {p.artist && (
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm text-sm text-slate-700">
              <h2 className="text-lg font-bold text-slate-900">Espace artiste</h2>
              <p className="mt-1 font-semibold">{p.artist.disciplines.join(" · ")}</p>
              {p.artist.presentation && <p className="mt-2">{p.artist.presentation}</p>}
              {p.artist.zoneNote && <p className="mt-2"><strong>Zone :</strong> {p.artist.zoneNote}</p>}
              {p.artist.availabilityNote && <p><strong>Disponibilités :</strong> {p.artist.availabilityNote}</p>}
              {p.artist.techSheet && <details className="mt-2"><summary className="cursor-pointer font-semibold text-emerald-800">Fiche technique</summary><p className="mt-2 whitespace-pre-line">{p.artist.techSheet}</p></details>}
            </section>
          )}
          <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Ses propositions et besoins</h2>
            {p.listings.length === 0 ? <p className="mt-2 text-sm text-slate-600">Rien de publié pour l&apos;instant.</p> : <ul className="mt-3 space-y-2">{p.listings.map((l) => <li key={l.id} className="rounded-lg bg-slate-50 p-3 text-sm"><strong>{l.title}</strong> · {ACTION_LABELS[l.action] ?? l.action} · {l.city}{l.isDemo ? " · exemple fictif" : ""}</li>)}</ul>}
            <p className="mt-4 text-xs text-slate-500">Pour contacter cette personne, faites une demande depuis l&apos;une de ses annonces : l&apos;échange reste privé entre vous, et rien n&apos;est réservé sans son accord.</p>
          </section>
        </div>
      </div>
    </PublicPage>
  );
}
