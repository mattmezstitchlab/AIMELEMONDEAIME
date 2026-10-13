import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis").max(160),
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  city: z.string().min(1, "Indiquez votre commune").max(120),
  birthDate: z.string().min(8, "Indiquez votre date de naissance").max(10),
  phone: z.string().max(30).optional().default(""),
  situation: z.enum(["salarie_agricole", "exploitant", "employeur", "retraite", "famille"]).optional(),
  officeId: z.coerce.number().int().positive().optional(),
  address: z.string().max(200).optional().default(""),
  postalCode: z.string().max(10).optional().default(""),
  familyStatus: z.string().max(60).optional().default(""),
});

export const caseFormSchema = z.object({
  procedureTypeId: z.coerce.number().int().positive(),
  data: z.record(z.string(), z.string()),
});

export const messageSchema = z.object({
  body: z.string().min(1, "Message vide").max(4000),
  caseId: z.coerce.number().int().positive().optional(),
});

export const appointmentSchema = z.object({
  officeId: z.coerce.number().int().positive(),
  reason: z.string().min(3).max(200),
  requestedSlot: z.string().min(1, "Choisissez une date"),
  caseId: z.coerce.number().int().positive().optional(),
});

export const officeSchema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().min(2).max(20),
  address: z.string().min(2).max(200),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(4).max(10),
  phone: z.string().min(4).max(30),
  hours: z.string().min(2).max(200),
  region: z.string().min(2).max(120),
});

export const articleSchema = z.object({
  title: z.string().min(2).max(200),
  category: z.string().min(2).max(40),
  audience: z.string().min(2).max(60),
  summary: z.string().min(2).max(500),
  content: z.string().min(2),
  kind: z.enum(["article", "guide"]),
});

export function parseOrError<T>(schema: z.ZodType<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { ok: false as const, error: result.error.issues[0]?.message ?? "Données invalides" };
  }
  return { ok: true as const, data: result.data };
}
