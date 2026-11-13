import type { ActivityLogEntry, BackendTask, Member, SeasonMember } from "@/lib/api";

// Thuần logic (chỉ import kiểu) để HealthDashboardPage và test node dùng chung. Mọi ngày tính theo giờ máy người xem.

const DAY = 24 * 60 * 60 * 1000;

type DeliveryTask = Pick<BackendTask, "status" | "deadline" | "completedAt">;
type OpenTask = Pick<BackendTask, "status" | "deadline" | "assignedToId">;

const isDone = (task: { status: string }) => task.status.toUpperCase() === "DONE";

/** yyyy-MM-dd theo giờ địa phương. */
export function dayKey(time: number | Date) {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** 0h thứ Hai của tuần chứa `now`. */
export function weekStart(now: number) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday.getTime();
}

function weekStarts(now: number, weeks: number) {
  const current = new Date(weekStart(now));
  return Array.from({ length: weeks }, (_, index) => {
    const start = new Date(current);
    start.setDate(start.getDate() - (weeks - 1 - index) * 7);
    return start.getTime();
  });
}

/** Task hoàn thành mỗi tuần, tách đúng hạn / trễ hạn / không có deadline. Tuần cuối là tuần hiện tại. */
export function weeklyDelivery(tasks: DeliveryTask[], now: number, weeks = 12) {
  const starts = weekStarts(now, weeks);
  const rows = starts.map((start) => ({ start, onTime: 0, late: 0, noDeadline: 0 }));
  const end = starts[starts.length - 1] + 7 * DAY + DAY; // dư một ngày cho tuần có đổi giờ
  for (const task of tasks) {
    if (!isDone(task) || !task.completedAt) continue;
    const done = new Date(task.completedAt).getTime();
    if (done < starts[0] || done >= end) continue;
    let index = rows.length - 1;
    while (index > 0 && rows[index].start > done) index -= 1;
    if (!task.deadline) rows[index].noDeadline += 1;
    else if (done <= new Date(task.deadline).getTime()) rows[index].onTime += 1;
    else rows[index].late += 1;
  }
  return rows;
}

export const AGING_BUCKETS = [
  { label: "1–3 ngày", maxDays: 3 },
  { label: "4–7 ngày", maxDays: 7 },
  { label: "8–14 ngày", maxDays: 14 },
  { label: "15–30 ngày", maxDays: 30 },
  { label: "Trên 30 ngày", maxDays: Infinity },
] as const;

/** Task chưa xong đã quá deadline, gom theo số ngày trễ (làm tròn lên). */
export function overdueAging(tasks: DeliveryTask[], now: number) {
  const counts = AGING_BUCKETS.map((bucket) => ({ label: bucket.label, count: 0 }));
  for (const task of tasks) {
    if (isDone(task) || !task.deadline) continue;
    const late = now - new Date(task.deadline).getTime();
    if (late <= 0) continue;
    const days = Math.ceil(late / DAY);
    counts[AGING_BUCKETS.findIndex((bucket) => days <= bucket.maxDays)].count += 1;
  }
  return counts;
}

export const LOGIN_TIERS = [
  { key: "week", label: "Trong 7 ngày" },
  { key: "month", label: "8–30 ngày trước" },
  { key: "stale", label: "Hơn 30 ngày" },
  { key: "never", label: "Chưa từng đăng nhập" },
] as const;

/** Thành viên đang hoạt động, chia theo lần đăng nhập gần nhất. */
export function loginTiers(members: Pick<Member, "active" | "lastLoginAt">[], now: number) {
  const counts = { week: 0, month: 0, stale: 0, never: 0 };
  for (const member of members) {
    if (!member.active) continue;
    if (!member.lastLoginAt) {
      counts.never += 1;
      continue;
    }
    const days = (now - new Date(member.lastLoginAt).getTime()) / DAY;
    counts[days <= 7 ? "week" : days <= 30 ? "month" : "stale"] += 1;
  }
  return LOGIN_TIERS.map((tier) => ({ ...tier, count: counts[tier.key] }));
}

export const WORKLOAD_BUCKETS = ["0", "1", "2", "3", "4", "5+"] as const;

/** Số task đang mở của từng thành viên hoạt động: phân bố (0…5+) và những người giữ nhiều nhất. */
export function workload(
  tasks: OpenTask[],
  members: Pick<Member, "id" | "fullName" | "active" | "department">[],
  top = 5,
) {
  const open = new Map<string, number>();
  for (const task of tasks) {
    if (isDone(task) || !task.assignedToId) continue;
    const id = task.assignedToId.toLowerCase();
    open.set(id, (open.get(id) ?? 0) + 1);
  }
  const people = members
    .filter((member) => member.active)
    .map((member) => ({ id: member.id, name: member.fullName, department: member.department, open: open.get(member.id.toLowerCase()) ?? 0 }));
  const histogram = WORKLOAD_BUCKETS.map((label) => ({ label, count: 0 }));
  for (const person of people) histogram[Math.min(person.open, 5)].count += 1;
  const busiest = people
    .filter((person) => person.open > 0)
    .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name, "vi"))
    .slice(0, top);
  return { histogram, busiest, idle: histogram[0].count, total: people.length };
}

/** Lưới lịch `weeks` tuần (cột = tuần, hàng = thứ Hai…Chủ nhật), đếm bản ghi activity log mỗi ngày. */
export function activityCalendar(logs: Pick<ActivityLogEntry, "createdAt">[], now: number, weeks = 12) {
  const perDay = new Map<string, number>();
  for (const log of logs) {
    const key = dayKey(new Date(log.createdAt));
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const today = dayKey(now);
  const columns = weekStarts(now, weeks).map((start) =>
    Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(start);
      date.setDate(date.getDate() + offset);
      const key = dayKey(date);
      return { date: key, count: perDay.get(key) ?? 0, future: key > today };
    }),
  );
  const cells = columns.flat().filter((cell) => !cell.future);
  return {
    columns,
    max: Math.max(0, ...cells.map((cell) => cell.count)),
    total: cells.reduce((sum, cell) => sum + cell.count, 0),
    activeDays: cells.filter((cell) => cell.count > 0).length,
  };
}

/** Bậc màu 0…4 cho ô heatmap: 0 = không có hoạt động, còn lại chia đều theo max. */
export function heatLevel(count: number, max: number) {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(4, Math.ceil((count / max) * 4));
}

/** `months` tháng gần nhất (yyyy-MM), tháng cuối là tháng hiện tại; cộng `valueOf` theo `keyOf`. */
export function monthlyTotals<T, K extends string>(
  items: T[],
  keys: readonly K[],
  dateOf: (item: T) => string,
  keyOf: (item: T) => K,
  valueOf: (item: T) => number,
  now: number,
  months = 6,
) {
  const current = new Date(now);
  const rows = Array.from({ length: months }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - (months - 1 - index), 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { month, ...Object.fromEntries(keys.map((key) => [key, 0])) } as { month: string } & Record<K, number>;
  });
  const byMonth = new Map(rows.map((row) => [row.month, row]));
  for (const item of items) {
    const row = byMonth.get(dateOf(item).slice(0, 7));
    const key = keyOf(item);
    if (row && keys.includes(key)) (row as Record<K, number>)[key] += valueOf(item);
  }
  return rows;
}

/** Thành viên của nhiệm kỳ trước còn ở lại nhiệm kỳ sau, tổng và theo ban cũ. */
export function seasonRetention(
  previous: Pick<SeasonMember, "userId" | "department" | "leftAt">[],
  current: Pick<SeasonMember, "userId" | "leftAt">[],
) {
  const stayed = new Set(current.filter((member) => !member.leftAt).map((member) => member.userId));
  const byDepartment = new Map<string, { retained: number; total: number }>();
  let retained = 0;
  for (const member of previous) {
    const key = member.department?.toUpperCase() || "KHAC";
    const bucket = byDepartment.get(key) ?? { retained: 0, total: 0 };
    bucket.total += 1;
    if (stayed.has(member.userId)) {
      bucket.retained += 1;
      retained += 1;
    }
    byDepartment.set(key, bucket);
  }
  return {
    retained,
    total: previous.length,
    rate: previous.length ? Math.round((retained / previous.length) * 100) : null,
    byDepartment: [...byDepartment.entries()]
      .map(([department, value]) => ({ department, ...value, rate: Math.round((value.retained / value.total) * 100) }))
      .sort((a, b) => a.rate - b.rate || b.total - a.total),
  };
}

export const RANGE_PRESETS = [
  { key: "4w", label: "4 tuần", weeks: 4, months: 2 },
  { key: "3m", label: "3 tháng", weeks: 13, months: 3 },
  { key: "6m", label: "6 tháng", weeks: 26, months: 6 },
  { key: "12m", label: "12 tháng", weeks: 52, months: 12 },
] as const;
export type RangeKey = (typeof RANGE_PRESETS)[number]["key"] | "custom";

const parseDay = (value: string | null | undefined) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Khoảng thời gian của bộ lọc: `start` là 0h ngày đầu, `end` là cuối ngày cuối (hoặc lúc này),
 * kèm số tuần / số tháng cho các biểu đồ. Tùy chỉnh sai hoặc đảo ngược thì rơi về 3 tháng.
 */
export function resolveRange(key: string | null, from: string | null, to: string | null, now: number) {
  if (key === "custom") {
    const start = parseDay(from);
    const endDay = parseDay(to);
    if (start && endDay && start <= endDay) {
      const end = Math.min(now, new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate(), 23, 59, 59, 999).getTime());
      const weeks = Math.min(104, Math.max(1, Math.ceil((weekStart(end) - weekStart(start.getTime())) / (7 * DAY)) + 1));
      const months = Math.min(24, (endDay.getFullYear() - start.getFullYear()) * 12 + endDay.getMonth() - start.getMonth() + 1);
      const show = (day: Date) => `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}/${day.getFullYear()}`;
      return { key: "custom" as RangeKey, start: start.getTime(), end, weeks, months, label: `${show(start)} – ${show(endDay)}` };
    }
  }
  const preset = RANGE_PRESETS.find((item) => item.key === key) ?? RANGE_PRESETS[1];
  const start = new Date(weekStart(now));
  start.setDate(start.getDate() - (preset.weeks - 1) * 7);
  return { key: preset.key as RangeKey, start: start.getTime(), end: now, weeks: preset.weeks, months: preset.months, label: preset.label };
}

/** Thời điểm nằm trong khoảng [start, end]. */
export function inRange(value: string | null | undefined, range: { start: number; end: number }) {
  if (!value) return false;
  const time = new Date(value.length === 10 ? `${value}T00:00:00` : value).getTime();
  return time >= range.start && time <= range.end;
}
