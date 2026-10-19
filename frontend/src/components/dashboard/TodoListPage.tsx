"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { BackendTask, fetchMyTasks } from "@/lib/api";
import { useUserContext } from "@/context/userContext";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";

type StatusFilter = "OPEN" | "ALL" | "TODO" | "IN_PROGRESS" | "DONE";

const DAY = 86_400_000;
const statusLabels = {
  TODO: "Cần làm",
  IN_PROGRESS: "Đang làm",
  DONE: "Hoàn thành",
} as const;
const priorityLabels = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao" } as const;
const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

function normalizeStatus(status: BackendTask["status"]) {
  return status.toUpperCase() as keyof typeof statusLabels;
}

function normalizePriority(priority: BackendTask["priority"]) {
  return priority.toUpperCase() as keyof typeof priorityLabels;
}

function deadlineTime(task: BackendTask) {
  return task.deadline ? new Date(task.deadline).getTime() : Number.POSITIVE_INFINITY;
}

function urgency(task: BackendTask, now: number) {
  const status = normalizeStatus(task.status);
  const deadline = deadlineTime(task);
  if (status === "DONE") return "done";
  if (deadline < now) return "overdue";
  if (deadline <= now + 3 * DAY) return "soon";
  return "normal";
}

function deadlineLabel(task: BackendTask, now: number) {
  if (!task.deadline) return "Không có deadline";
  const date = new Date(task.deadline);
  const days = Math.ceil((date.getTime() - now) / DAY);
  const overdueDays = Math.max(1, Math.ceil((now - date.getTime()) / DAY));
  const formatted = date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (normalizeStatus(task.status) === "DONE") return `Đã hoàn thành · ${formatted}`;
  if (date.getTime() < now) return `Quá hạn ${overdueDays} ngày · ${formatted}`;
  if (days === 0) return `Đến hạn hôm nay · ${formatted}`;
  if (days === 1) return `Còn 1 ngày · ${formatted}`;
  return `Còn ${days} ngày · ${formatted}`;
}

export function TodoListPage() {
  const { user } = useUserContext();
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("OPEN");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTasks(await fetchMyTasks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải công việc.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const events = useMemo(() => {
    const unique = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.eventId && task.eventTitle) unique.set(task.eventId, task.eventTitle);
    });
    return [...unique].sort((a, b) => a[1].localeCompare(b[1], "vi"));
  }, [tasks]);

  const counts = useMemo(() => ({
    open: tasks.filter((task) => normalizeStatus(task.status) !== "DONE").length,
    overdue: tasks.filter((task) => urgency(task, now) === "overdue").length,
    soon: tasks.filter((task) => urgency(task, now) === "soon").length,
    done: tasks.filter((task) => normalizeStatus(task.status) === "DONE").length,
  }), [tasks, now]);

  const visibleTasks = useMemo(() => tasks
    .filter((task) => {
      const status = normalizeStatus(task.status);
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "OPEN" && status !== "DONE")
        || status === statusFilter;
      const matchesEvent = eventFilter === "ALL"
        || (eventFilter === "NONE" && !task.eventId)
        || task.eventId === eventFilter;
      return matchesStatus && matchesEvent;
    })
    .sort((a, b) => {
      const statusDifference = Number(normalizeStatus(a.status) === "DONE")
        - Number(normalizeStatus(b.status) === "DONE");
      if (statusDifference) return statusDifference;
      const deadlineDifference = deadlineTime(a) - deadlineTime(b);
      if (deadlineDifference) return deadlineDifference;
      return priorityOrder[normalizePriority(a.priority)] - priorityOrder[normalizePriority(b.priority)];
    }), [tasks, statusFilter, eventFilter]);

  return (
    <PageFrame
      eyebrow="Công việc cá nhân"
      title={`Việc cần làm${user?.name ? ` của ${user.name}` : ""}`}
      description="Task quá hạn và gần deadline được tự động đưa lên đầu để bạn biết việc nào cần xử lý trước."
      action={
        <button type="button" onClick={() => void loadTasks()} disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Chưa hoàn thành" value={counts.open} icon={<Clock3 className="h-5 w-5" />} />
        <SummaryCard label="Đã quá hạn" value={counts.overdue} tone="danger" icon={<CircleAlert className="h-5 w-5" />} />
        <SummaryCard label="Hạn trong 3 ngày" value={counts.soon} tone="warning" icon={<CalendarClock className="h-5 w-5" />} />
        <SummaryCard label="Đã hoàn thành" value={counts.done} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <Section title="Danh sách công việc" subtitle="Sắp xếp theo deadline gần nhất, sau đó theo mức ưu tiên.">
        <div className="mb-5 grid gap-3 border-b border-slate-100 pb-5 md:grid-cols-[1fr_280px]">
          <div className="flex flex-wrap gap-2" aria-label="Lọc theo trạng thái">
            {([
              ["OPEN", "Cần xử lý", counts.open],
              ["ALL", "Tất cả", tasks.length],
              ["TODO", "Cần làm", null],
              ["IN_PROGRESS", "Đang làm", null],
              ["DONE", "Hoàn thành", counts.done],
            ] as const).map(([value, label, count]) => (
              <button key={value} type="button" onClick={() => setStatusFilter(value)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${statusFilter === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {label}{count !== null ? ` · ${count}` : ""}
              </button>
            ))}
          </div>
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lọc theo sự kiện
            <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100">
              <option value="ALL">Tất cả sự kiện</option>
              <option value="NONE">Không thuộc sự kiện</option>
              {events.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select>
          </label>
        </div>

        {loading ? <TaskSkeleton /> : error ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            <p className="font-semibold">Không thể tải danh sách công việc</p>
            <p className="mt-1">{error}</p>
            <button type="button" onClick={() => void loadTasks()} className="mt-3 font-semibold underline">Thử lại</button>
          </div>
        ) : visibleTasks.length ? (
          <div className="space-y-3">
            {visibleTasks.map((task) => <TaskCard key={task.id} task={task} now={now} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
            <p className="mt-3 font-semibold text-slate-800">Không có công việc phù hợp</p>
            <p className="mt-1 text-sm text-slate-500">Hãy đổi bộ lọc hoặc tận hưởng một khoảng nghỉ.</p>
          </div>
        )}
      </Section>
    </PageFrame>
  );
}

function SummaryCard({ label, value, icon, tone = "default" }: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const colors = {
    default: "bg-slate-100 text-slate-600",
    danger: "bg-rose-100 text-rose-600",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span>
      <div><p className="text-2xl font-semibold text-slate-900">{value}</p><p className="text-sm text-slate-500">{label}</p></div>
    </div>
  );
}

function TaskCard({ task, now }: { task: BackendTask; now: number }) {
  const taskUrgency = urgency(task, now);
  const status = normalizeStatus(task.status);
  const priority = normalizePriority(task.priority);
  const accent = {
    overdue: "border-l-rose-500",
    soon: "border-l-amber-400",
    normal: "border-l-slate-200",
    done: "border-l-emerald-400 opacity-70",
  }[taskUrgency];
  const deadlineColor = taskUrgency === "overdue" ? "text-rose-600" : taskUrgency === "soon" ? "text-amber-700" : "text-slate-500";

  return (
    <article className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-4 transition hover:border-slate-300 ${accent}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {taskUrgency === "overdue" && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Quá hạn</span>}
            {taskUrgency === "soon" && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Sắp đến hạn</span>}
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priority === "HIGH" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
              Ưu tiên {priorityLabels[priority].toLowerCase()}
            </span>
          </div>
          <h3 className={`mt-2 font-semibold text-slate-900 ${status === "DONE" ? "line-through" : ""}`}>{task.title}</h3>
          {task.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{task.description}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{statusLabels[status]}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-sm">
        <span className={`inline-flex items-center gap-1.5 font-medium ${deadlineColor}`}><CalendarClock className="h-4 w-4" />{deadlineLabel(task, now)}</span>
        <span className="text-slate-500">{task.eventTitle ?? "Không thuộc sự kiện"}</span>
        <span className="text-slate-400">Giao bởi {task.assignedByName ?? "—"}</span>
      </div>
    </article>
  );
}

function TaskSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Đang tải công việc">
      {[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );
}
