"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { StatGrid } from "@/components/dashboard/DashboardWidgets";
import {
  TASK_STATUSES,
  countByStatus,
  groupByStatus,
  isOverdue,
  onTimeStats,
  weeklyCompleted,
  type StatusCounts,
  type TaskStatus,
} from "@/components/dashboard/taskMetrics";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { useUserContext } from "@/context/userContext";
import { fetchTasks, type BackendTask } from "@/lib/api";
import { DEPARTMENT_NAMES } from "@/lib/notifications";

const STATUS_STYLE: Record<TaskStatus, { label: string; bar: string; stroke: string }> = {
  TODO: { label: "Cần làm", bar: "bg-slate-400", stroke: "#94A3B8" },
  IN_PROGRESS: { label: "Đang làm", bar: "bg-blue-500", stroke: "#3B82F6" },
  DONE: { label: "Hoàn thành", bar: "bg-emerald-600", stroke: "#059669" },
};

const shortDate = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

export function ChartsPage() {
  const { user } = useUserContext();
  const isBcn = user?.role?.toUpperCase() === "BCN";
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTasks(await fetchTasks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu task.");
    } finally {
      setNow(Date.now());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = countByStatus(tasks);
  const onTime = onTimeStats(tasks);
  const overdue = tasks.filter((task) => isOverdue(task, now)).length;
  const weeks = weeklyCompleted(tasks, now);
  const groups = groupByStatus(tasks, (task) =>
    isBcn
      ? DEPARTMENT_NAMES[task.department.toUpperCase()] ?? task.departmentName
      : task.assignedToName ?? "Chưa giao",
  );

  return (
    <PageFrame
      title="Biểu đồ"
      description={
        isBcn
          ? "Thống kê task của toàn câu lạc bộ, tính từ dữ liệu thật."
          : "Thống kê task của ban bạn, tính từ dữ liệu thật."
      }
      action={
        <ActionButton
          variant="outline"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void load()}
          disabled={loading}
        >
          Tải lại
        </ActionButton>
      }
    >
      {loading && tasks.length === 0 ? (
        <p role="status" className="text-sm text-[#71717A]">Đang tải dữ liệu...</p>
      ) : null}
      {error ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {!loading && !error && tasks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-[#71717A]">
          Chưa có task nào để thống kê.
        </p>
      ) : null}

      {tasks.length > 0 ? (
        <>
          <StatGrid
            items={[
              { label: "Tổng task", value: String(counts.total) },
              { label: "Đã hoàn thành", value: String(counts.DONE), note: `${percent(counts.DONE, counts.total)}% tổng task` },
              { label: "Đang quá hạn", value: String(overdue), note: "Chưa xong và đã qua deadline", tone: overdue ? "rose" : undefined },
              {
                label: "Hoàn thành đúng hạn",
                value: onTime.rate === null ? "—" : `${onTime.rate}%`,
                note: `${onTime.onTime}/${onTime.total} task đã xong có deadline`,
              },
            ]}
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <Section
              title="Hoàn thành task theo tuần"
              subtitle={`Số task hoàn thành mỗi tuần, ${weeks.length} tuần gần nhất (${shortDate.format(weeks[0].start)} – nay). Nhãn dưới cột là ngày thứ Hai đầu tuần.`}
            >
              <WeeklyBars weeks={weeks} />
            </Section>
            <Section title="Phân bổ task theo trạng thái" subtitle="Tất cả task hiện có, đơn vị: task.">
              <StatusDonut counts={counts} />
            </Section>
          </div>
          <Section
            title={isBcn ? "Task theo ban" : "Task theo người được giao"}
            subtitle="Tất cả task hiện có. Mỗi thanh chia theo trạng thái; số bên phải là tổng task."
          >
            <StackedBars rows={groups} keyLabel={isBcn ? "Ban" : "Người được giao"} />
          </Section>
        </>
      ) : null}
    </PageFrame>
  );
}

function WeeklyBars({ weeks }: { weeks: { start: number; count: number }[] }) {
  const max = Math.max(1, ...weeks.map((week) => week.count));
  if (weeks.every((week) => week.count === 0)) {
    return (
      <p className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-[#71717A]">
        Chưa có task nào được hoàn thành trong {weeks.length} tuần qua. Cột sẽ hiện khi task chuyển sang &ldquo;Hoàn thành&rdquo;.
      </p>
    );
  }
  return (
    <>
      <div aria-hidden="true" className="flex h-64 items-end gap-3 rounded-3xl border border-slate-200/60 bg-slate-50 p-5">
        {weeks.map((week) => (
          <div key={week.start} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={`Tuần ${shortDate.format(week.start)}: ${week.count} task`}>
            <span className="text-xs font-medium text-[#18181B]">{week.count}</span>
            <div
              className="w-full max-w-10 rounded-t bg-[#E11D48]"
              style={{ height: `${(week.count / max) * 100}%`, minHeight: week.count ? 4 : 0 }}
            />
            <span className="text-[11px] text-[#71717A]">{shortDate.format(week.start)}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Số task hoàn thành theo tuần</caption>
        <thead>
          <tr><th>Tuần bắt đầu</th><th>Task hoàn thành</th></tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.start}><td>{shortDate.format(week.start)}</td><td>{week.count}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function StatusDonut({ counts }: { counts: StatusCounts }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const summary = TASK_STATUSES.map((status) => `${STATUS_STYLE[status].label} ${counts[status]}`).join(", ");
  const segments: { status: TaskStatus; length: number; offset: number }[] = [];
  let offset = 0;
  for (const status of TASK_STATUSES) {
    const length = (counts[status] / Math.max(1, counts.total)) * circumference;
    segments.push({ status, length, offset });
    offset += length;
  }
  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200/60 bg-slate-50 p-6 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 180 180" className="h-48 w-48" role="img" aria-label={`Tổng ${counts.total} task: ${summary}`}>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="18" />
        {segments.map(({ status, length, offset: start }) => {
          const dash = Math.max(0, length - (length > 4 ? 2 : 0)); // khe 2px giữa các phần
          return (
            <circle
              key={status}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={STATUS_STYLE[status].stroke}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-start}
              transform="rotate(-90 90 90)"
            >
              <title>{`${STATUS_STYLE[status].label}: ${counts[status]}`}</title>
            </circle>
          );
        })}
        <text x="90" y="88" textAnchor="middle" className="fill-[#18181B] text-3xl font-semibold">
          {counts.total}
        </text>
        <text x="90" y="110" textAnchor="middle" className="fill-[#71717A] text-xs">
          Tổng task
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {TASK_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-sm ${STATUS_STYLE[status].bar}`} />
            <span className="w-24 text-[#71717A]">{STATUS_STYLE[status].label}</span>
            <span className="font-medium text-[#18181B]">{counts[status]}</span>
            <span className="text-[#71717A]">({percent(counts[status], counts.total)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StackedBars({ rows, keyLabel }: { rows: (StatusCounts & { key: string })[]; keyLabel: string }) {
  const max = Math.max(1, ...rows.map((row) => row.total));
  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-4 text-sm text-[#71717A]">
        {TASK_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-sm ${STATUS_STYLE[status].bar}`} />
            {STATUS_STYLE[status].label}
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-4">
            <span className="w-40 shrink-0 truncate text-sm text-[#18181B]" title={row.key}>{row.key}</span>
            <div className="flex h-4 flex-1">
              <div className="flex h-full gap-0.5 overflow-hidden rounded" style={{ width: `${(row.total / max) * 100}%` }}>
                {TASK_STATUSES.filter((status) => row[status] > 0).map((status) => (
                  <span
                    key={status}
                    className={STATUS_STYLE[status].bar}
                    style={{ flexGrow: row[status] }}
                    title={`${row.key} · ${STATUS_STYLE[status].label}: ${row[status]}`}
                  />
                ))}
              </div>
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-medium text-[#18181B]">{row.total}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Số task theo {keyLabel.toLowerCase()} và trạng thái</caption>
        <thead>
          <tr>
            <th>{keyLabel}</th>
            {TASK_STATUSES.map((status) => <th key={status}>{STATUS_STYLE[status].label}</th>)}
            <th>Tổng</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{row.key}</td>
              {TASK_STATUSES.map((status) => <td key={status}>{row[status]}</td>)}
              <td>{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
