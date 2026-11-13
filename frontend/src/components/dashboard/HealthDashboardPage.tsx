"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DetailList, StatGrid, TableCard } from "@/components/dashboard/DashboardWidgets";
import { isOverdue, onTimeStats } from "@/components/dashboard/taskMetrics";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import {
  fetchEvents,
  fetchMembers,
  fetchPublications,
  fetchTasks,
  type BackendTask,
  type ClubEvent,
  type Member,
  type Publication,
} from "@/lib/api";
import { DEPARTMENT_NAMES } from "@/lib/notifications";

type Sources = {
  members: Member[] | null;
  tasks: BackendTask[] | null;
  publications: Publication[] | null;
  events: ClubEvent[] | null;
};

const SOURCE_LABELS: Record<keyof Sources, string> = {
  members: "thành viên",
  tasks: "task",
  publications: "ấn phẩm",
  events: "sự kiện",
};

const emptySources: Sources = { members: null, tasks: null, publications: null, events: null };
const MAX_OVERDUE_ALERTS = 5;

const dateOnly = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function departmentName(key: string) {
  return DEPARTMENT_NAMES[key] ?? key;
}

export function HealthDashboardPage() {
  const [data, setData] = useState<Sources>(emptySources);
  const [failures, setFailures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // loading=true do state ban đầu hoặc nút "Tải lại" đặt, không set đồng bộ trong effect.
  const load = useCallback(
    () =>
      // allSettled: một nguồn lỗi không làm trống cả trang, chỉ các chỉ số của nguồn đó hiện "—".
      Promise.allSettled([fetchMembers(), fetchTasks(), fetchPublications(), fetchEvents()]).then(
        ([members, tasks, publications, events]) => {
          const settled = { members, tasks, publications, events };
          setFailures(
            (Object.keys(settled) as (keyof Sources)[]).flatMap((key) => {
              const result = settled[key];
              if (result.status === "fulfilled") return [];
              const reason = result.reason instanceof Error ? result.reason.message : "lỗi không xác định";
              return [`${SOURCE_LABELS[key]} (${reason})`];
            }),
          );
          setData({
            members: members.status === "fulfilled" ? members.value : null,
            tasks: tasks.status === "fulfilled" ? tasks.value : null,
            publications: publications.status === "fulfilled" ? publications.value : null,
            events: events.status === "fulfilled" ? events.value : null,
          });
          setNow(Date.now());
          setLoading(false);
        },
      ),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const { members, tasks, publications, events } = data;
  const today = new Date(now);
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const activeMembers = members?.filter((member) => member.active).length;
  const pausedMembers = members?.filter((member) => !member.active).length;
  const onTime = tasks ? onTimeStats(tasks) : null;
  const overdueTasks = (tasks ?? [])
    .filter((task) => isOverdue(task, now))
    .sort((a, b) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime());
  const monthPublications = publications?.filter((item) => item.postedAt.startsWith(monthKey)).length;
  const upcomingEvents = (events ?? [])
    .filter((event) => event.status !== "FINISHED" && new Date(event.eventDate).getTime() >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const departmentKeys = [
    ...new Set([
      ...Object.keys(DEPARTMENT_NAMES),
      ...(tasks ?? []).map((task) => task.department.toUpperCase()),
      ...(publications ?? []).map((item) => item.department.toUpperCase()),
    ]),
  ];
  const ranking = departmentKeys
    .map((key) => {
      const departmentTasks = (tasks ?? []).filter((task) => task.department.toUpperCase() === key);
      return {
        key,
        taskCount: departmentTasks.length,
        onTime: onTimeStats(departmentTasks),
        overdue: departmentTasks.filter((task) => isOverdue(task, now)).length,
        publications: (publications ?? []).filter((item) => item.department.toUpperCase() === key).length,
      };
    })
    // BCN không phải ban chuyên môn: chỉ hiện khi thực sự có task/ấn phẩm.
    .filter((row) => row.key !== "BCN" || row.taskCount > 0 || row.publications > 0)
    .sort(
      (a, b) =>
        (b.onTime.rate ?? -1) - (a.onTime.rate ?? -1) || b.taskCount - a.taskCount || a.key.localeCompare(b.key),
    );

  const alerts = [
    ...overdueTasks.slice(0, MAX_OVERDUE_ALERTS).map((task) => ({
      title: `Quá hạn: ${task.title} (${departmentName(task.department.toUpperCase())})`,
      meta: task.deadline ? `Hạn ${dateOnly.format(new Date(task.deadline))}` : "Quá hạn",
      detail: `Người được giao: ${task.assignedToName ?? "Chưa giao"}.`,
      tone: "rose" as const,
    })),
    ...(overdueTasks.length > MAX_OVERDUE_ALERTS
      ? [
          {
            title: `Còn ${overdueTasks.length - MAX_OVERDUE_ALERTS} task quá hạn khác`,
            meta: "Quá hạn",
            detail: "Xem bảng xếp hạng ban để biết ban nào đang tồn đọng.",
            tone: "rose" as const,
          },
        ]
      : []),
    ...ranking
      .filter((row) => row.onTime.rate !== null && row.onTime.rate < 50)
      .map((row) => ({
        title: `${departmentName(row.key)}: chỉ ${row.onTime.rate}% task đúng hạn`,
        meta: "Tiến độ",
        detail: `${row.onTime.onTime}/${row.onTime.total} task đã hoàn thành đúng hạn.`,
        tone: "amber" as const,
      })),
    ...(members
      ? Object.keys(DEPARTMENT_NAMES)
          .filter((key) => key !== "BCN")
          .filter(
            (key) =>
              !members.some(
                (member) =>
                  member.active &&
                  member.role.toUpperCase() === "TRUONG_BAN" &&
                  member.department?.toUpperCase() === key,
              ),
          )
          .map((key) => ({
            title: `${departmentName(key)} chưa có trưởng ban đang hoạt động`,
            meta: "Nhân sự",
            detail: "Không có thành viên vai trò Trưởng ban nào đang hoạt động trong ban này.",
            tone: "amber" as const,
          }))
      : []),
  ];

  const nextEvent = upcomingEvents[0];
  const loaded = !loading || members !== null || tasks !== null || publications !== null || events !== null;

  return (
    <PageFrame
      title="Health Dashboard"
      description="Các chỉ số thật về thành viên, tiến độ task, ấn phẩm và sự kiện của toàn câu lạc bộ."
      action={
        <ActionButton
          variant="outline"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => {
            setLoading(true);
            void load();
          }}
          disabled={loading}
        >
          Tải lại
        </ActionButton>
      }
    >
      {loading && !loaded ? (
        <p role="status" className="text-sm text-[#71717A]">Đang tải dữ liệu...</p>
      ) : null}
      {failures.length > 0 ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Không tải được dữ liệu {failures.join(", ")}. Các chỉ số liên quan hiển thị “—”.
        </div>
      ) : null}

      {loaded ? (
        <>
          <StatGrid
            items={[
              { label: "Thành viên hoạt động", value: activeMembers?.toString() ?? "—", tone: "slate" },
              {
                label: "Tạm nghỉ",
                value: pausedMembers?.toString() ?? "—",
                note: "Tài khoản đang ở trạng thái không hoạt động",
                tone: "amber",
              },
              {
                label: "Task đúng hạn",
                value: onTime?.rate != null ? `${onTime.rate}%` : "—",
                note: onTime ? `${onTime.onTime}/${onTime.total} task đã xong có deadline` : undefined,
                tone: "emerald",
              },
              {
                label: "Task quá hạn",
                value: tasks ? String(overdueTasks.length) : "—",
                note: "Chưa hoàn thành và đã qua deadline",
                tone: "rose",
              },
              { label: "Ấn phẩm tháng này", value: monthPublications?.toString() ?? "—", tone: "slate" },
              {
                label: "Sự kiện sắp tới",
                value: events ? String(upcomingEvents.length) : "—",
                note: nextEvent
                  ? `Gần nhất: ${nextEvent.title} · ${dateOnly.format(new Date(nextEvent.eventDate))}`
                  : undefined,
                tone: "slate",
              },
            ]}
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <TableCard
              title="Xếp hạng ban"
              columns={[
                { label: "Ban" },
                { label: "Task", align: "right" },
                { label: "Đúng hạn", align: "right" },
                { label: "Quá hạn", align: "right" },
                { label: "Ấn phẩm", align: "right" },
              ]}
              rows={ranking.map((row) => [
                departmentName(row.key),
                tasks ? String(row.taskCount) : "—",
                row.onTime.rate === null ? "—" : `${row.onTime.rate}%`,
                tasks ? String(row.overdue) : "—",
                publications ? String(row.publications) : "—",
              ])}
            />
            <Section title="Cảnh báo" subtitle="Tự động rút ra từ dữ liệu hiện tại.">
              {alerts.length > 0 ? (
                <DetailList items={alerts} />
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-[#71717A]">
                  Không có cảnh báo nào.
                </p>
              )}
            </Section>
          </div>
        </>
      ) : null}
    </PageFrame>
  );
}
