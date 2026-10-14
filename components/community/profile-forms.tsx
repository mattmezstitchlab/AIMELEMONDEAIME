"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveArtistProfile, updateMyProfile, type ProfileResult } from "@/lib/actions/profile";
import { PrimaryButton } from "@/components/ui";
import { ARTIST_DISCIPLINES, UNIVERSES } from "@/lib/lma";
import { pointSummary, splitCommuneLabel } from "@/lib/point";

const input = "mt-1 w-full rounded-control ring-1 ring-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-4";
const label = "block text-sm font-semibold text-ink-2";
type Fb = { ok: boolean; text: string } | null;
const Note = ({ value }: { value: Fb }) => value ? <p role={value.ok ? "status" : "alert"} className={`rounded-control px-3 py-2 text-sm ${value.ok ? "bg-muted text-ink" : "bg-canvas text-ink ring-1 ring-ink"}`}>{value.text}</p> : null;

function useSave(action: (f: FormData) => Promise<ProfileResult>) {
  const [fb, setFb] = useState<Fb>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const submit = (e: FormEvent<HTMLFormElement>, extra?: (f: FormData) => void) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    extra?.(f);
    start(async () => { const r = await action(f); setFb({ ok: r.ok, text: r.ok ? r.message : r.error }); if (r.ok) router.refresh(); });
  };
  return { fb, pending, submit };
}

export type ProfileData = {
  displayName: string; bio: string; activities: string; interests: string; universes: string[]; offersText: string; needsText: string; transmitText: string;
  availabilityNote: string; travelRadiusKm: number; profileVisible: boolean; profileCity: string; lat: number | null; lng: number | null; hasPhoto: boolean; userId: number;
};

export function ProfileForm({ data }: { data: ProfileData }) {
  const { fb, pending, submit } = useSave(updateMyProfile);
  const [universes, setUniverses] = useState<string[]>(data.universes);
  const savedPlace = splitCommuneLabel(data.profileCity);
  const [commune, setCommune] = useState(savedPlace.commune);
  const [postal, setPostal] = useState(savedPlace.postalCode);
  const summary = pointSummary(commune, postal);
  return (
    <form onSubmit={(e) => submit(e)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
        <div className="flex flex-col items-center gap-2">
          {data.hasPhoto ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- photo d’API dynamique, dimensions inconnues */}
              <img src={`/api/profil/${data.userId}/photo`} alt="Votre photo" className="h-24 w-24 rounded-full object-cover" />
            </>
          ) : <span className="grid h-24 w-24 place-items-center rounded-full bg-muted text-3xl font-bold text-ink" aria-hidden="true">{(data.displayName || "?").slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="grid gap-4">
          <div><label className={label} htmlFor="pf-name">Nom d&apos;affichage</label><input id="pf-name" name="displayName" defaultValue={data.displayName} maxLength={80} placeholder="Le nom que les autres verront" className={input} /></div>
          <div><label className={label} htmlFor="pf-photo">Photo (facultative · 2 Mo)</label><input id="pf-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={input} /></div>
        </div>
      </div>
      <div><label className={label} htmlFor="pf-bio">Présentation</label><textarea id="pf-bio" name="bio" defaultValue={data.bio} rows={3} maxLength={600} placeholder="Qui êtes-vous, qu’aimez-vous faire ?" className={input} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label} htmlFor="pf-act">Activités et compétences</label><input id="pf-act" name="activities" defaultValue={data.activities} placeholder="Agriculteur, musicien, parent, bénévole…" className={input} /><p className="mt-1 text-xs text-ink-3">Séparées par des virgules. Vous pouvez en cumuler autant que vous voulez.</p></div>
        <div><label className={label} htmlFor="pf-int">Centres d&apos;intérêt</label><input id="pf-int" name="interests" defaultValue={data.interests} placeholder="Jardinage, chorale, cuisine…" className={input} /></div>
      </div>
      <fieldset><legend className="mb-1 text-sm font-semibold text-ink-2">Univers qui vous parlent</legend><div className="flex flex-wrap gap-2">{UNIVERSES.map((u) => { const on = universes.includes(u.key); return <label key={u.key} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold ${on ? "ring-ink bg-ink text-canvas" : "bg-canvas text-ink-2 ring-1 ring-line"}`}><input type="checkbox" name="universes" value={u.key} checked={on} onChange={() => setUniverses((p) => (p.includes(u.key) ? p.filter((k) => k !== u.key) : [...p, u.key]))} className="sr-only" />{u.label}</label>; })}</div></fieldset>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className={label} htmlFor="pf-off">Je propose</label><input id="pf-off" name="offersText" defaultValue={data.offersText} maxLength={300} className={input} placeholder="Légumes, concerts…" /></div>
        <div><label className={label} htmlFor="pf-need">Je recherche</label><input id="pf-need" name="needsText" defaultValue={data.needsText} maxLength={300} className={input} placeholder="Un lieu de répétition…" /></div>
        <div><label className={label} htmlFor="pf-trans">Je souhaite transmettre</label><input id="pf-trans" name="transmitText" defaultValue={data.transmitText} maxLength={300} className={input} placeholder="La couture, le greffage…" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className={label} htmlFor="pf-city">Commune</label><input id="pf-city" name="profileCity" value={commune} onChange={(e) => setCommune(e.target.value)} maxLength={100} className={input} /></div>
        <div><label className={label} htmlFor="pf-postal">Code postal</label><input id="pf-postal" name="postalCode" value={postal} onChange={(e) => setPostal(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={5} className={input} /></div>
        <div><label className={label} htmlFor="pf-radius">Zone de déplacement (km)</label><input id="pf-radius" name="travelRadiusKm" type="number" min={0} max={300} defaultValue={data.travelRadiusKm} className={input} /></div>
        <div><label className={label} htmlFor="pf-avail">Disponibilités utiles</label><input id="pf-avail" name="availabilityNote" defaultValue={data.availabilityNote} maxLength={300} placeholder="Week-ends, soirées…" className={input} /></div>
      </div>
      <div className="rounded-card bg-muted p-4">
        <p className="text-sm font-semibold text-ink-2">Votre position approximative</p>
        <p className="mt-1 text-xs text-ink-3" aria-live="polite">{summary ?? "La commune et son code postal suffisent : le point est déduit automatiquement, sans adresse."}</p>
      </div>
      <label className="flex items-start gap-3 rounded-card ring-1 ring-line p-4 text-sm">
        <input type="checkbox" name="profileVisible" defaultChecked={data.profileVisible} className="mt-1 h-4 w-4 accent-ink" />
        <span><strong className="text-ink">Apparaître dans l&apos;annuaire public</strong><br /><span className="text-ink-2">Votre nom d&apos;affichage, votre présentation et votre commune deviennent visibles. Décochez pour rester discret : vous pourrez toujours publier et échanger.</span></span>
      </label>
      <Note value={fb} /><PrimaryButton type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer mon profil"}</PrimaryButton>
    </form>
  );
}

export type ArtistData = { disciplines: string[]; presentation: string; zoneNote: string; availabilityNote: string; techSheet: string };

export function ArtistForm({ data }: { data: ArtistData }) {
  const { fb, pending, submit } = useSave(saveArtistProfile);
  const [chosen, setChosen] = useState<string[]>(data.disciplines.filter((d) => ARTIST_DISCIPLINES.includes(d)));
  const others = data.disciplines.filter((d) => !ARTIST_DISCIPLINES.includes(d)).join(", ");
  return (
    <form onSubmit={(e) => submit(e)} className="space-y-5">
      <fieldset><legend className="mb-1 text-sm font-semibold text-ink-2">Disciplines</legend><div className="flex flex-wrap gap-2">{ARTIST_DISCIPLINES.map((d) => { const on = chosen.includes(d); return <label key={d} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold ${on ? "ring-ink bg-ink text-canvas" : "bg-canvas text-ink-2 ring-1 ring-line"}`}><input type="checkbox" name="disciplines" value={d} checked={on} onChange={() => setChosen((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))} className="sr-only" />{d}</label>; })}</div></fieldset>
      <div><label className={label} htmlFor="ar-other">Autres disciplines</label><input id="ar-other" name="otherDisciplines" defaultValue={others} maxLength={120} className={input} placeholder="Séparées par des virgules" /></div>
      <div><label className={label} htmlFor="ar-pres">Présentation artistique</label><textarea id="ar-pres" name="presentation" defaultValue={data.presentation} rows={4} maxLength={800} className={input} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label} htmlFor="ar-zone">Zone de déplacement</label><input id="ar-zone" name="zoneNote" defaultValue={data.zoneNote} maxLength={200} placeholder="Ex. Eure-et-Loir et départements voisins" className={input} /></div>
        <div><label className={label} htmlFor="ar-avail">Disponibilités</label><input id="ar-avail" name="availabilityNote" defaultValue={data.availabilityNote} maxLength={300} placeholder="Ex. week-ends, été" className={input} /></div>
      </div>
      <div><label className={label} htmlFor="ar-tech">Fiche technique</label><textarea id="ar-tech" name="techSheet" defaultValue={data.techSheet} rows={6} maxLength={4000} className={input} placeholder="Besoins en son, lumière, espace, électricité, durée, temps d’installation…" /><p className="mt-1 text-xs text-ink-3">Texte libre. Vos prestations (avec tarif indicatif ou « Sur devis ») se publient avec le bouton « Publier » → Proposition → « Je propose une prestation ».</p></div>
      <Note value={fb} /><PrimaryButton type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer mon espace artiste"}</PrimaryButton>
    </form>
  );
}

import { decideCommunityRequest } from "@/lib/actions/community";

/** Réponse rapide à une demande de prestation (la conversation complète reste dans « Mes liens »). */
export function ArtistRequestActions({ requestId, status }: { requestId: number; status: string }) {
  const [fb, setFb] = useState<Fb>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (status !== "demandee") return null;
  const go = (decision: "accepter" | "refuser") => start(async () => { const r = await decideCommunityRequest(requestId, decision); setFb({ ok: r.ok, text: r.ok ? r.message : r.error }); if (r.ok) router.refresh(); });
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <PrimaryButton type="button" disabled={pending} onClick={() => go("accepter")} className="!px-3 !py-1.5 text-xs">Accepter</PrimaryButton>
      <button type="button" disabled={pending} onClick={() => go("refuser")} className="rounded-full ring-1 ring-line px-3 py-1.5 text-xs font-semibold text-ink-2">Refuser</button>
      <Note value={fb} />
    </div>
  );
}
