import type { BackendTask } from "@/lib/api";

// Thuần logic (không import runtime) để ChartsPage, HealthDashboardPage và test node dùng chung.

type MetricTask = Pick<BackendTask, "status" | "deadline" | "completedAt">;

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const DAY = 24 * 60 * 60 * 1000;

export function taskStatus(task: MetricTask): TaskStatus {
  const status = task.status.toUpperCase();
  return status === "DONE" || status === "IN_PROGRESS" ? status : "TODO";
}

export function isOverdue(task: MetricTask, now: number) {
  return taskStatus(task) !== "DONE" && !!task.deadline && new Date(task.deadline).getTime() < now;
}

/** Chỉ tính task đã xong có cả deadline lẫn completedAt; task không có deadline thì không thể "trễ" nên bỏ khỏi mẫu số. */
export function onTimeStats(tasks: MetricTask[]) {
  let total = 0;
  let onTime = 0;
  for (const task of tasks) {
    if (taskStatus(task) !== "DONE" || !task.deadline || !task.completedAt) continue;
    total += 1;
    if (new Date(task.completedAt).getTime() <= new Date(task.deadline).getTime()) onTime += 1;
  }
  return { onTime, total, rate: total ? Math.round((onTime / total) * 100) : null };
}

/** 8 tuần gần nhất (tuần bắt đầu thứ Hai, giờ máy người xem), tuần cuối là tuần hiện tại. */
export function weeklyCompleted(tasks: MetricTask[], now: number) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(monday);
    start.setDate(start.getDate() - (7 - index) * 7);
    return { start: start.getTime(), count: 0 };
  });
  const end = monday.getTime() + 7 * DAY;
  for (const task of tasks) {
    if (taskStatus(task) !== "DONE" || !task.completedAt) continue;
    const time = new Date(task.completedAt).getTime();
    if (time < weeks[0].start || time >= end) continue;
    let index = weeks.length - 1;
    while (weeks[index].start > time) index -= 1;
    weeks[index].count += 1;
  }
  return weeks;
}

export type StatusCounts = Record<TaskStatus, number> & { total: number };

export function countByStatus(tasks: MetricTask[]): StatusCounts {
  const counts: StatusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0, total: tasks.length };
  for (const task of tasks) counts[taskStatus(task)] += 1;
  return counts;
}

/** Gom task theo khóa (ban hoặc người được giao), nhiều task nhất lên đầu. */
export function groupByStatus<T extends MetricTask>(tasks: T[], keyOf: (task: T) => string) {
  const groups = new Map<string, T[]>();
  for (const task of tasks) {
    const key = keyOf(task);
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return [...groups.entries()]
    .map(([key, items]) => ({ key, ...countByStatus(items) }))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key, "vi"));
}
