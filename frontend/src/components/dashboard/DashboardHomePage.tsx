"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { StatGrid } from "@/components/dashboard/DashboardWidgets";
import { TaskDeadlineList, nearestOpenTasks } from "@/components/dashboard/TasksHubPage";
import { isOverdue, taskStatus } from "@/components/dashboard/taskMetrics";
import { useUserContext } from "@/context/userContext";
import { visibleDashboardGroups } from "@/constants/dashboard-modules";
import { ROUTES } from "@/constants/routes";
import {
  AppNotification,
  BackendTask,
  ClubEvent,
  Publication,
  fetchEvents,
  fetchMyTasks,
  fetchNotifications,
  fetchPublications,
} from "@/lib/api";
import { NOTIFICATION_TYPE_META, formatRelativeTime, notificationHref } from "@/lib/notifications";

type Source = "tasks" | "publications" | "events" | "notifications";

function reasonMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

export function DashboardHomePage() {
  const { user } = useUserContext();
  const router = useRouter();
  const [myTasks, setMyTasks] = useState<BackendTask[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Source, string>>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // Mỗi nguồn lỗi độc lập: một API hỏng chỉ làm trống phần của nó.
  useEffect(() => {
    void Promise.allSettled([
      fetchMyTasks(),
      fetchPublications(),
      fetchEvents(),
      fetchNotifications(5),
    ]).then(([tasks, pubs, upcoming, notes]) => {
      const nextErrors: Partial<Record<Source, string>> = {};
      if (tasks.status === "fulfilled") setMyTasks(tasks.value);
      else nextErrors.tasks = reasonMessage(tasks.reason, "Không thể tải task.");
      if (pubs.status === "fulfilled") setPublications(pubs.value);
      else nextErrors.publications = reasonMessage(pubs.reason, "Không thể tải ấn phẩm.");
      if (upcoming.status === "fulfilled") setEvents(upcoming.value);
      else nextErrors.events = reasonMessage(upcoming.reason, "Không thể tải sự kiện.");
      if (notes.status === "fulfilled") setNotifications(notes.value);
      else nextErrors.notifications = reasonMessage(notes.reason, "Không thể tải thông báo.");
      setErrors(nextErrors);
      setNow(Date.now());
      setLoading(false);
    });
  }, []);

  const today = new Date(now);
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const openTasks = myTasks.filter((task) => taskStatus(task) !== "DONE");
  const overdueTasks = openTasks.filter((task) => isOverdue(task, now));
  const monthPublications = publications.filter((item) => item.postedAt.startsWith(monthKey));
  const upcomingEvents = events
    .filter((event) => event.status !== "FINISHED" && new Date(event.eventDate).getTime() >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const nextEvent = upcomingEvents[0];
  const navGroups = visibleDashboardGroups(user?.modules);
  const failedNote = "Không tải được dữ liệu";

  return (
    <PageFrame
      eyebrow="Tổng quan"
      title="NEU Debate Club Dashboard"
      description={`Xin chào ${user?.name ?? "bạn"}: task của bạn, thông báo mới và các module bạn được dùng.`}
      action={
        <ActionButton icon={<ArrowRight className="h-4 w-4" />} onClick={() => router.push(ROUTES.todoList)}>
          Đi tới Todo-list
        </ActionButton>
      }
      aside={
        <StatGrid
          items={[
            {
              label: "Task đang mở",
              value: errors.tasks ? "—" : String(openTasks.length),
              note: errors.tasks ? failedNote : `Trên tổng ${myTasks.length} task của bạn`,
              tone: "rose",
            },
            {
              label: "Task quá hạn của tôi",
              value: errors.tasks ? "—" : String(overdueTasks.length),
              note: errors.tasks ? failedNote : overdueTasks.length ? "Cần xử lý ngay" : "Không có task trễ hạn",
              tone: "amber",
            },
            {
              label: "Ấn phẩm tháng này",
              value: errors.publications ? "—" : String(monthPublications.length),
              note: errors.publications ? failedNote : `Tháng ${today.getMonth() + 1}/${today.getFullYear()}`,
              tone: "emerald",
            },
            {
              label: "Sự kiện sắp tới",
              value: errors.events ? "—" : String(upcomingEvents.length),
              note: errors.events
                ? failedNote
                : nextEvent
                  ? `Gần nhất: ${nextEvent.title} · ${new Date(nextEvent.eventDate).toLocaleDateString("vi-VN")}`
                  : "Chưa có sự kiện nào",
              tone: "slate",
            },
          ]}
        />
      }
    >
      {loading && <p role="status" className="text-sm text-[#71717A]">Đang tải dữ liệu tổng quan...</p>}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Section title="Lối vào nhanh" subtitle="Các trang bạn được truy cập theo vai trò và ban.">
          <div className="grid gap-4 md:grid-cols-2">
            {navGroups.map((group) => (
              <div key={group.title} className="rounded-[1.5rem] border border-slate-200/60 bg-[#FAFAFA] p-5">
                <h3 className="font-semibold text-[#18181B]">{group.title}</h3>
                <ul className="mt-3 space-y-1">
                  {group.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[#71717A] transition hover:bg-rose-50 hover:text-[#E11D48]"
                      >
                        {item.name}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Hoạt động gần đây" subtitle="5 thông báo mới nhất và deadline gần nhất của bạn.">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#18181B]">Thông báo mới</h3>
              {errors.notifications ? (
                <p role="alert" className="text-sm text-rose-600">{errors.notifications}</p>
              ) : !loading && notifications.length === 0 ? (
                <p className="text-sm text-[#71717A]">Chưa có thông báo nào.</p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <Link
                        href={notificationHref(notification)}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 transition hover:border-rose-200 hover:bg-rose-50"
                      >
                        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${NOTIFICATION_TYPE_META[notification.type]?.dot ?? "bg-slate-400"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="line-clamp-2 font-medium text-[#18181B]">{notification.title}</h4>
                            <span className="shrink-0 text-xs text-[#71717A]">
                              {formatRelativeTime(notification.createdAt, now)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-[#71717A]">{notification.body}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#18181B]">Deadline gần nhất của tôi</h3>
              {errors.tasks ? (
                <p role="alert" className="text-sm text-rose-600">{errors.tasks}</p>
              ) : (
                !loading && <TaskDeadlineList tasks={nearestOpenTasks(myTasks, 3)} now={now} currentUserId={user?.id} />
              )}
            </div>
          </div>
        </Section>
      </div>
    </PageFrame>
  );
}
