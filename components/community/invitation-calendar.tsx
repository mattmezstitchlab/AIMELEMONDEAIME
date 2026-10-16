"use client";
import { calendarText } from "@/lib/wedding-portal";
export function InvitationCalendar({ title, date, city }: { title: string; date: string; city: string }) {
  const text = calendarText(title, date, city);
  if (!text) return null;
  return <button className="min-h-11 rounded-control px-4 text-sm font-semibold ring-1 ring-line" onClick={() => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "invitation-mariage.ics"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }}>Ajouter la date à mon calendrier</button>;
}
