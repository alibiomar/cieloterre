"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, ClipboardList, Mail, UserPlus } from "lucide-react";
import type { CrmNotification } from "@/lib/crm/notifications";
import { createClient } from "@/lib/supabase/client";

const iconByType: Record<CrmNotification["type"], typeof Bell> = {
  lead: UserPlus,
  viewing_request: Mail,
  task: ClipboardList,
  visit: CalendarClock,
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/crm/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications ?? []);
      setUnseenCount(data.unseenCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const supabase = createClient();
    const channel = supabase
      .channel("crm-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crm_notifications",
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await load();
    }
    if (next && unseenCount > 0) {
      setUnseenCount(0);
      await fetch("/api/crm/notifications", { method: "POST" });
    }
  };

  const goTo = (notification: CrmNotification) => {
    setOpen(false);
    router.push(notification.href);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={toggleOpen}
        className="relative rounded-full border bg-background border-cool-light p-2.5 text-foreground transition hover:bg-surface"
      >
        <Bell size={18} />
        {unseenCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-cool-light bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-cool-light px-4 py-3">
            <p className="font-serif text-lg">Notifications</p>
            {!loading && (
              <span className="text-xs text-soft-foreground">{notifications.length} récentes</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-center text-sm text-soft-foreground">Chargement…</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-soft-foreground">
                Rien de nouveau pour le moment.
              </p>
            )}
            {!loading &&
              notifications.map((notification) => {
                const Icon = iconByType[notification.type];
                return (
                  <button
                    key={notification.id}
                    onClick={() => goTo(notification)}
                    className="flex w-full items-start gap-3 border-b border-cool-light px-4 py-3 text-left last:border-0 hover:bg-surface"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-primary">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{notification.title}</span>
                      <span className="block truncate text-xs text-soft-foreground">
                        {notification.description}
                      </span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-[10px] text-soft-foreground">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
