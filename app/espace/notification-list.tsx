"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/messages";

type Item = { id: number; title: string; body: string; link: string | null; isRead: boolean };

export function NotificationList({ items }: { items: Item[] }) {
  const [optimistic, setOptimistic] = useOptimistic(items, (state, id: number | "all") =>
    state.map((n) => (id === "all" || n.id === id ? { ...n, isRead: true } : n))
  );
  const [, startTransition] = useTransition();

  if (optimistic.length === 0) return <p className="mt-3 text-sm text-ink-3">Aucune notification.</p>;
  const unread = optimistic.some((n) => !n.isRead);

  return (
    <div className="mt-3">
      <ul className="flex flex-col gap-2">
        {optimistic.map((n) => (
          <li key={n.id} className={`rounded-card px-3 py-2.5 text-sm ${n.isRead ? "bg-canvas" : "bg-muted"}`}>
            <div className="flex items-start gap-2">
              {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink-2" aria-label="Non lue" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{n.title}</p>
                <p className="text-ink-3">{n.body}</p>
                <div className="mt-1 flex gap-3 text-xs">
                  {n.link && (
                    <Link href={n.link} className="font-semibold text-ink-2 hover:underline" onClick={() => startTransition(async () => { setOptimistic(n.id); await markNotificationRead(n.id); })}>
                      Voir
                    </Link>
                  )}
                  {!n.isRead && (
                    <button type="button" className="font-medium text-ink-3 hover:underline" onClick={() => startTransition(async () => { setOptimistic(n.id); await markNotificationRead(n.id); })}>
                      Marquer comme lue
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {unread && (
        <button type="button" className="mt-3 text-xs font-semibold text-ink-2 hover:underline" onClick={() => startTransition(async () => { setOptimistic("all"); await markAllNotificationsRead(); })}>
          Tout marquer comme lu
        </button>
      )}
    </div>
  );
}
