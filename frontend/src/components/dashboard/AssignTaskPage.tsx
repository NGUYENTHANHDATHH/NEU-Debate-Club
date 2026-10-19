"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Send } from "lucide-react";
import { toast } from "sonner";
import { useUserContext } from "@/context/userContext";
import { TaskHistory } from "@/components/dashboard/TaskHistory";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import {
  BackendTask,
  ClubEvent,
  createTask,
  fetchEvents,
  fetchMembers,
  fetchTasks,
  Member,
} from "@/lib/api";

const departmentNames: Record<string, string> = {
  TRUYEN_THONG: "Ban Truyền thông",
  NOI_DUNG: "Ban Nội dung",
  SU_KIEN: "Ban Sự kiện",
  DOI_NGOAI: "Ban Đối ngoại",
  KY_THUAT: "Ban Kỹ thuật",
  NHAN_SU: "Ban Nhân sự",
};

const statusNames: Record<string, string> = {
  TODO: "Cần làm",
  IN_PROGRESS: "Đang làm",
  DONE: "Hoàn thành",
};

export function AssignTaskPage() {
  const { user } = useUserContext();
  const department = (user?.department ?? "").toUpperCase();
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [historyTaskId, setHistoryTaskId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState("ALL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("TODO");
  const [deadline, setDeadline] = useState("");
  const [eventId, setEventId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [crossDepartment, setCrossDepartment] = useState(false);
  const [saving, setSaving] = useState(false);

  const departmentMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          member.active &&
          (member.department ?? "").toUpperCase() === department &&
          member.role !== "BCN",
      ),
    [members, department],
  );

  const previewTasks = useMemo(
    () =>
      eventFilter === "ALL"
        ? tasks
        : tasks.filter((task) => task.eventId === eventFilter),
    [tasks, eventFilter],
  );

  useEffect(() => {
    Promise.all([fetchMembers(), fetchEvents(), fetchTasks({ department })])
      .then(([loadedMembers, loadedEvents, loadedTasks]) => {
        setMembers(loadedMembers);
        setEvents(loadedEvents);
        setTasks(loadedTasks);
        const firstMember = loadedMembers.find(
          (member) =>
            member.active &&
            (member.department ?? "").toUpperCase() === department &&
            member.role !== "BCN",
        );
        if (firstMember) setAssignedToId(firstMember.id);
      })
      .catch((error: Error) => toast.error(error.message));
  }, [department]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!assignedToId) {
      toast.error("Vui lòng chọn thành viên nhận nhiệm vụ.");
      return;
    }
    setSaving(true);
    try {
      const created = await createTask({
        title: title.trim(),
        description: description.trim(),
        department,
        priority: priority as "LOW" | "MEDIUM" | "HIGH",
        status: status as "TODO" | "IN_PROGRESS" | "DONE",
        deadline: deadline ? new Date(deadline).toISOString() : null,
        eventId: eventId || null,
        assignedToId,
        crossDepartment,
      });
      setTasks((current) => [...created, ...current]);
      setTitle("");
      setDescription("");
      setDeadline("");
      setEventId("");
      setCrossDepartment(false);
      toast.success("Đã giao nhiệm vụ cho thành viên.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo nhiệm vụ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageFrame
      eyebrow={`${departmentNames[department] ?? "Ban"} · Trưởng ban`}
      title="Giao task cho thành viên"
      description="Chỉ hiển thị thành viên đang hoạt động trong ban của bạn. Dữ liệu được lưu trực tiếp vào PostgreSQL."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Section title="Thông tin nhiệm vụ" subtitle="Các trường tương ứng với bảng tasks.">
          <form onSubmit={submit} className="space-y-4">
            <input required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề nhiệm vụ" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <textarea maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả" rows={4} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Người nhận
                <select required value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                  <option value="">Chọn thành viên</option>
                  {departmentMembers.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
                </select>
              </label>
              <label className="text-sm">Sự kiện
                <select value={eventId} onChange={(e) => setEventId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                  <option value="">Không gắn sự kiện</option>
                  {events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              <label className="text-sm">Ưu tiên
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                  <option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option>
                </select>
              </label>
              <label className="text-sm">Trạng thái
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                  <option value="TODO">Cần làm</option><option value="IN_PROGRESS">Đang làm</option><option value="DONE">Hoàn thành</option>
                </select>
              </label>
            </div>
            <label className="block text-sm">Deadline
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={crossDepartment} onChange={(e) => setCrossDepartment(e.target.checked)} />
              Nhiệm vụ liên ban
            </label>
            <ActionButton type="submit" disabled={saving} icon={<Send className="h-4 w-4" />}>
              {saving ? "Đang lưu..." : "Giao nhiệm vụ"}
            </ActionButton>
          </form>
        </Section>

        <Section title="Preview task của ban">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="ALL">Tất cả sự kiện</option>
              {events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {previewTasks.map((task) => (
              <article key={task.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">{task.title}</h3>
                  <span className="text-xs text-slate-500">{statusNames[task.status]}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{task.assignedToName ?? "Chưa phân công"}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{task.priority}</span>
                  <span>{task.deadline ? new Date(task.deadline).toLocaleString("vi-VN") : "Không deadline"}</span>
                  <span>{task.eventTitle ?? "Không gắn sự kiện"}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs font-medium text-slate-600">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${task.progress}%` }} />
                  </div>
                  {task.progress}%
                </div>
                <button type="button" onClick={() => setHistoryTaskId(historyTaskId === task.id ? null : task.id)}
                  className="mt-3 text-sm font-semibold text-rose-600 hover:underline">
                  {historyTaskId === task.id ? "Ẩn lịch sử" : "Xem lịch sử tiến độ"}
                </button>
                {historyTaskId === task.id && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <TaskHistory key={task.id} taskId={task.id} createdAt={task.createdAt} assignedByName={task.assignedByName} />
                  </div>
                )}
              </article>
            ))}
            {!previewTasks.length && <p className="text-sm text-slate-500">Chưa có nhiệm vụ.</p>}
          </div>
        </Section>
      </div>
    </PageFrame>
  );
}
