"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artistProfiles, profilePhotos, users, universeEnum } from "@/db/schema";
import { AuthError, requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { IMAGE_TYPES, readUpload } from "@/lib/uploads";
import { splitList } from "@/lib/lma";

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
    const city = str(form, "profileCity").slice(0, 120);
    const lat = Number(str(form, "profileLat"));
    const lng = Number(str(form, "profileLng"));
    const radius = Math.round(Number(str(form, "travelRadiusKm") || 20));
    const hasPoint = str(form, "profileLat") !== "" && Number.isFinite(lat) && Number.isFinite(lng);
    if (hasPoint && !(lat >= 41 && lat <= 51.5 && lng >= -5.5 && lng <= 9.8)) return { ok: false, error: "Placez votre commune en France métropolitaine." };
    if (!Number.isInteger(radius) || radius < 0 || radius > 300) return { ok: false, error: "La zone de déplacement doit être comprise entre 0 et 300 km." };
    const visible = form.get("profileVisible") === "on";
    if (visible && !hasPoint && user.profileLat === null) return { ok: false, error: "Pour apparaître sur la carte, placez d'abord votre commune." };
    if (visible && displayName.length < 2) return { ok: false, error: "Indiquez un nom d'affichage pour apparaître sur la carte." };
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
      profileCity: city || null,
      ...(hasPoint ? { profileLat: Number(lat.toFixed(2)).toFixed(2), profileLng: Number(lng.toFixed(2)).toFixed(2) } : {}),
    }).where(eq(users.id, user.id));
    if (photo?.ok) {
      await db.insert(profilePhotos).values({ userId: user.id, data: photo.data, mime: photo.mime })
        .onConflictDoUpdate({ target: profilePhotos.userId, set: { data: photo.data, mime: photo.mime, updatedAt: new Date() } });
    }
    await logAudit({ actorId: user.id, action: "maj_profil", entityType: "user", entityId: String(user.id) });
    revalidatePath("/le-monde-aime");
    return { ok: true, message: visible ? "Profil enregistré. Il apparaît sur la carte avec une position approximative." : "Profil enregistré. Il reste privé." };
  } catch (error) {
    return fail(error, "Le profil n'a pas pu être enregistré.");
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
