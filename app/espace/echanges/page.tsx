import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { messages, appointments, offices } from "@/db/schema";
import { or, eq, asc } from "drizzle-orm";
import { Card, SectionTitle, EmptyState, formatDateTime } from "@/components/ui";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/constants";
import { OfficeMessageForm } from "./office-message-form";
import { AppointmentForm } from "./appointment-form";
import { getMyCommunityData } from "@/lib/community-queries";
import { MyExchangesClient } from "./my-exchanges-client";

export const dynamic = "force-dynamic";

export default async function EchangesPage() {
  const user = (await getCurrentUser())!;
  const thread = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, user.id), eq(messages.recipientId, user.id)))
    .orderBy(asc(messages.createdAt));

  const myAppointments = await db.select().from(appointments).where(eq(appointments.memberId, user.id));
  const officeList = await db.select().from(offices);
  const mine = await getMyCommunityData(user.id);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle image="/images/hero-campagne.jpg" eyebrow="Mes échanges" title="Conversations, réservations, dons, prêts" description="Les demandes faites ou reçues sur la carte, et vos échanges avec l'équipe d'accompagnement." />

      <section><h2 className="mb-3 text-lg font-bold text-slate-900">Réservations, dons, prêts et locations</h2><MyExchangesClient mine={mine} userId={user.id} /></section>
      <h2 className="text-lg font-bold text-slate-900">Équipe d&apos;accompagnement (démonstration)</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Messagerie avec l'équipe d'accompagnement</h2>
          {thread.length === 0 ? (
            <EmptyState title="Aucun message" description="Envoyez un message à l'équipe d'accompagnement pour une question générale." />
          ) : (
            <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
              {thread.map((m) => (
                <li key={m.id} className={`rounded-lg px-3 py-2 text-sm ${m.senderId === user.id ? "ml-6 bg-emerald-50 text-emerald-900" : "mr-6 bg-slate-100 text-slate-800"}`}>
                  <p>{m.body}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(m.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
          <div data-assistant-id="echanges-message-form"><OfficeMessageForm /></div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Demander un rendez-vous</h2>
          <div data-assistant-id="echanges-appointment-form"><AppointmentForm offices={officeList} /></div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Mes rendez-vous</h2>
        {myAppointments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Aucune demande de rendez-vous pour le moment.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {myAppointments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{a.reason}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(a.requestedSlot)}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-800">{APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
