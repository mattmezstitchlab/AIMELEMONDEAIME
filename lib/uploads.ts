/** Lecture sécurisée d'un fichier envoyé par formulaire (taille et type contrôlés côté serveur). */
export type UploadResult =
  | { ok: true; data: Buffer; mime: string; name: string; size: number }
  | { ok: false; error: string }
  | null;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf", "text/plain"];

export async function readUpload(form: FormData, field: string, allowed: string[], maxBytes: number): Promise<UploadResult> {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > maxBytes) return { ok: false, error: `Fichier trop volumineux (${Math.round(maxBytes / 1_000_000)} Mo maximum).` };
  if (!allowed.includes(file.type)) return { ok: false, error: "Format non accepté." };
  return { ok: true, data: Buffer.from(await file.arrayBuffer()), mime: file.type, name: file.name.slice(0, 190), size: file.size };
}
