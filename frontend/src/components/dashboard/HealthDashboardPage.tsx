"use client";

import Link from "next/link";
import { AlertTriangle, CircleCheck, RefreshCw, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { eventBudgetRows } from "@/components/dashboard/financeMetrics";
import {
  CalendarHeatmap,
  ColumnChart,
  DataTable,
  MeterList,
  SegmentedBar,
  VIZ,
  type Series,
} from "@/components/dashboard/HealthCharts";
import {
  AGING_BUCKETS,
  RANGE_PRESETS,
  activityCalendar,
  dayKey,
  inRange,
  loginTiers,
  monthlyTotals,
  overdueAging,
  resolveRange,
  seasonRetention,
  weeklyDelivery,
  workload,
} from "@/components/dashboard/healthMetrics";
import { PLATFORM_META } from "@/components/dashboard/PublicationsPage";
import { isOverdue, onTimeStats } from "@/components/dashboard/taskMetrics";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { ROUTES } from "@/constants/routes";
import {
  fetchActivityLogs,
  fetchEvents,
  fetchMembers,
  fetchPublications,
  fetchSeasonMembers,
  fetchSeasons,
  fetchTasks,
  fetchTransactions,
  type ActivityLogEntry,
  type BackendTask,
  type ClubEvent,
  type FinanceTransaction,
  type Member,
  type Publication,
  type PublicationPlatform,
  type Season,
  type SeasonMember,
} from "@/lib/api";
import { refreshApiCache } from "@/lib/requestCache";
import { DEPARTMENT_NAMES } from "@/lib/notifications";

type Sources = {
  members: Member[] | null;
  tasks: BackendTask[] | null;
  publications: Publication[] | null;
  events: ClubEvent[] | null;
  logs: ActivityLogEntry[] | null;
  transactions: FinanceTransaction[] | null;
  seasons: { previous: Season; current: Season; previousMembers: SeasonMember[]; currentMembers: SeasonMember[] } | null;
};

const SOURCE_LABELS: Record<keyof Sources, string> = {
  members: "thành viên",
  tasks: "task",
  publications: "ấn phẩm",
  events: "sự kiện",
  logs: "nhật ký hoạt động",
  transactions: "tài chính",
  seasons: "nhiệm kỳ",
};

const EMPTY: Sources = {
  members: null,
  tasks: null,
  publications: null,
  events: null,
  logs: null,
  transactions: null,
  seasons: null,
};
const MAX_OVERDUE_ALERTS = 5;

const dateOnly = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const shortDate = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });
const timeOnly = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" });
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const compactMoney = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

const departmentName = (key: string) => DEPARTMENT_NAMES[key] ?? key;
const monthLabel = (month: string) => `Th${Number(month.slice(5, 7))}/${month.slice(2, 4)}`;

const DELIVERY_SERIES: Series[] = [
  { key: "onTime", label: "Đúng hạn", color: VIZ.aqua },
  { key: "late", label: "Trễ hạn", color: VIZ.red },
  { key: "noDeadline", label: "Không có deadline", color: VIZ.neutral },
];
const PLATFORM_ORDER: PublicationPlatform[] = ["FACEBOOK", "INSTAGRAM", "YOUTUBE", "TIKTOK", "OTHER"];
const PLATFORM_SERIES: Series[] = PLATFORM_ORDER.map((key, index) => ({
  key,
  label: PLATFORM_META[key].label,
  color: [VIZ.blue, VIZ.orange, VIZ.aqua, VIZ.yellow, VIZ.magenta][index],
}));
const CASH_SERIES: Series[] = [
  { key: "INCOME", label: "Thu", color: VIZ.aqua },
  { key: "EXPENSE", label: "Chi", color: VIZ.red },
];
const TIER_STYLE = {
  week: { color: VIZ.ordinal[0], ink: "light" },
  month: { color: VIZ.ordinal[1], ink: "light" },
  stale: { color: VIZ.ordinal[2], ink: "dark" },
  never: { color: VIZ.neutral, ink: "dark" },
} as const;

async function loadSeasons() {
  const seasons = [...(await fetchSeasons())].sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (seasons.length < 2) return null;
  const [previous, current] = seasons.slice(-2);
  const [previousMembers, currentMembers] = await Promise.all([fetchSeasonMembers(previous.id), fetchSeasonMembers(current.id)]);
  return { previous, current, previousMembers, currentMembers };
}

function Unavailable({ source }: { source: string }) {
  return <p className="text-sm text-[#71717A]">Không tải được dữ liệu {source}, nên biểu đồ này tạm ẩn.</p>;
}

function Tile({ label, value, note, alert }: { label: string; value: string; note?: ReactNode; alert?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${alert ? "border-rose-200 bg-rose-50/60" : "border-slate-200/70 bg-white"}`}>
      <p className="flex items-center gap-1.5 text-sm text-[#52514e]">
        {alert ? <AlertTriangle className="h-4 w-4 text-[#d03b3b]" aria-hidden /> : null}
        {label}
      </p>
      <p className={`mt-1.5 text-3xl font-semibold tracking-tight ${alert ? "text-[#b42323]" : "text-[#18181B]"}`}>{value}</p>
      {note ? <p className="mt-1 text-xs leading-5 text-[#52514e]">{note}</p> : null}
    </div>
  );
}

export function HealthDashboardPage() {
  const [data, setData] = useState<Sources>(EMPTY);
  const [failures, setFailures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // allSettled: một nguồn lỗi chỉ ẩn phần của nó; giữ khung cũ trong lúc tải lại.
  const load = useCallback(
    () =>
      Promise.allSettled([
        fetchMembers(),
        fetchTasks(),
        fetchPublications(),
        fetchEvents(),
        fetchActivityLogs(500),
        fetchTransactions(),
        loadSeasons(),
      ]).then((results) => {
        const keys = Object.keys(EMPTY) as (keyof Sources)[];
        const next = { ...EMPTY } as Record<keyof Sources, unknown>;
        const failed: string[] = [];
        results.forEach((result, index) => {
          if (result.status === "fulfilled") next[keys[index]] = result.value;
          else failed.push(`${SOURCE_LABELS[keys[index]]} (${result.reason instanceof Error ? result.reason.message : "lỗi không xác định"})`);
        });
        setData(next as Sources);
        setFailures(failed);
        setNow(Date.now());
        setLoading(false);
      }),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const { members, tasks, publications, events, logs, transactions, seasons } = data;
  const loaded = !loading || Object.values(data).some((value) => value !== null);

  // ── Bộ lọc (lưu trên URL để tải lại hoặc gửi link vẫn giữ) ───────────────
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawRange = searchParams.get("range");
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const range = resolveRange(rawRange, fromParam, toParam, now);
  const customInvalid = rawRange === "custom" && range.key !== "custom";
  const deptParam = (searchParams.get("dept") ?? "").toUpperCase();
  const dept = DEPARTMENT_NAMES[deptParam] ? deptParam : "";
  const filtering = Boolean(rawRange || dept);
  const inDept = (value?: string | null) => !dept || value?.toUpperCase() === dept;
  const deptLabel = dept ? departmentName(dept) : "Tất cả ban";

  function setFilter(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // ── Dữ liệu theo ban; dữ liệu theo thời gian lọc thêm theo khoảng ───────────
  const scopedTasks = tasks?.filter((task) => inDept(task.department)) ?? null;
  const scopedMembers = members?.filter((member) => inDept(member.department)) ?? null;
  const scopedPublications = publications?.filter((item) => inDept(item.department)) ?? null;
  const completedInRange = (scopedTasks ?? []).filter((task) => inRange(task.completedAt, range));

  // ── Chỉ số ───────────────────────────────────────────────────────────────
  const activeMembers = scopedMembers?.filter((member) => member.active) ?? [];
  const pausedMembers = (scopedMembers?.length ?? 0) - activeMembers.length;
  const tiers = scopedMembers ? loginTiers(scopedMembers, now) : [];
  const loggedIn30 = tiers.filter((tier) => tier.key === "week" || tier.key === "month").reduce((sum, tier) => sum + tier.count, 0);
  const onTime = scopedTasks ? onTimeStats(completedInRange) : null;
  const overdueTasks = (scopedTasks ?? [])
    .filter((task) => isOverdue(task, now))
    .sort((a, b) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime());
  const oldestOverdueDays = overdueTasks[0]?.deadline
    ? Math.ceil((now - new Date(overdueTasks[0].deadline).getTime()) / 86_400_000)
    : 0;
  const upcomingEvents = (events ?? [])
    .filter((event) => event.status !== "FINISHED" && new Date(event.eventDate).getTime() >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const delivery = scopedTasks ? weeklyDelivery(completedInRange, range.end, range.weeks) : [];
  const aging = scopedTasks ? overdueAging(scopedTasks, now) : [];
  const load_ = scopedTasks && scopedMembers ? workload(scopedTasks, scopedMembers) : null;
  const rangeLogs = logs?.filter((log) => inRange(log.createdAt, range)) ?? null;
  const calendar = rangeLogs ? activityCalendar(rangeLogs, range.end, range.weeks) : null;
  const retention = seasons
    ? seasonRetention(seasons.previousMembers.filter((member) => inDept(member.department)), seasons.currentMembers)
    : null;
  const rangePublications = (scopedPublications ?? []).filter((item) => inRange(item.postedAt, range));
  const publicationMonths = scopedPublications
    ? monthlyTotals(rangePublications, PLATFORM_ORDER, (p) => p.postedAt, (p) => p.platform, () => 1, range.end, range.months)
    : [];
  const cashMonths = transactions
    ? monthlyTotals(
        transactions.filter((t) => inRange(t.transactionDate, range)),
        ["INCOME", "EXPENSE"] as const,
        (t) => t.transactionDate,
        (t) => t.type,
        (t) => Number(t.amount) || 0,
        range.end,
        range.months,
      )
    : [];
  const overBudget = !dept && transactions && events ? eventBudgetRows(transactions, events).filter((row) => row.usage.tone === "over") : [];

  const departmentKeys = Object.keys(DEPARTMENT_NAMES).filter(
    (key) => key !== "BCN" || key === dept || (tasks ?? []).some((task) => task.department.toUpperCase() === "BCN"),
  );
  // Bảng luôn so sánh mọi ban (ban đang lọc được tô sáng); số liệu theo thời gian dùng khoảng đã chọn.
  const departments = departmentKeys
    .map((key) => {
      const departmentTasks = (tasks ?? []).filter((task) => task.department.toUpperCase() === key);
      return {
        key,
        members: (members ?? []).filter((member) => member.active && member.department?.toUpperCase() === key).length,
        open: departmentTasks.filter((task) => task.status.toUpperCase() !== "DONE").length,
        overdue: departmentTasks.filter((task) => isOverdue(task, now)).length,
        onTime: onTimeStats(departmentTasks.filter((task) => inRange(task.completedAt, range))),
        publications: (publications ?? []).filter((item) => item.department.toUpperCase() === key && inRange(item.postedAt, range)).length,
      };
    })
    .sort((a, b) => b.overdue - a.overdue || (a.onTime.rate ?? 101) - (b.onTime.rate ?? 101));

  // ── Cần xử lý ────────────────────────────────────────────────────────────
  const alerts: { key: string; title: string; detail: string; href?: string; severity: "critical" | "warning" }[] = [
    ...overdueTasks.slice(0, MAX_OVERDUE_ALERTS).map((task) => ({
      key: `task-${task.id}`,
      title: `Quá hạn: ${task.title}`,
      detail: `${departmentName(task.department.toUpperCase())} · ${task.assignedToName ?? "Chưa giao"} · hạn ${task.deadline ? dateOnly.format(new Date(task.deadline)) : "—"}`,
      severity: "critical" as const,
    })),
    ...(overdueTasks.length > MAX_OVERDUE_ALERTS
      ? [{ key: "more", title: `Còn ${overdueTasks.length - MAX_OVERDUE_ALERTS} task quá hạn khác`, detail: "Xem phân bố theo ban bên dưới.", severity: "critical" as const }]
      : []),
    ...overBudget.map((row) => ({
      key: `budget-${row.eventId}`,
      title: `${row.title} vượt dự toán ${Math.round((row.usage.ratio ?? 0) * 100 - 100)}%`,
      detail: `Đã chi ${money.format(row.expense)} trên dự toán ${money.format(row.budget)}.`,
      href: ROUTES.finance,
      severity: "critical" as const,
    })),
    ...departments
      .filter((row) => inDept(row.key) && row.onTime.rate !== null && row.onTime.rate < 50)
      .map((row) => ({
        key: `ontime-${row.key}`,
        title: `${departmentName(row.key)}: chỉ ${row.onTime.rate}% task đúng hạn`,
        detail: `${row.onTime.onTime}/${row.onTime.total} task xong trong ${range.label.toLowerCase()} được hoàn thành đúng hạn.`,
        severity: "warning" as const,
      })),
    ...(members
      ? Object.keys(DEPARTMENT_NAMES)
          .filter((key) => key !== "BCN" && inDept(key))
          .filter(
            (key) =>
              !members.some(
                (member) => member.active && member.role.toUpperCase() === "TRUONG_BAN" && member.department?.toUpperCase() === key,
              ),
          )
          .map((key) => ({
            key: `lead-${key}`,
            title: `${departmentName(key)} chưa có trưởng ban đang hoạt động`,
            detail: "Phân quyền trưởng ban trong trang Thành viên.",
            href: ROUTES.members,
            severity: "warning" as const,
          }))
      : []),
  ];

  return (
    <PageFrame
      title="Sức khỏe câu lạc bộ"
      description="Tiến độ, con người, nhịp hoạt động, nội dung và tài chính, tính từ dữ liệu thật trong hệ thống."
      action={
        <div className="flex items-center gap-3">
          {loaded ? <span className="text-xs text-[#71717A]">Cập nhật {timeOnly.format(now)}</span> : null}
          <ActionButton
            variant="outline"
            icon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}
            onClick={() => {
              setLoading(true);
              refreshApiCache();
              void load();
            }}
            disabled={loading}
          >
            Tải lại
          </ActionButton>
        </div>
      }
    >
      {!loaded ? (
        <p role="status" className="text-sm text-[#71717A]">
          Đang tải dữ liệu…
        </p>
      ) : (
        <div className={`grid grid-cols-[minmax(0,1fr)] gap-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {failures.length > 0 ? (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Không tải được dữ liệu {failures.join(", ")}. Các phần liên quan hiển thị &ldquo;—&rdquo; hoặc tạm ẩn.
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div role="group" aria-label="Khoảng thời gian" className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  aria-pressed={range.key === preset.key && !customInvalid}
                  onClick={() => setFilter({ range: preset.key === "3m" ? null : preset.key, from: null, to: null })}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    range.key === preset.key && !customInvalid ? "bg-white text-[#18181B] shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-[#52514e] hover:text-[#18181B]"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={rawRange === "custom"}
                onClick={() => setFilter({ range: "custom", from: fromParam || dayKey(range.start), to: toParam || dayKey(now) })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  rawRange === "custom" ? "bg-white text-[#18181B] shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-[#52514e] hover:text-[#18181B]"
                }`}
              >
                Tùy chỉnh
              </button>
            </div>

            {rawRange === "custom" ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#52514e]">
                <label className="flex items-center gap-2">
                  Từ
                  <input
                    type="date"
                    value={fromParam}
                    max={toParam || dayKey(now)}
                    aria-invalid={customInvalid}
                    aria-describedby={customInvalid ? "health-range-error" : undefined}
                    onChange={(event) => setFilter({ from: event.target.value })}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-[#18181B] outline-none focus:border-[#E11D48] aria-[invalid=true]:border-rose-400"
                  />
                </label>
                <label className="flex items-center gap-2">
                  đến
                  <input
                    type="date"
                    value={toParam}
                    min={fromParam || undefined}
                    max={dayKey(now)}
                    aria-invalid={customInvalid}
                    aria-describedby={customInvalid ? "health-range-error" : undefined}
                    onChange={(event) => setFilter({ to: event.target.value })}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-[#18181B] outline-none focus:border-[#E11D48] aria-[invalid=true]:border-rose-400"
                  />
                </label>
                {customInvalid ? (
                  <span id="health-range-error" role="alert" className="text-xs text-rose-700">
                    Chọn ngày bắt đầu trước ngày kết thúc. Đang tạm hiện 3 tháng gần nhất.
                  </span>
                ) : null}
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-[#52514e]">
              Ban
              <select
                value={dept}
                onChange={(event) => setFilter({ dept: event.target.value || null })}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-[#18181B] outline-none focus:border-[#E11D48]"
              >
                <option value="">Tất cả ban</option>
                {Object.entries(DEPARTMENT_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            {filtering ? (
              <button
                type="button"
                onClick={() => setFilter({ range: null, from: null, to: null, dept: null })}
                className="inline-flex items-center gap-1 self-start rounded-md px-2 py-1.5 text-sm font-medium text-[#BE123C] hover:bg-rose-50 lg:self-auto"
              >
                <X className="h-4 w-4" aria-hidden />
                Đặt lại
              </button>
            ) : null}

            <p className="text-xs text-[#71717A] lg:ml-auto" aria-live="polite">
              Đang xem: <strong className="font-medium text-[#18181B]">{range.label}</strong> ·{" "}
              <strong className="font-medium text-[#18181B]">{deptLabel}</strong>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Tile
              label="Thành viên hoạt động"
              value={members ? String(activeMembers.length) : "—"}
              note={members ? `Hiện tại · ${pausedMembers} tài khoản tạm nghỉ` : undefined}
            />
            <Tile
              label="Đăng nhập trong 30 ngày"
              value={members && activeMembers.length ? `${Math.round((loggedIn30 / activeMembers.length) * 100)}%` : "—"}
              note={members ? `${loggedIn30}/${activeMembers.length} thành viên hoạt động` : undefined}
            />
            <Tile
              label="Hoàn thành đúng hạn"
              value={onTime?.rate != null ? `${onTime.rate}%` : "—"}
              note={onTime ? `${onTime.onTime}/${onTime.total} task xong có deadline trong ${range.label.toLowerCase()}` : undefined}
            />
            <Tile
              label="Task quá hạn"
              value={tasks ? String(overdueTasks.length) : "—"}
              note={tasks ? (overdueTasks.length ? `Hiện tại · cũ nhất đã trễ ${oldestOverdueDays} ngày` : "Hiện tại không có task trễ hạn") : undefined}
              alert={overdueTasks.length > 0}
            />
            <Tile
              label="Sự kiện sắp tới"
              value={events ? String(upcomingEvents.length) : "—"}
              note={upcomingEvents[0] ? `Gần nhất: ${upcomingEvents[0].title} · ${dateOnly.format(new Date(upcomingEvents[0].eventDate))}` : events ? "Chưa có sự kiện nào" : undefined}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Section title="Cần xử lý" subtitle={alerts.length ? `${alerts.length} việc, nghiêm trọng nhất ở trên.` : "Tự động rút ra từ dữ liệu."}>
              {alerts.length ? (
                <ul className="divide-y divide-slate-100">
                  {alerts.map((alert) => (
                    <li key={alert.key} className="flex items-start gap-3 py-2.5">
                      <AlertTriangle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${alert.severity === "critical" ? "text-[#d03b3b]" : "text-[#b7791f]"}`}
                        aria-label={alert.severity === "critical" ? "Nghiêm trọng" : "Cảnh báo"}
                      />
                      <div className="min-w-0 flex-1 text-sm">
                        {alert.href ? (
                          <Link href={alert.href} className="font-medium text-[#18181B] hover:underline">
                            {alert.title}
                          </Link>
                        ) : (
                          <p className="font-medium text-[#18181B]">{alert.title}</p>
                        )}
                        <p className="text-[#52514e]">{alert.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-sm text-emerald-800">
                  <CircleCheck className="h-4 w-4" aria-hidden />
                  Không có việc gì cần xử lý gấp.
                </p>
              )}
            </Section>

            <Section
              title="Nhịp hoạt động"
              subtitle={
                calendar
                  ? `Số thao tác ghi vào nhật ký mỗi ngày, ${range.label.toLowerCase()}: ${calendar.total} thao tác trong ${calendar.activeDays} ngày.${
                      dept ? " Nhật ký không ghi ban nên phần này không lọc theo ban." : ""
                    }${logs && logs.length >= 500 ? " Chỉ tính 500 thao tác mới nhất." : ""}`
                  : "Số thao tác ghi vào nhật ký mỗi ngày."
              }
            >
              {calendar ? (
                <>
                  <CalendarHeatmap columns={calendar.columns} max={calendar.max} />
                  {calendar.total === 0 ? (
                    <p className="mt-2 text-sm text-[#71717A]">Không có thao tác nào trong khoảng thời gian này.</p>
                  ) : null}
                  <DataTable
                    caption="Số thao tác theo tuần"
                    head={["Tuần bắt đầu", "Thao tác", "Ngày có hoạt động"]}
                    rows={calendar.columns.map((week) => [
                      shortDate.format(new Date(`${week[0].date}T00:00:00`)),
                      String(week.reduce((sum, cell) => sum + cell.count, 0)),
                      String(week.filter((cell) => cell.count > 0).length),
                    ])}
                  />
                </>
              ) : (
                <Unavailable source="nhật ký hoạt động" />
              )}
            </Section>
          </div>

          <h2 className="-mb-2 mt-2 text-lg font-semibold text-[#18181B]">Tiến độ công việc</h2>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Section
              title="Task hoàn thành mỗi tuần"
              subtitle={`Đơn vị: task. ${range.weeks} tuần (${range.label.toLowerCase()}), tuần bắt đầu thứ Hai; nhãn là ngày đầu tuần.`}
            >
              {tasks ? (
                <ColumnChart
                  rows={delivery.map((week) => ({
                    key: String(week.start),
                    label: shortDate.format(week.start),
                    values: { onTime: week.onTime, late: week.late, noDeadline: week.noDeadline },
                  }))}
                  series={DELIVERY_SERIES}
                  unit="task"
                  caption="Task hoàn thành mỗi tuần theo đúng hạn, trễ hạn, không có deadline"
                />
              ) : (
                <Unavailable source="task" />
              )}
            </Section>
            <Section title="Task quá hạn đã trễ bao lâu" subtitle="Đơn vị: task chưa xong. Hiện tại, không phụ thuộc khoảng thời gian.">
              {tasks ? (
                overdueTasks.length ? (
                  <ColumnChart
                    rows={aging.map((bucket) => ({ key: bucket.label, label: bucket.label, values: { count: bucket.count } }))}
                    series={[{ key: "count", label: "Task quá hạn", color: VIZ.critical }]}
                    unit="task"
                    caption={`Task quá hạn theo số ngày trễ: ${AGING_BUCKETS.map((b) => b.label).join(", ")}`}
                  />
                ) : (
                  <p className="flex items-center gap-2 text-sm text-emerald-800">
                    <CircleCheck className="h-4 w-4" aria-hidden />
                    Không có task nào quá hạn.
                  </p>
                )
              ) : (
                <Unavailable source="task" />
              )}
            </Section>
          </div>

          <h2 className="-mb-2 mt-2 text-lg font-semibold text-[#18181B]">Con người</h2>
          <div className="grid gap-6 xl:grid-cols-3">
            <Section title="Mức tham gia" subtitle="Hiện tại: thành viên hoạt động theo lần đăng nhập gần nhất.">
              {members ? (
                <SegmentedBar
                  caption="Thành viên theo lần đăng nhập gần nhất"
                  parts={tiers.map((tier) => ({ ...tier, ...TIER_STYLE[tier.key] }))}
                />
              ) : (
                <Unavailable source="thành viên" />
              )}
            </Section>
            <Section
              title="Khối lượng việc"
              subtitle={load_ ? `Hiện tại: số thành viên theo số task đang mở. ${load_.idle}/${load_.total} người chưa có task nào.` : "Hiện tại: số thành viên theo số task đang mở."}
            >
              {load_ ? (
                <>
                  <ColumnChart
                    rows={load_.histogram.map((bucket) => ({ key: bucket.label, label: `${bucket.label} task`, values: { count: bucket.count } }))}
                    series={[{ key: "count", label: "Thành viên", color: VIZ.blue }]}
                    unit="thành viên"
                    height={128}
                    caption="Số thành viên theo số task đang mở"
                  />
                  <h3 className="mb-2 mt-4 text-sm font-medium text-[#52514e]">Đang giữ nhiều task nhất</h3>
                  <MeterList
                    emptyText="Chưa ai có task đang mở."
                    rows={load_.busiest.map((person) => ({
                      key: person.id,
                      label: person.name,
                      hint: `${person.name} · ${departmentName(person.department?.toUpperCase() ?? "")}`,
                      ratio: person.open / Math.max(1, load_.busiest[0]?.open ?? 1),
                      figure: `${person.open} task`,
                    }))}
                  />
                </>
              ) : (
                <Unavailable source="task hoặc thành viên" />
              )}
            </Section>
            <Section
              title="Giữ chân qua nhiệm kỳ"
              subtitle={seasons ? `Thành viên ${seasons.previous.name} còn ở lại ${seasons.current.name}.` : "So sánh hai nhiệm kỳ gần nhất."}
            >
              {retention && seasons ? (
                <>
                  <p className="text-3xl font-semibold tracking-tight text-[#18181B]">{retention.rate === null ? "—" : `${retention.rate}%`}</p>
                  <p className="mb-4 text-xs text-[#52514e]">
                    {retention.retained}/{retention.total} thành viên ở lại
                  </p>
                  <MeterList
                    emptyText="Nhiệm kỳ trước chưa có thành viên."
                    rows={retention.byDepartment.map((row) => ({
                      key: row.department,
                      label: departmentName(row.department),
                      ratio: row.rate / 100,
                      figure: `${row.rate}% · ${row.retained}/${row.total}`,
                    }))}
                  />
                </>
              ) : data.seasons === null && failures.some((f) => f.startsWith("nhiệm kỳ")) ? (
                <Unavailable source="nhiệm kỳ" />
              ) : (
                <p className="text-sm text-[#71717A]">
                  Cần ít nhất hai nhiệm kỳ để so sánh. Tạo nhiệm kỳ trong trang{" "}
                  <Link href={ROUTES.tenure} className="font-medium text-[#BE123C] hover:underline">
                    Nhiệm kỳ
                  </Link>
                  .
                </p>
              )}
            </Section>
          </div>

          <h2 className="-mb-2 mt-2 text-lg font-semibold text-[#18181B]">Theo ban</h2>
          <Section
            title="So sánh các ban"
            subtitle={`Luôn so sánh mọi ban${dept ? `, ${departmentName(dept)} được tô sáng` : ""}. Đúng hạn và ấn phẩm tính trong ${range.label.toLowerCase()}; task mở và quá hạn là hiện tại.`}
          >
            {tasks || members ? (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs text-[#52514e]">
                    <tr>
                      <th scope="col" className="py-2 pr-4 font-medium">Ban</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Thành viên</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Task đang mở</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Quá hạn</th>
                      <th scope="col" className="w-64 px-3 py-2 font-medium">Hoàn thành đúng hạn</th>
                      <th scope="col" className="py-2 pl-3 text-right font-medium">Ấn phẩm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {departments.map((row) => (
                      <tr key={row.key} aria-current={row.key === dept ? "true" : undefined} className={row.key === dept ? "bg-rose-50/70" : ""}>
                        <th scope="row" className="py-2.5 pr-4 font-medium text-[#18181B]">{departmentName(row.key)}</th>
                        <td className="px-3 py-2.5 text-right">{members ? row.members : "—"}</td>
                        <td className="px-3 py-2.5 text-right">{tasks ? row.open : "—"}</td>
                        <td className="px-3 py-2.5 text-right">
                          {tasks ? (
                            row.overdue ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[#b42323]">
                                <AlertTriangle className="h-3.5 w-3.5" aria-label="Có task quá hạn" />
                                {row.overdue}
                              </span>
                            ) : (
                              "0"
                            )
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.onTime.rate === null ? (
                            <span className="text-xs text-[#71717A]">Chưa có task xong có deadline</span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7eefa]" aria-hidden>
                                <span className="block h-full rounded-full" style={{ width: `${row.onTime.rate}%`, background: VIZ.blue }} />
                              </span>
                              <span className="w-24 text-right text-xs text-[#18181B]">
                                {row.onTime.rate}% · {row.onTime.onTime}/{row.onTime.total}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pl-3 text-right">{publications ? row.publications : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Unavailable source="task và thành viên" />
            )}
          </Section>

          <h2 className="-mb-2 mt-2 text-lg font-semibold text-[#18181B]">Nội dung và tài chính</h2>
          <div className="grid gap-6 xl:grid-cols-2">
            <Section
              title="Ấn phẩm mỗi tháng"
              subtitle={`Đơn vị: bài đăng, chia theo nền tảng. ${range.label}: ${rangePublications.length} bài${dept ? ` của ${departmentName(dept)}` : ""}.`}
            >
              {scopedPublications ? (
                <ColumnChart
                  rows={publicationMonths.map(({ month, ...values }) => ({ key: month, label: monthLabel(month), values }))}
                  series={PLATFORM_SERIES}
                  unit="bài đăng"
                  caption="Ấn phẩm mỗi tháng theo nền tảng"
                />
              ) : (
                <Unavailable source="ấn phẩm" />
              )}
            </Section>
            <Section
              title="Dòng tiền mỗi tháng"
              subtitle={`Đơn vị: VND. Tổng thu và tổng chi theo tháng, ${range.label.toLowerCase()}.${dept ? " Giao dịch không ghi ban nên không lọc theo ban." : ""}`}
            >
              {transactions ? (
                <ColumnChart
                  rows={cashMonths.map(({ month, ...values }) => ({ key: month, label: monthLabel(month), values }))}
                  series={CASH_SERIES}
                  mode="grouped"
                  unit="VND"
                  format={(value) => (value >= 1_000_000 ? `${compactMoney.format(value)} ₫` : money.format(value))}
                  caption="Thu và chi mỗi tháng"
                />
              ) : (
                <Unavailable source="tài chính" />
              )}
            </Section>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
