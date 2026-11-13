"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CircleCheck } from "lucide-react";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { StatGrid } from "@/components/dashboard/DashboardWidgets";
import { TaskDeadlineList, nearestOpenTasks } from "@/components/dashboard/TasksHubPage";
import { summarizeTransactions } from "@/components/dashboard/financeMetrics";
import { isOverdue, taskStatus } from "@/components/dashboard/taskMetrics";
import { useUserContext } from "@/context/userContext";
import { visibleQuickActions } from "@/constants/dashboard-modules";
import { ROUTES } from "@/constants/routes";
import {
  AppNotification,
  BackendTask,
  ClubEvent,
  FinanceTransaction,
  fetchEvents,
  fetchMyTasks,
  fetchNotifications,
  fetchTasks,
  fetchTransactions,
} from "@/lib/api";
import { NOTIFICATION_TYPE_META, formatRelativeTime, notificationHref } from "@/lib/notifications";

type Source = "tasks" | "teamTasks" | "events" | "notifications" | "finance";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const MAX_ALERTS = 5;

function reasonMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function byDeadline(a: BackendTask, b: BackendTask) {
  return new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime();
}

export function DashboardHomePage() {
  const { user } = useUserContext();
  const role = user?.role?.toUpperCase();
  const isBcn = role === "BCN";
  // Trưởng ban/BCN thấy task của ban/CLB; backend tự giới hạn phạm vi theo vai trò.
  const seesTeam = isBcn || role === "TRUONG_BAN";
  const seesFinance = Boolean(user?.modules?.includes("FINANCE"));

  const [myTasks, setMyTasks] = useState<BackendTask[]>([]);
  const [teamTasks, setTeamTasks] = useState<BackendTask[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Source, string>>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // Mỗi nguồn lỗi độc lập: một API hỏng chỉ làm trống phần của nó.
  useEffect(() => {
    void Promise.allSettled([
      fetchMyTasks(),
      seesTeam ? fetchTasks() : Promise.resolve([]),
      fetchEvents(),
      fetchNotifications(5),
      seesFinance ? fetchTransactions() : Promise.resolve([]),
    ]).then(([tasks, team, upcoming, notes, finance]) => {
      const nextErrors: Partial<Record<Source, string>> = {};
      if (tasks.status === "fulfilled") setMyTasks(tasks.value);
      else nextErrors.tasks = reasonMessage(tasks.reason, "Không thể tải task.");
      if (team.status === "fulfilled") setTeamTasks(team.value);
      else nextErrors.teamTasks = reasonMessage(team.reason, "Không thể tải task của ban.");
      if (upcoming.status === "fulfilled") setEvents(upcoming.value);
      else nextErrors.events = reasonMessage(upcoming.reason, "Không thể tải sự kiện.");
      if (notes.status === "fulfilled") setNotifications(notes.value);
      else nextErrors.notifications = reasonMessage(notes.reason, "Không thể tải thông báo.");
      if (finance.status === "fulfilled") setTransactions(finance.value);
      else nextErrors.finance = reasonMessage(finance.reason, "Không thể tải tài chính.");
      setErrors(nextErrors);
      setNow(Date.now());
      setLoading(false);
    });
  }, [seesTeam, seesFinance]);

  const openTasks = myTasks.filter((task) => taskStatus(task) !== "DONE");
  const myOverdue = openTasks.filter((task) => isOverdue(task, now));
  const teamOverdue = teamTasks.filter((task) => isOverdue(task, now)).sort(byDeadline);
  const upcomingEvents = events
    .filter((event) => event.status !== "FINISHED" && new Date(event.eventDate).getTime() >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const nextEvent = upcomingEvents[0];
  const quickActions = visibleQuickActions(user?.modules);
  const scopeLabel = isBcn ? "toàn CLB" : "của ban";
  const alertTasks = (seesTeam ? teamOverdue : myOverdue.sort(byDeadline)).slice(0, MAX_ALERTS);
  const alertTotal = seesTeam ? teamOverdue.length : myOverdue.length;
  const alertError = seesTeam ? errors.teamTasks : errors.tasks;
  const failedNote = "Không tải được dữ liệu";
  const show = (source: Source, value: string) => (loading ? "…" : errors[source] ? "—" : value);

  const stats = [
    {
      label: "Task đang mở của tôi",
      value: show("tasks", String(openTasks.length)),
      note: errors.tasks ? failedNote : `Trên tổng ${myTasks.length} task được giao`,
    },
    {
      label: "Task quá hạn của tôi",
      value: show("tasks", String(myOverdue.length)),
      note: errors.tasks ? failedNote : myOverdue.length ? "Cần xử lý ngay" : "Không có task trễ hạn",
      tone: myOverdue.length ? ("rose" as const) : undefined,
    },
    ...(seesTeam
      ? [
          {
            label: `Task quá hạn ${scopeLabel}`,
            value: show("teamTasks", String(teamOverdue.length)),
            note: errors.teamTasks ? failedNote : `Trên ${teamTasks.length} task ${scopeLabel}`,
            tone: teamOverdue.length ? ("amber" as const) : undefined,
          },
        ]
      : []),
    ...(seesFinance
      ? [
          {
            label: "Quỹ hiện tại",
            value: show("finance", money.format(summarizeTransactions(transactions, "").balance)),
            note: errors.finance ? failedNote : "Tổng thu trừ tổng chi",
          },
        ]
      : []),
    {
      label: "Sự kiện sắp tới",
      value: show("events", String(upcomingEvents.length)),
      note: errors.events
        ? failedNote
        : nextEvent
          ? `Gần nhất: ${nextEvent.title} · ${new Date(nextEvent.eventDate).toLocaleDateString("vi-VN")}`
          : "Chưa có sự kiện nào",
    },
  ].slice(0, 4);

  return (
    <PageFrame
      title={`Xin chào, ${user?.name ?? "bạn"}`}
      description={`Hôm nay ${new Date(now).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" })}. Việc cần chú ý nằm ở đầu trang.`}
      aside={<StatGrid items={stats} />}
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid content-start gap-6">
          <Section
            title="Cần chú ý"
            subtitle={seesTeam ? `Task quá hạn ${scopeLabel}, cũ nhất trước.` : "Task của bạn đã quá hạn."}
            action={
              seesTeam ? (
                <Link
                  href={isBcn ? ROUTES.healthDashboard : ROUTES.departmentOperations}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#BE123C] hover:underline"
                >
                  {isBcn ? "Xem Health dashboard" : "Xem nghiệp vụ ban"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null
            }
          >
            {loading ? (
              <p role="status" className="text-sm text-[#71717A]">Đang kiểm tra task quá hạn…</p>
            ) : alertError ? (
              <p role="alert" className="text-sm text-rose-700">{alertError}</p>
            ) : alertTasks.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-emerald-700">
                <CircleCheck className="h-4 w-4" aria-hidden />
                Không có task nào quá hạn.
              </p>
            ) : (
              <>
                <TaskDeadlineList tasks={alertTasks} now={now} currentUserId={user?.id} />
                {alertTotal > alertTasks.length ? (
                  <p className="mt-3 text-sm text-[#71717A]">Còn {alertTotal - alertTasks.length} task quá hạn khác.</p>
                ) : null}
              </>
            )}
          </Section>

          <Section
            title="Deadline sắp tới của tôi"
            action={
              <Link href={ROUTES.todoList} className="inline-flex items-center gap-1 text-sm font-medium text-[#BE123C] hover:underline">
                Mở Todo-list
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            {loading ? (
              <p role="status" className="text-sm text-[#71717A]">Đang tải task…</p>
            ) : errors.tasks ? (
              <p role="alert" className="text-sm text-rose-700">{errors.tasks}</p>
            ) : (
              <TaskDeadlineList
                tasks={nearestOpenTasks(myTasks, 5).filter((task) => !isOverdue(task, now))}
                now={now}
                currentUserId={user?.id}
              />
            )}
          </Section>
        </div>

        <div className="grid content-start gap-6">
          {quickActions.length > 0 ? (
            <Section title="Thao tác nhanh" subtitle="Hoặc nhấn Ctrl K ở bất kỳ trang nào.">
              <ul className="grid gap-2 sm:grid-cols-2">
                {quickActions.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#18181B] transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#BE123C]"
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section
            title="Thông báo mới"
            action={
              <Link href={ROUTES.readNotification} className="inline-flex items-center gap-1 text-sm font-medium text-[#BE123C] hover:underline">
                Xem tất cả
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          >
            {loading ? (
              <p role="status" className="text-sm text-[#71717A]">Đang tải thông báo…</p>
            ) : errors.notifications ? (
              <p role="alert" className="text-sm text-rose-700">{errors.notifications}</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-[#71717A]">Chưa có thông báo nào.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <Link
                      href={notificationHref(notification)}
                      className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition hover:bg-rose-50"
                    >
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${NOTIFICATION_TYPE_META[notification.type]?.dot ?? "bg-slate-400"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="line-clamp-2 text-sm font-medium text-[#18181B]">{notification.title}</h3>
                          <span className="shrink-0 text-xs text-[#71717A]">
                            {formatRelativeTime(notification.createdAt, now)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm text-[#71717A]">{notification.body}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </PageFrame>
  );
}
