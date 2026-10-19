"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  PencilLine,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BackendTask, fetchMyTasks, updateTaskProgress } from "@/lib/api";
import { useUserContext } from "@/context/userContext";
import { TaskHistory } from "@/components/dashboard/TaskHistory";
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
  const [selectedTask, setSelectedTask] = useState<BackendTask | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [comment, setComment] = useState("");
  const [historyRevision, setHistoryRevision] = useState(0);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (!selectedTask) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setSelectedTask(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedTask, saving]);

  function openEditor(task: BackendTask) {
    setSelectedTask(task);
    setEditProgress(task.progress);
    setComment("");
  }

  async function saveStatus(event: FormEvent) {
    event.preventDefault();
    if (!selectedTask) return;
    setSaving(true);
    try {
      const updated = await updateTaskProgress(selectedTask.id, editProgress, comment.trim());
      setTasks((current) => current.map((task) => task.id === updated.id ? updated : task));
      setSelectedTask(updated);
      setComment("");
      setHistoryRevision((revision) => revision + 1);
      toast.success("Đã cập nhật tiến độ công việc.");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Không thể cập nhật công việc.");
    } finally {
      setSaving(false);
    }
  }

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
            {visibleTasks.map((task) => <TaskCard key={task.id} task={task} now={now} onEdit={() => openEditor(task)} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
            <p className="mt-3 font-semibold text-slate-800">Không có công việc phù hợp</p>
            <p className="mt-1 text-sm text-slate-500">Hãy đổi bộ lọc hoặc tận hưởng một khoảng nghỉ.</p>
          </div>
        )}
      </Section>
      {selectedTask && (
        <TaskUpdateDialog
          task={selectedTask}
          progress={editProgress}
          comment={comment}
          historyRevision={historyRevision}
          saving={saving}
          onProgressChange={setEditProgress}
          onCommentChange={setComment}
          onClose={() => { if (!saving) setSelectedTask(null); }}
          onSubmit={saveStatus}
        />
      )}
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

function TaskCard({ task, now, onEdit }: { task: BackendTask; now: number; onEdit: () => void }) {
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
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{statusLabels[status]}</span>
          <button type="button" onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
            <PencilLine className="h-3.5 w-3.5" /> Cập nhật
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-sm">
        <span className={`inline-flex items-center gap-1.5 font-medium ${deadlineColor}`}><CalendarClock className="h-4 w-4" />{deadlineLabel(task, now)}</span>
        <span className="text-slate-500">{task.eventTitle ?? "Không thuộc sự kiện"}</span>
        <span className="text-slate-400">Giao bởi {task.assignedByName ?? "—"}</span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-slate-500">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-rose-500" style={{ width: `${task.progress}%` }} />
        </div>
        <span>{task.progress}%</span>
      </div>
    </article>
  );
}

function TaskUpdateDialog({ task, progress, comment, historyRevision, saving, onProgressChange, onCommentChange, onClose, onSubmit }: {
  task: BackendTask;
  progress: number;
  comment: string;
  historyRevision: number;
  saving: boolean;
  onProgressChange: (progress: number) => void;
  onCommentChange: (comment: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const status = progress === 0 ? "TODO" : progress === 100 ? "DONE" : "IN_PROGRESS";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-labelledby="task-update-title" onMouseDown={onClose}>
      <form onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">Cập nhật task</p>
            <h2 id="task-update-title" className="mt-1 text-xl font-semibold text-slate-900">{task.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{task.eventTitle ?? "Không thuộc sự kiện"}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Đóng"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-800">Trạng thái công việc</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(statusLabels) as (keyof typeof statusLabels)[]).map((value) => (
                <button key={value} type="button" autoFocus={status === value} disabled={saving}
                  onClick={() => onProgressChange(value === "TODO" ? 0 : value === "DONE" ? 100 : Math.min(99, Math.max(1, progress)))}
                  aria-pressed={status === value}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${status === value ? "border-rose-300 bg-rose-50 text-rose-600 ring-2 ring-rose-100" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {statusLabels[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">Tiến độ</span>
              <span className="font-semibold text-slate-900">{progress}%</span>
            </div>
            <input type="range" min={0} max={100} value={progress} disabled={saving}
              onChange={(event) => onProgressChange(Number(event.target.value))}
              aria-label="Tiến độ công việc" className="mb-3 w-full accent-rose-600" />
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <label className="block space-y-2 text-sm font-semibold text-slate-800">
            <span>Cập nhật công việc đang làm đến đâu</span>
            <textarea required maxLength={5000} value={comment} disabled={saving}
              onChange={(event) => onCommentChange(event.target.value)} rows={3}
              placeholder="Ví dụ: Đã hoàn thành bản nháp, đang chờ góp ý..."
              className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 font-normal text-slate-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100" />
          </label>

          {task.description && (
            <div>
              <p className="text-sm font-semibold text-slate-800">Mô tả</p>
              <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{task.description}</p>
            </div>
          )}
          <TaskHistory key={`${task.id}-${historyRevision}`} taskId={task.id}
            createdAt={task.createdAt} assignedByName={task.assignedByName} />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50">Hủy</button>
          <button type="submit" disabled={saving || !comment.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu cập nhật"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Đang tải công việc">
      {[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );
}
