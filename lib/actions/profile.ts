"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artistProfiles, profilePhotos, users, universeEnum } from "@/db/schema";
import { AuthError, requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { IMAGE_TYPES, readUpload } from "@/lib/uploads";
import { splitList } from "@/lib/lma";
import { communeLabel, pointFromCommune, splitCommuneLabel } from "@/lib/point";

export type ProfileResult = { ok: true; message: string } | { ok: false; error: string };

const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
};
const fail = (error: unknown, fallback: string): ProfileResult =>
  error instanceof AuthError ? { ok: false, error: "Connectez-vous avec un compte membre." } : { ok: false, error: fallback };

/** Profil multiactivité : tous les champs sont facultatifs et se complètent progressivement. */
export async function updateMyProfile(form: FormData): Promise<ProfileResult> {
  try {
    const user = await requireRole(["membre"]);
    const displayName = str(form, "displayName").slice(0, 80);
    const bio = str(form, "bio").slice(0, 600);
    const city = str(form, "profileCity").slice(0, 100);
    const postalCode = str(form, "postalCode");
    const explicitLat = Number(str(form, "profileLat"));
    const explicitLng = Number(str(form, "profileLng"));
    const radius = Math.round(Number(str(form, "travelRadiusKm") || 20));
    const explicitPoint = str(form, "profileLat") !== "" && Number.isFinite(explicitLat) && Number.isFinite(explicitLng)
      && explicitLat >= 41 && explicitLat <= 51.5 && explicitLng >= -5.5 && explicitLng <= 9.8;
    const cityParts = splitCommuneLabel(city);
    const derived = pointFromCommune(cityParts.commune, postalCode || cityParts.postalCode);
    const point = explicitPoint ? { lat: explicitLat, lng: explicitLng } : derived;
    const hasPoint = point !== null;
    if (!Number.isInteger(radius) || radius < 0 || radius > 300) return { ok: false, error: "La zone de déplacement doit être comprise entre 0 et 300 km." };
    const visible = form.get("profileVisible") === "on";
    if (visible && !hasPoint && user.profileLat === null) return { ok: false, error: "Pour apparaître dans l'annuaire, indiquez votre commune et son code postal." };
    if (visible && displayName.length < 2) return { ok: false, error: "Indiquez un nom d'affichage pour apparaître dans l'annuaire." };
    const universes = form.getAll("universes").map(String).filter((u) => (universeEnum as readonly string[]).includes(u));
    const photo = await readUpload(form, "photo", IMAGE_TYPES, 2_000_000);
    if (photo && !photo.ok) return photo;
    await db.update(users).set({
      displayName: displayName || null,
      bio: bio || null,
      activities: splitList(str(form, "activities")),
      interests: splitList(str(form, "interests")),
      universes,
      offersText: str(form, "offersText").slice(0, 300) || null,
      needsText: str(form, "needsText").slice(0, 300) || null,
      transmitText: str(form, "transmitText").slice(0, 300) || null,
      availabilityNote: str(form, "availabilityNote").slice(0, 300) || null,
      travelRadiusKm: radius,
      profileVisible: visible,
      profileCity: city ? communeLabel(cityParts.commune, postalCode || cityParts.postalCode) : null,
      ...(point ? { profileLat: Number(point.lat.toFixed(2)).toFixed(2), profileLng: Number(point.lng.toFixed(2)).toFixed(2) } : {}),
    }).where(eq(users.id, user.id));
    if (photo?.ok) {
      await db.insert(profilePhotos).values({ userId: user.id, data: photo.data, mime: photo.mime })
        .onConflictDoUpdate({ target: profilePhotos.userId, set: { data: photo.data, mime: photo.mime, updatedAt: new Date() } });
    }
    await logAudit({ actorId: user.id, action: "maj_profil", entityType: "user", entityId: String(user.id) });
    revalidatePath("/le-monde-aime");
    return { ok: true, message: visible ? "Profil enregistré. Il apparaît dans l'annuaire, situé à sa commune près." : "Profil enregistré. Il reste privé." };
  } catch (error) {
    return fail(error, "Le profil n'a pas pu être enregistré.");
  }
}

/**
 * Ce qu'une personne accepte de transmettre (circuit « transmission »).
 *
 * On ne touche qu'à ce champ : le reste du profil (nom, commune, visibilité)
 * se règle dans Mon espace, et un formulaire partiel ne doit rien effacer.
 */
export async function saveTransmissionOffer(form: FormData): Promise<ProfileResult> {
  try {
    const user = await requireRole(["membre"]);
    const text = str(form, "transmitText").slice(0, 300);
    if (text.length > 0 && text.length < 4) return { ok: false, error: "Dites en quelques mots ce que vous acceptez de transmettre." };
    if (text.length === 0) {
      await db.update(users).set({ transmitText: null }).where(eq(users.id, user.id));
      await logAudit({ actorId: user.id, action: "retrait_transmission", entityType: "user", entityId: String(user.id) });
      revalidatePath("/le-monde-aime");
      revalidatePath("/espace/profil");
      revalidatePath("/circuits", "layout");
      return { ok: true, message: "Votre proposition de transmission est retirée des listes." };
    }
    await db.update(users).set({ transmitText: text }).where(eq(users.id, user.id));
    await logAudit({ actorId: user.id, action: "maj_transmission", entityType: "user", entityId: String(user.id) });
    revalidatePath("/le-monde-aime");
    revalidatePath("/espace/profil");
    revalidatePath("/circuits", "layout");
    return { ok: true, message: "C'est enregistré : votre proposition apparaît dans le circuit si votre profil est visible." };
  } catch (error) {
    return fail(error, "L'enregistrement n'a pas abouti.");
  }
}

/** Espace artiste : disciplines, zone, disponibilités et fiche technique (texte). */
export async function saveArtistProfile(form: FormData): Promise<ProfileResult> {
  try {
    const user = await requireRole(["membre"]);
    const disciplines = form.getAll("disciplines").map((d) => String(d).slice(0, 40)).slice(0, 8);
    const extra = splitList(str(form, "otherDisciplines"), 4);
    const values = {
      disciplines: Array.from(new Set([...disciplines, ...extra])),
      presentation: str(form, "presentation").slice(0, 800),
      zoneNote: str(form, "zoneNote").slice(0, 200),
      availabilityNote: str(form, "availabilityNote").slice(0, 300),
      techSheet: str(form, "techSheet").slice(0, 4000),
      updatedAt: new Date(),
    };
    if (values.disciplines.length === 0) return { ok: false, error: "Choisissez au moins une discipline." };
    await db.insert(artistProfiles).values({ userId: user.id, ...values }).onConflictDoUpdate({ target: artistProfiles.userId, set: values });
    revalidatePath("/le-monde-aime");
    return { ok: true, message: "Espace artiste enregistré." };
  } catch (error) {
    return fail(error, "Enregistrement impossible.");
  }
}
