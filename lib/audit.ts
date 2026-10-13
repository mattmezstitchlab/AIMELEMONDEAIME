import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAudit(params: {
  actorId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  metadata?: Record<string, string>;
}) {
  await db.insert(auditLogs).values({
    actorId: params.actorId ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId != null ? String(params.entityId) : null,
    metadata: params.metadata ?? {},
  });
}
