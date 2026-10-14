import { requireRolePage } from "@/lib/auth";
import type { Metadata } from "next";
import { getOfficeAppointments } from "@/lib/queries";
import { Card, SectionTitle, EmptyState, formatDateTime } from "@/components/ui";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/constants";
import { AppointmentActions } from "./appointment-actions";

export const metadata: Metadata = { title: "Rendez-vous — Back-office AIME®" };

export const dynamic = "force-dynamic";

export default async function RendezVousPage() {
  const user = await requireRolePage(["gestionnaire", "administrateur"]);
  const officeId = user.role === "administrateur" ? null : user.officeId;
  const items = await getOfficeAppointments(officeId);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Agenda" title="Rendez-vous" description="Confirmez, annulez ou clôturez les demandes de rendez-vous de votre bureau." />
      {items.length === 0 ? (
        <EmptyState title="Aucune demande de rendez-vous" />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{a.reason}</p>
                <p className="text-xs text-ink-3">{a.memberName} · {formatDateTime(a.requestedSlot)}</p>
                <span className="mt-1 inline-block text-xs font-medium text-ink">{APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}</span>
              </div>
              <AppointmentActions appointmentId={a.id} status={a.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
