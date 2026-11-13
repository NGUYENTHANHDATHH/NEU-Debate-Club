"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { fetchNotifications, type AppNotification } from "@/lib/api";
import {
  NOTIFICATION_TYPE_META,
  formatRelativeTime,
  notificationHref,
} from "@/lib/notifications";

const BELL_LIMIT = 5;
const POLL_INTERVAL_MS = 60_000;

export default function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const latest = await fetchNotifications(BELL_LIMIT);
      setItems(latest);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải thông báo.");
    } finally {
      setNow(Date.now());
      setLoaded(true);
    }
  }, []);

  // Tải lần đầu và tự tải lại mỗi 60 giây khi tab đang hiển thị.
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function toggle() {
    if (!open) void load();
    setOpen((current) => !current);
  }

  function openNotification(notification: AppNotification) {
    setOpen(false);
    router.push(notificationHref(notification));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Thông báo mới nhất"
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[#18181B] transition-colors hover:bg-slate-50"
      >
        <Bell className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-[#18181B]">Thông báo mới nhất</p>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {!loaded && <p className="px-4 py-6 text-center text-sm text-[#71717A]">Đang tải...</p>}
            {loaded && error && items.length === 0 && (
              <p role="alert" className="px-4 py-6 text-center text-sm text-rose-600">{error}</p>
            )}
            {loaded && !error && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-[#71717A]">Chưa có thông báo nào.</p>
            )}
            {items.map((notification) => {
              const meta = NOTIFICATION_TYPE_META[notification.type] ?? NOTIFICATION_TYPE_META.GENERAL;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#18181B]">
                      {notification.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[#71717A]">
                      {notification.body}
                    </span>
                    <span className="mt-1 block text-[11px] text-[#A1A1AA]">
                      {meta.label} · {formatRelativeTime(notification.createdAt, now)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            href={ROUTES.readNotification}
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-[#E11D48] hover:bg-rose-50"
          >
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  );
}
