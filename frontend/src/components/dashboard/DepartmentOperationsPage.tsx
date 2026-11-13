"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { StatGrid, TableCard } from "@/components/dashboard/DashboardWidgets";
import { isOverdue, onTimeStats, taskStatus } from "@/components/dashboard/taskMetrics";
import { useUserContext } from "@/context/userContext";
import { BackendTask, Member, fetchMembers, fetchTasks } from "@/lib/api";
import { DEPARTMENT_NAMES } from "@/lib/notifications";

const ROLE_LABELS: Record<string, string> = {
  BCN: "BCN",
  TRUONG_BAN: "Trưởng/Phó ban",
  MEMBER: "Thành viên",
};

export function DepartmentOperationsPage() {
  const { user } = useUserContext();
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Backend đã giới hạn theo vai trò: Trưởng ban chỉ nhận thành viên/task của ban mình, BCN nhận toàn CLB.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedMembers, loadedTasks] = await Promise.all([fetchMembers(), fetchTasks()]);
      setMembers(loadedMembers);
      setTasks(loadedTasks);
      setNow(Date.now());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu ban.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isBcn = user?.role?.toUpperCase() === "BCN";
  const departmentName = isBcn
    ? "Toàn câu lạc bộ"
    : DEPARTMENT_NAMES[user?.department?.toUpperCase() ?? ""] ?? "Ban của bạn";
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekTasks = tasks.filter((task) => {
    if (!task.deadline) return false;
    const deadline = new Date(task.deadline);
    return deadline >= weekStart && deadline < weekEnd;
  });
  const weekDone = weekTasks.filter((task) => taskStatus(task) === "DONE").length;
  const overall = onTimeStats(tasks);
  const overdue = tasks.filter((task) => isOverdue(task, now)).length;
  const activeMembers = members.filter((member) => member.active).length;

  return (
    <PageFrame
      title="Nghiệp vụ ban"
      description={`${departmentName}: tổng quan thành viên, task tuần này và tỷ lệ hoàn thành đúng hạn.`}
    >
      {loading && <p role="status" className="text-sm text-[#71717A]">Đang tải dữ liệu ban...</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <span>{error}</span>
          <ActionButton variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
            Thử lại
          </ActionButton>
        </div>
      )}
      {!loading && !error && (
        <>
          <StatGrid
            items={[
              {
                label: "Tổng thành viên",
                value: String(members.length),
                note: `${activeMembers} hoạt động, ${members.length - activeMembers} tạm nghỉ`,
                tone: "slate",
              },
              {
                label: "Task tuần này",
                value: String(weekTasks.length),
                note: `${weekDone}/${weekTasks.length} hoàn thành`,
                tone: "rose",
              },
              {
                label: "Tỷ lệ đúng hạn",
                value: overall.rate === null ? "—" : `${overall.rate}%`,
                note: overall.total
                  ? `${overall.onTime}/${overall.total} task có deadline hoàn thành đúng hạn`
                  : "Chưa có task hoàn thành để tính",
                tone: "emerald",
              },
              {
                label: "Task quá hạn",
                value: String(overdue),
                note: "Chưa xong và đã qua deadline",
                tone: "amber",
              },
            ]}
          />
          {members.length === 0 ? (
            <p className="rounded-2xl border border-slate-200/60 bg-white p-5 text-sm text-[#71717A]">
              Chưa có thành viên nào trong ban.
            </p>
          ) : (
            <TableCard
              title="Bảng theo dõi thành viên"
              columns={[
                { label: "Tên" },
                { label: "Chức vụ" },
                { label: "Tổng task", align: "center" },
                { label: "Tỷ lệ đúng hạn", align: "right" },
                { label: "Trạng thái", align: "right" },
              ]}
              rows={members.map((member) => {
                const memberTasks = tasks.filter(
                  (task) => task.assignedToId?.toLowerCase() === member.id.toLowerCase(),
                );
                const percent = onTimeStats(memberTasks).rate;
                const needsAttention = percent !== null && percent < 50;
                const statusClass = !member.active
                  ? "bg-slate-100 text-slate-600"
                  : needsAttention
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700";
                const statusLabel = !member.active ? "Tạm nghỉ" : needsAttention ? "Cần chú ý" : "Hoạt động";

                return [
                  member.fullName,
                  ROLE_LABELS[member.role?.toUpperCase()] ?? member.role,
                  String(memberTasks.length),
                  percent === null ? "—" : `${percent}%`,
                  <span key={`${member.id}-status`} className={`rounded-full px-3 py-1 ${statusClass}`}>
                    {statusLabel}
                  </span>,
                ];
              })}
            />
          )}
        </>
      )}
    </PageFrame>
  );
}
