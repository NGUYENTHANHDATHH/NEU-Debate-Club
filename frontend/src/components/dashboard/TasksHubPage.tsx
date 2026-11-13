"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Plus, RefreshCw, Workflow, Network } from "lucide-react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { StatGrid } from "@/components/dashboard/DashboardWidgets";
import { useUserContext } from "@/context/userContext";
import { canAccessDashboardPath } from "@/constants/dashboard-modules";
import { ROUTES } from "@/constants/routes";
import { BackendTask, fetchTasks } from "@/lib/api";
import { DEPARTMENT_NAMES } from "@/lib/notifications";
import { countByStatus, isOverdue, taskStatus } from "@/components/dashboard/taskMetrics";

/** Task chưa xong có deadline, deadline gần nhất (kể cả quá hạn) lên đầu. */
export function nearestOpenTasks(tasks: BackendTask[], limit = 5) {
  return tasks
    .filter((task) => taskStatus(task) !== "DONE" && task.deadline)
    .sort((a, b) => new Date(a.deadline as string).getTime() - new Date(b.deadline as string).getTime())
    .slice(0, limit);
}

/** Danh sách task theo deadline; chỉ task của chính người xem mới mở được trong Todo-list. */
export function TaskDeadlineList({
  tasks,
  now,
  currentUserId,
}: {
  tasks: BackendTask[];
  now: number;
  currentUserId?: string;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-[#71717A]">Không có task nào sắp đến hạn.</p>;
  }
  return (
    <ul className="space-y-3">
      {tasks.map((task) => {
        const overdue = isOverdue(task, now);
        const deadline = new Date(task.deadline as string).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        const department = DEPARTMENT_NAMES[task.department?.toUpperCase()] ?? task.departmentName;
        const content = (
          <>
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${overdue ? "bg-rose-500" : "bg-amber-500"}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h4 className="line-clamp-2 font-medium text-[#18181B]">{task.title}</h4>
                <span className={`shrink-0 text-xs ${overdue ? "font-medium text-rose-600" : "text-[#71717A]"}`}>
                  {overdue ? `Quá hạn · ${deadline}` : deadline}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#71717A]">
                {task.assignedToName ?? "Chưa giao"} · {department}
              </p>
            </div>
          </>
        );
        const mine = Boolean(currentUserId) && task.assignedToId?.toLowerCase() === currentUserId?.toLowerCase();
        return (
          <li key={task.id}>
            {mine ? (
              <Link
                href={`${ROUTES.todoList}?task=${encodeURIComponent(task.id)}`}
                className="flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 transition hover:border-rose-200 hover:bg-rose-50"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-white p-4">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const TASK_FLOWS = [
  {
    href: ROUTES.todoList,
    title: "Todo-list",
    description: "Xem task được giao và cập nhật tiến độ.",
    icon: ClipboardList,
  },
  {
    href: ROUTES.assignTask,
    title: "Giao task",
    description: "Giao task cho thành viên trong ban.",
    icon: Workflow,
  },
  {
    href: ROUTES.assignAllTasks,
    title: "Giao task mọi ban",
    description: "Giao task liên ban cho toàn câu lạc bộ.",
    icon: Network,
  },
];

export function TasksHubPage() {
  const { user } = useUserContext();
  const router = useRouter();
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTasks(await fetchTasks());
      setNow(Date.now());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải công việc.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const role = user?.role?.toUpperCase();
  const scope =
    role === "BCN" ? "toàn câu lạc bộ" : role === "TRUONG_BAN" ? "ban của bạn" : "task được giao cho bạn";
  const flows = TASK_FLOWS.filter((flow) => canAccessDashboardPath(flow.href, user?.modules));
  const canAssign = canAccessDashboardPath(ROUTES.assignTask, user?.modules);
  const counts = countByStatus(tasks);
  const overdue = tasks.filter((task) => isOverdue(task, now)).length;
  const value = (amount: number) => (error ? "—" : String(amount));

  return (
    <PageFrame
      title="Trung tâm task"
      description={`Số liệu task của ${scope}, các luồng thao tác và những task sắp đến hạn.`}
      action={
        canAssign ? (
          <ActionButton icon={<Plus className="h-4 w-4" />} onClick={() => router.push(ROUTES.assignTask)}>
            Tạo task
          </ActionButton>
        ) : undefined
      }
    >
      {loading && <p role="status" className="text-sm text-[#71717A]">Đang tải công việc...</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <span>{error}</span>
          <ActionButton variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
            Thử lại
          </ActionButton>
        </div>
      )}
      <StatGrid
        items={[
          { label: "Cần làm", value: value(counts.TODO), note: "Task chưa bắt đầu", tone: "slate" },
          { label: "Đang làm", value: value(counts.IN_PROGRESS), note: "Task đang được xử lý", tone: "amber" },
          { label: "Hoàn thành", value: value(counts.DONE), note: `Trên tổng ${counts.total} task`, tone: "emerald" },
          { label: "Quá hạn", value: value(overdue), note: "Chưa xong và đã qua deadline", tone: "rose" },
        ]}
      />

      <Section title="Điểm vào các flow task" subtitle="Chỉ hiện các luồng bạn có quyền dùng.">
        <div className="grid gap-4 md:grid-cols-3">
          {flows.map((flow) => (
            <Link
              key={flow.href}
              href={flow.href}
              className="rounded-[1.5rem] border border-slate-200/60 bg-white p-5 hover:border-rose-200 hover:bg-rose-50"
            >
              <flow.icon className="h-5 w-5 text-[#E11D48]" />
              <h3 className="mt-4 font-semibold text-[#18181B]">{flow.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#71717A]">{flow.description}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Sắp đến hạn" subtitle="5 task chưa hoàn thành có deadline gần nhất.">
        {!loading && !error && <TaskDeadlineList tasks={nearestOpenTasks(tasks)} now={now} currentUserId={user?.id} />}
      </Section>
    </PageFrame>
  );
}
