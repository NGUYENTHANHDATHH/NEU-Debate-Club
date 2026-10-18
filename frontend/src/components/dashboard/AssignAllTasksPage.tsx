"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  Handshake,
  Layers,
  Megaphone,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { ClubEvent, fetchEvents, fetchMembers, Member } from "@/lib/api";

// ============================================================================
// TYPES & ENUMS (Đồng bộ chuẩn xác với cấu trúc bảng `tasks` trong PostgreSQL)
// ============================================================================

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";
export type DepartmentCode =
  | "truyen_thong"
  | "noi_dung"
  | "su_kien"
  | "doi_ngoai"
  | "ky_thuat"
  | "nhan_su";

/**
 * Task item tương ứng với từng hàng trong bảng `tasks`:
 * - id: UUID PRIMARY KEY
 * - title: VARCHAR(255) NOT NULL
 * - description: TEXT
 * - priority: task_priority_enum ('low', 'medium', 'high')
 * - status: task_status_enum ('todo', 'in_progress', 'done')
 * - deadline: TIMESTAMPTZ
 * - assigned_to: UUID (chỉ định Trưởng Ban)
 * - assigned_by: UUID (Ban Chủ Nhiệm - BCN)
 * - department: department_enum
 * - is_cross_department: BOOLEAN NOT NULL DEFAULT false
 * - event_id: UUID REFERENCES events(id) ON DELETE SET NULL
 * - completed_at: TIMESTAMPTZ
 * - created_at: TIMESTAMPTZ
 * - updated_at: TIMESTAMPTZ
 */
export interface DepartmentTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  assigned_to: string;
  assigned_to_title: string;
  assigned_to_name: string;
  assigned_by: string;
  assigned_by_name: string;
  department: DepartmentCode;
  department_name: string;
  is_cross_department: boolean;
  event_id: string | null;
  event_title: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DANH MỤC CÁC BAN CHUYÊN MÔN
// Chỉ hiển thị các Ban, không hiển thị thành viên lẻ.
// Mỗi ban có Trưởng ban phụ trách trực tiếp nhận task từ BCN.
// ============================================================================

export interface DepartmentMeta {
  code: DepartmentCode;
  name: string;
  short: string;
  recipientRole: string;
  defaultLeadName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colors: {
    badge: string;
    pill: string;
    dot: string;
    border: string;
    bgHover: string;
  };
}

export const DEPARTMENTS: DepartmentMeta[] = [
  {
    code: "truyen_thong",
    name: "Ban Truyền thông",
    short: "Truyền thông",
    recipientRole: "Trưởng Ban Truyền thông",
    defaultLeadName: "Trần Hải Đăng",
    description: "Sản xuất ấn phẩm, truyền thông đa nền tảng, bài đăng & video",
    icon: Megaphone,
    colors: {
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      pill: "bg-rose-100 text-rose-800",
      dot: "bg-rose-500",
      border: "hover:border-rose-300 focus:border-rose-500",
      bgHover: "hover:bg-rose-50/50",
    },
  },
  {
    code: "noi_dung",
    name: "Ban Nội dung",
    short: "Nội dung",
    recipientRole: "Trưởng Ban Nội dung",
    defaultLeadName: "Lê Thu Hà",
    description: "Biên soạn motions đề thi, tài liệu học thuật, format luật tranh biện",
    icon: BookOpen,
    colors: {
      badge: "bg-violet-50 text-violet-700 border-violet-200",
      pill: "bg-violet-100 text-violet-800",
      dot: "bg-violet-500",
      border: "hover:border-violet-300 focus:border-violet-500",
      bgHover: "hover:bg-violet-50/50",
    },
  },
  {
    code: "su_kien",
    name: "Ban Sự kiện",
    short: "Sự kiện",
    recipientRole: "Trưởng Ban Sự kiện",
    defaultLeadName: "Hoàng Khánh Linh",
    description: "Vận hành giải đấu, địa điểm thi đấu, hậu cần & cơ sở vật chất",
    icon: CalendarDays,
    colors: {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      pill: "bg-amber-100 text-amber-800",
      dot: "bg-amber-500",
      border: "hover:border-amber-300 focus:border-amber-500",
      bgHover: "hover:bg-amber-50/50",
    },
  },
  {
    code: "doi_ngoai",
    name: "Ban Đối ngoại",
    short: "Đối ngoại",
    recipientRole: "Trưởng Ban Đối ngoại",
    defaultLeadName: "Phạm Đức Huy",
    description: "Mời tài trợ, liên kết CLB bạn, bảo trợ truyền thông & giám khảo",
    icon: Handshake,
    colors: {
      badge: "bg-sky-50 text-sky-700 border-sky-200",
      pill: "bg-sky-100 text-sky-800",
      dot: "bg-sky-500",
      border: "hover:border-sky-300 focus:border-sky-500",
      bgHover: "hover:bg-sky-50/50",
    },
  },
  {
    code: "ky_thuat",
    name: "Ban Kỹ thuật",
    short: "Kỹ thuật",
    recipientRole: "Trưởng Ban Kỹ thuật",
    defaultLeadName: "Vũ Quang Minh",
    description: "Vận hành hệ thống Tabbycat, bảng điểm điện tử, âm thanh & media",
    icon: Cpu,
    colors: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pill: "bg-emerald-100 text-emerald-800",
      dot: "bg-emerald-500",
      border: "hover:border-emerald-300 focus:border-emerald-500",
      bgHover: "hover:bg-emerald-50/50",
    },
  },
  {
    code: "nhan_su",
    name: "Ban Nhân sự",
    short: "Nhân sự",
    recipientRole: "Trưởng Ban Nhân sự",
    defaultLeadName: "Đỗ Ngọc Anh",
    description: "Điều phối phân ca trực, điểm danh, khen thưởng & gắn kết nội bộ",
    icon: Users,
    colors: {
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
      pill: "bg-indigo-100 text-indigo-800",
      dot: "bg-indigo-500",
      border: "hover:border-indigo-300 focus:border-indigo-500",
      bgHover: "hover:bg-indigo-50/50",
    },
  },
];

// Fallback events từ V20 seed database nếu chưa load được API
const FALLBACK_EVENTS: { id: string; title: string }[] = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    title: "Giải Tranh biện Mở rộng NEU Debate Open 2025",
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    title: "Freshers Debate Cup 2025 - Tranh biện Tân sinh viên K67",
  },
  {
    id: "e0000000-0000-0000-0000-000000000003",
    title: "Workshop Kỹ năng Xây dựng Luận điểm & Phản biện Sắc bén",
  },
  {
    id: "e0000000-0000-0000-0000-000000000004",
    title: "Debate Camp Hè 2025 - Ươm mầm Tư duy Phản biện",
  },
];

// Dữ liệu mẫu khởi tạo phản ánh chân thực các cột trong bảng `tasks`
const INITIAL_SAMPLE_TASKS: DepartmentTask[] = [
  {
    id: "t0000000-0000-0000-0000-000000000001",
    title: "Thiết kế bộ nhận diện & trailer công bố Giải Tranh biện Mở rộng NEU Debate Open 2025",
    description:
      "Lên key visual chủ đạo, avatar frame, template bài đăng vòng loại và dựng teaser video 45s để kích hoạt chiến dịch truyền thông trước 3 tuần.",
    priority: "high",
    status: "in_progress",
    deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    assigned_to: "u0000000-0000-0000-0000-000000000018",
    assigned_to_title: "Trưởng Ban Truyền thông",
    assigned_to_name: "Trần Hải Đăng",
    assigned_by: "00000000-0000-0000-0000-000000000001",
    assigned_by_name: "Ban Chủ Nhiệm (BCN)",
    department: "truyen_thong",
    department_name: "Ban Truyền thông",
    is_cross_department: true,
    event_id: "e0000000-0000-0000-0000-000000000001",
    event_title: "Giải Tranh biện Mở rộng NEU Debate Open 2025",
    completed_at: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "t0000000-0000-0000-0000-000000000002",
    title: "Biên soạn danh sách 12 motions đề thi & bảng rubric chấm điểm theo chuẩn BP",
    description:
      "Chuẩn bị các đề thi chia đều theo chủ đề (Kinh tế, Xã hội, Công nghệ, Giáo dục), kèm thông tin bối cảnh (info slides) và thang điểm chuẩn cho hội đồng trọng tài.",
    priority: "high",
    status: "todo",
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    assigned_to: "u0000000-0000-0000-0000-000000000021",
    assigned_to_title: "Trưởng Ban Nội dung",
    assigned_to_name: "Lê Thu Hà",
    assigned_by: "00000000-0000-0000-0000-000000000001",
    assigned_by_name: "Ban Chủ Nhiệm (BCN)",
    department: "noi_dung",
    department_name: "Ban Nội dung",
    is_cross_department: false,
    event_id: "e0000000-0000-0000-0000-000000000001",
    event_title: "Giải Tranh biện Mở rộng NEU Debate Open 2025",
    completed_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "t0000000-0000-0000-0000-000000000003",
    title: "Khảo sát và đặt hội trường A2 & 8 phòng thi nhánh cho Freshers Debate Cup",
    description:
      "Làm việc với Phòng Quản trị Thiết bị ĐH NEU xin phê duyệt mượn Hội trường A2 và 8 phòng học tòa D2, kiểm tra hệ thống điều hòa, âm thanh và bảng tên các phòng.",
    priority: "medium",
    status: "in_progress",
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    assigned_to: "u0000000-0000-0000-0000-000000000022",
    assigned_to_title: "Trưởng Ban Sự kiện",
    assigned_to_name: "Hoàng Khánh Linh",
    assigned_by: "00000000-0000-0000-0000-000000000001",
    assigned_by_name: "Ban Chủ Nhiệm (BCN)",
    department: "su_kien",
    department_name: "Ban Sự kiện",
    is_cross_department: true,
    event_id: "e0000000-0000-0000-0000-000000000002",
    event_title: "Freshers Debate Cup 2025 - Tranh biện Tân sinh viên K67",
    completed_at: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "t0000000-0000-0000-0000-000000000004",
    title: "Gửi hồ sơ mời tài trợ Kim Cương và tiếp cận 10 đối tác EdTech giáo dục",
    description:
      "Gửi hồ sơ tài trợ chính thức, theo dõi phản hồi email và chốt lịch họp đàm phán hợp đồng tài trợ học bổng và tiền mặt trước ngày 25.",
    priority: "high",
    status: "todo",
    deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
    assigned_to: "u0000000-0000-0000-0000-000000000020",
    assigned_to_title: "Trưởng Ban Đối ngoại",
    assigned_to_name: "Phạm Đức Huy",
    assigned_by: "00000000-0000-0000-0000-000000000001",
    assigned_by_name: "Ban Chủ Nhiệm (BCN)",
    department: "doi_ngoai",
    department_name: "Ban Đối ngoại",
    is_cross_department: false,
    event_id: "e0000000-0000-0000-0000-000000000001",
    event_title: "Giải Tranh biện Mở rộng NEU Debate Open 2025",
    completed_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "t0000000-0000-0000-0000-000000000005",
    title: "Cấu hình phần mềm Tabbycat và kết nối bảng điểm điện tử cho giải đấu",
    description:
      "Tạo instance giải đấu trên Tabbycat, cấu hình 80 đội thi và 40 giám khảo, phân quyền nhập kết quả và kiểm tra backup dữ liệu server phòng sự cố.",
    priority: "medium",
    status: "todo",
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    assigned_to: "u0000000-0000-0000-0000-000000000023",
    assigned_to_title: "Trưởng Ban Kỹ thuật",
    assigned_to_name: "Vũ Quang Minh",
    assigned_by: "00000000-0000-0000-0000-000000000001",
    assigned_by_name: "Ban Chủ Nhiệm (BCN)",
    department: "ky_thuat",
    department_name: "Ban Kỹ thuật",
    is_cross_department: false,
    event_id: "e0000000-0000-0000-0000-000000000001",
    event_title: "Giải Tranh biện Mở rộng NEU Debate Open 2025",
    completed_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "t0000000-0000-0000-0000-000000000006",
    title: "Lập danh sách phân ca trực và điểm danh thành viên hỗ trợ Workshop Kỹ năng",
    description:
      "Xếp lịch 20 bạn thành viên phụ trách check-in khách mời, bàn phát tài liệu và hậu cần nước uống. Báo cáo tổng kết số lượt tham gia sau sự kiện.",
    priority: "low",
    status: "done",
    deadline: new Date(Date.now() - 86400000).toISOString(),
    assigned_to: "u0000000-0000-0000-0000-000000000024",
    assigned_to_title: "Trưởng Ban Nhân sự",
    assigned_to_name: "Đỗ Ngọc Anh",
    assigned_by: "00000000-0000-0000-0000-000000000001",
    assigned_by_name: "Ban Chủ Nhiệm (BCN)",
    department: "nhan_su",
    department_name: "Ban Nhân sự",
    is_cross_department: false,
    event_id: "e0000000-0000-0000-0000-000000000003",
    event_title: "Workshop Kỹ năng Xây dựng Luận điểm & Phản biện Sắc bén",
    completed_at: new Date(Date.now() - 43200000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
  },
];

const LOCAL_STORAGE_KEY = "ndc_tasks_bcn_assign_all_v1";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AssignAllTasksPage() {
  // State: Danh sách nhiệm vụ
  const [tasks, setTasks] = useState<DepartmentTask[]>([]);
  const [eventsList, setEventsList] = useState<{ id: string; title: string }[]>(FALLBACK_EVENTS);
  const [departmentLeads, setDepartmentLeads] = useState<Record<DepartmentCode, string>>({
    truyen_thong: "Trần Hải Đăng",
    noi_dung: "Lê Thu Hà",
    su_kien: "Hoàng Khánh Linh",
    doi_ngoai: "Phạm Đức Huy",
    ky_thuat: "Vũ Quang Minh",
    nhan_su: "Đỗ Ngọc Anh",
  });

  // State: Form inputs (Tất cả thông số bảng `tasks`)
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentCode>("truyen_thong");
  const [assignToAllDepartments, setAssignToAllDepartments] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskEventId, setTaskEventId] = useState<string>("none");
  const [isCrossDepartment, setIsCrossDepartment] = useState<boolean>(false);

  // State: UI filters & modal
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCrossDeptOnly, setFilterCrossDeptOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<DepartmentTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Khởi tạo & nạp dữ liệu từ localStorage / API
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
        } else {
          setTasks(INITIAL_SAMPLE_TASKS);
        }
      } else {
        setTasks(INITIAL_SAMPLE_TASKS);
      }
    } catch {
      setTasks(INITIAL_SAMPLE_TASKS);
    }

    // Tải danh sách sự kiện từ API thật (nếu có backend đang chạy)
    fetchEvents()
      .then((data: ClubEvent[]) => {
        if (data && data.length > 0) {
          setEventsList(data.map((item) => ({ id: item.id, title: item.title })));
        }
      })
      .catch(() => {
        // Giữ FALLBACK_EVENTS nếu không kết nối được backend
      });

    // Thử lấy danh sách Trưởng ban thực tế từ API members
    fetchMembers()
      .then((members: Member[]) => {
        if (members && members.length > 0) {
          const map: Partial<Record<DepartmentCode, string>> = {};
          members.forEach((m) => {
            const roleLower = (m.role || "").toLowerCase();
            const deptLower = (m.department || "").toLowerCase().replace("-", "_");
            if (roleLower.includes("truong") || roleLower.includes("lead")) {
              if (deptLower.includes("truyen")) map.truyen_thong = m.fullName;
              if (deptLower.includes("noi_dung")) map.noi_dung = m.fullName;
              if (deptLower.includes("su_kien")) map.su_kien = m.fullName;
              if (deptLower.includes("doi_ngoai")) map.doi_ngoai = m.fullName;
              if (deptLower.includes("ky_thuat")) map.ky_thuat = m.fullName;
              if (deptLower.includes("nhan_su")) map.nhan_su = m.fullName;
            }
          });
          setDepartmentLeads((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => {
        // Giữ tên trưởng ban mặc định
      });
  }, []);

  // 2. Tự động lưu vào localStorage khi tasks thay đổi
  const saveTasks = (newTasks: DepartmentTask[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTasks));
    } catch {
      // bỏ qua lỗi storage quota
    }
  };

  // Preset deadline nhanh
  const setQuickDeadline = (daysAhead: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    target.setHours(18, 0, 0, 0); // mặc định 18:00
    // Format YYYY-MM-DDTHH:mm
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISOTime = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setTaskDeadline(localISOTime);
  };

  // Ban hiện tại đang chọn trong form
  const activeDeptMeta = useMemo(() => {
    return (
      DEPARTMENTS.find((d) => d.code === selectedDepartment) ?? DEPARTMENTS[0]
    );
  }, [selectedDepartment]);

  // Xử lý tạo nhiệm vụ mới từ BCN
  const handleCreateTask = (e: FormEvent) => {
    e.preventDefault();

    if (!taskTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề nhiệm vụ (bắt buộc theo schema).");
      return;
    }

    setIsSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const resolvedDeadline = taskDeadline
        ? new Date(taskDeadline).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString();

      const selectedEventObj =
        taskEventId !== "none" ? eventsList.find((ev) => ev.id === taskEventId) : null;

      // Nếu chọn "Phân phối cho tất cả 6 ban cùng lúc"
      if (assignToAllDepartments) {
        const batchTasks: DepartmentTask[] = DEPARTMENTS.map((dept, index) => ({
          id: `task-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
          title: taskTitle.trim(),
          description: taskDescription.trim() || "Chưa có mô tả chi tiết.",
          priority: taskPriority,
          status: taskStatus,
          deadline: resolvedDeadline,
          assigned_to: `lead-${dept.code}`,
          assigned_to_title: dept.recipientRole,
          assigned_to_name: departmentLeads[dept.code] || dept.defaultLeadName,
          assigned_by: "bcn-executive",
          assigned_by_name: "Ban Chủ Nhiệm (BCN)",
          department: dept.code,
          department_name: dept.name,
          is_cross_department: true, // giao toàn ban tự động là liên ban
          event_id: selectedEventObj?.id ?? null,
          event_title: selectedEventObj?.title ?? null,
          completed_at: taskStatus === "done" ? nowIso : null,
          created_at: nowIso,
          updated_at: nowIso,
        }));

        const updated = [...batchTasks, ...tasks];
        saveTasks(updated);
        toast.success(`Đã phân phối đồng loạt nhiệm vụ tới 6 Trưởng Ban!`);
      } else {
        // Giao cho một ban cụ thể
        const newTask: DepartmentTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: taskTitle.trim(),
          description: taskDescription.trim() || "Chưa có mô tả chi tiết.",
          priority: taskPriority,
          status: taskStatus,
          deadline: resolvedDeadline,
          assigned_to: `lead-${activeDeptMeta.code}`,
          assigned_to_title: activeDeptMeta.recipientRole,
          assigned_to_name:
            departmentLeads[activeDeptMeta.code] || activeDeptMeta.defaultLeadName,
          assigned_by: "bcn-executive",
          assigned_by_name: "Ban Chủ Nhiệm (BCN)",
          department: activeDeptMeta.code,
          department_name: activeDeptMeta.name,
          is_cross_department: isCrossDepartment,
          event_id: selectedEventObj?.id ?? null,
          event_title: selectedEventObj?.title ?? null,
          completed_at: taskStatus === "done" ? nowIso : null,
          created_at: nowIso,
          updated_at: nowIso,
        };

        const updated = [newTask, ...tasks];
        saveTasks(updated);
        toast.success(
          `Đã giao nhiệm vụ thành công cho ${activeDeptMeta.recipientRole} (${newTask.assigned_to_name})!`,
        );
      }

      // Reset form fields
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setTaskStatus("todo");
      setTaskDeadline("");
      setTaskEventId("none");
      setIsCrossDepartment(false);
      setAssignToAllDepartments(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật trạng thái nhanh (Todo -> In Progress -> Done)
  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nowIso = new Date().toISOString();
        return {
          ...t,
          status: newStatus,
          completed_at: newStatus === "done" ? nowIso : null,
          updated_at: nowIso,
        };
      }
      return t;
    });
    saveTasks(updated);
    toast.info("Đã cập nhật trạng thái nhiệm vụ.");
  };

  // Xóa nhiệm vụ
  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasks(updated);
    if (selectedTaskForModal?.id === taskId) {
      setSelectedTaskForModal(null);
    }
    toast.success("Đã xóa nhiệm vụ khỏi danh sách.");
  };

  // Khôi phục dữ liệu mẫu
  const handleResetSampleData = () => {
    saveTasks(INITIAL_SAMPLE_TASKS);
    toast.success("Đã tải lại bộ dữ liệu nhiệm vụ mẫu ban đầu.");
  };

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const crossDept = tasks.filter((t) => t.is_cross_department).length;
    const highPriority = tasks.filter((t) => t.priority === "high").length;

    // Đếm số ban đang có task
    const activeDepts = new Set(tasks.map((t) => t.department)).size;

    return { total, todo, inProgress, done, crossDept, highPriority, activeDepts };
  }, [tasks]);

  // Bộ lọc danh sách nhiệm vụ
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Lọc theo ban
      if (filterDepartment !== "ALL" && task.department !== filterDepartment) {
        return false;
      }
      // Lọc theo mức độ ưu tiên
      if (filterPriority !== "ALL" && task.priority !== filterPriority) {
        return false;
      }
      // Lọc theo trạng thái
      if (filterStatus !== "ALL" && task.status !== filterStatus) {
        return false;
      }
      // Lọc theo nhiệm vụ liên ban
      if (filterCrossDeptOnly && !task.is_cross_department) {
        return false;
      }
      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchDept = task.department_name.toLowerCase().includes(q);
        const matchLead = (task.assigned_to_name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchDept && !matchLead) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, filterDepartment, filterPriority, filterStatus, filterCrossDeptOnly, searchQuery]);

  return (
    <PageFrame
      eyebrow="BCN · ĐIỀU HÀNH & PHÂN PHỐI NHIỆM VỤ"
      title="Giao nhiệm vụ cho các Ban"
      description="Dành riêng cho Ban Chủ Nhiệm (BCN) phân công chỉ đạo trực tiếp xuống từng ban chuyên môn. Nhiệm vụ sẽ được gửi trực tiếp đến Trưởng ban phụ trách để điều phối nội bộ, không giao lẻ từng thành viên."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            variant="outline"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={handleResetSampleData}
          >
            Nạp dữ liệu mẫu
          </ActionButton>
          <ActionButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              const el = document.getElementById("bcn-task-form");
              el?.scrollIntoView({ behavior: "smooth" });
              document.getElementById("task-title-input")?.focus();
            }}
          >
            Tạo task mới
          </ActionButton>
        </div>
      }
      aside={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Tổng task BCN giao
              </span>
              <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {stats.total}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Đang phân phối tại {stats.activeDepts}/6 ban chuyên môn
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Phối hợp liên ban
              </span>
              <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-violet-700">
              {stats.crossDept}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Nhiệm vụ đa ban (`is_cross_department`)
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Ưu tiên cao / Khẩn
              </span>
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-amber-700">
              {stats.highPriority}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Cần theo dõi tiến độ sát sao
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Đã hoàn tất
              </span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-700">
              {stats.done}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {stats.todo} chờ xử lý · {stats.inProgress} đang thực hiện
            </p>
          </div>
        </div>
      }
    >


      <div className="grid gap-8 xl:grid-cols-[1.1fr_1.3fr]">
        {/* ==================================================================== */}
        {/* CỘT TRÁI: FORM GIAO NHIỆM VỤ CHO TỪNG BAN */}
        {/* ==================================================================== */}
        <div id="bcn-task-form">
          <Section
            title="Biểu mẫu giao việc cho Ban"
            subtitle="Điền đầy đủ các thông số tương ứng với cấu trúc bảng `tasks` trong database."
          >
            <form onSubmit={handleCreateTask} className="space-y-6">
              {/* 1. CHỌN BAN TIẾP NHẬN (department_enum) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    1. Chọn ban chuyên môn tiếp nhận task{" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={assignToAllDepartments}
                      onChange={(e) => setAssignToAllDepartments(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#E11D48] focus:ring-[#E11D48]"
                    />
                    <span>Giao đồng loạt 6 ban</span>
                  </label>
                </div>

                {assignToAllDepartments ? (
                  <div className="mt-2.5 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-sm text-violet-900">
                    <div className="flex items-center gap-2 font-semibold">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                      <span>Chế độ phân phối toàn câu lạc bộ (Tất cả 6 ban)</span>
                    </div>
                    <p className="mt-1 text-xs text-violet-700">
                      Hệ thống sẽ tạo 6 bản ghi nhiệm vụ độc lập cho Trưởng ban của cả 6 ban (Truyền thông, Nội dung, Sự kiện, Đối ngoại, Kỹ thuật, Nhân sự).
                    </p>
                  </div>
                ) : (
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {DEPARTMENTS.map((dept) => {
                      const Icon = dept.icon;
                      const isSelected = selectedDepartment === dept.code;
                      return (
                        <button
                          key={dept.code}
                          type="button"
                          onClick={() => setSelectedDepartment(dept.code)}
                          className={`group relative flex flex-col items-start rounded-2xl border p-3 text-left transition-all ${isSelected
                            ? "border-[#E11D48] bg-rose-50/70 shadow-sm ring-2 ring-rose-500/20"
                            : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                            }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span
                              className={`rounded-xl p-2 transition ${isSelected
                                ? "bg-[#E11D48] text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                                }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-[#E11D48]" />
                            )}
                          </div>
                          <p className="mt-2.5 font-semibold text-slate-900 text-sm">
                            {dept.short}
                          </p>
                          <p className="line-clamp-1 text-[11px] text-slate-500">
                            {dept.recipientRole}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Recipient designation info */}
                <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">Người nhận nhiệm vụ:</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-medium text-slate-700 shadow-sm border border-slate-200/60">
                      {assignToAllDepartments
                        ? "Trưởng Ban của cả 6 ban"
                        : `${activeDeptMeta.recipientRole} · ${departmentLeads[activeDeptMeta.code] || activeDeptMeta.defaultLeadName}`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    (Gán tự động)
                  </span>
                </div>
              </div>

              {/* 2. TIÊU ĐỀ NHIỆM VỤ (title - VARCHAR(255) NOT NULL) */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="task-title-input"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    2. Tiêu đề nhiệm vụ (`title`){" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    {taskTitle.length}/255 ký tự
                  </span>
                </div>
                <input
                  id="task-title-input"
                  type="text"
                  maxLength={255}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ví dụ: Thiết kế bộ nhận diện & trailer cho NEU Debate Open 2025"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                  required
                />
              </div>

              {/* 3. MÔ TẢ CHI TIẾT (`description` - TEXT) */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  3. Mô tả chi tiết & Yêu cầu bàn giao (`description`)
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={4}
                  placeholder="Nêu rõ mục tiêu công việc, yêu cầu chất lượng, các mốc kiểm tra và tài liệu tham khảo để Trưởng ban dễ dàng giao lại cho thành viên..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                />
              </div>

              {/* 4. SỰ KIỆN LIÊN KẾT (`event_id` - UUID) & HẠN CHÓT (`deadline` - TIMESTAMPTZ) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    4. Sự kiện liên kết (`event_id`)
                  </label>
                  <select
                    value={taskEventId}
                    onChange={(e) => setTaskEventId(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                  >
                    <option value="none">Không gắn sự kiện (Việc thường kỳ ban)</option>
                    {eventsList.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      5. Hạn chót hoàn thành (`deadline`)
                    </label>
                  </div>
                  <input
                    type="datetime-local"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                  />
                  {/* Quick deadline pills */}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="text-slate-400 mr-1 self-center">Gợi ý:</span>
                    <button
                      type="button"
                      onClick={() => setQuickDeadline(1)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    >
                      +1 Ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDeadline(3)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    >
                      +3 Ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDeadline(7)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    >
                      +1 Tuần
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. MỨC ĐỘ ƯU TIÊN (`priority`) & TRẠNG THÁI KHỞI TẠO (`status`) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    6. Mức độ ưu tiên (`priority`)
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { key: "low", label: "Thấp", color: "hover:border-emerald-300" },
                      { key: "medium", label: "Trung bình", color: "hover:border-amber-300" },
                      { key: "high", label: "Cao", color: "hover:border-rose-300" },
                    ].map((p) => {
                      const isSel = taskPriority === p.key;
                      let activeClass = "";
                      if (isSel) {
                        if (p.key === "high")
                          activeClass = "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20";
                        else if (p.key === "medium")
                          activeClass = "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20";
                        else
                          activeClass = "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20";
                      } else {
                        activeClass = "border-slate-200 bg-white text-slate-700";
                      }
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setTaskPriority(p.key as TaskPriority)}
                          className={`rounded-2xl border px-3 py-2.5 text-xs font-medium transition ${activeClass}`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    7. Trạng thái khởi tạo (`status`)
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
                  >
                    <option value="todo">Cần làm (Chờ Trưởng ban triển khai)</option>
                    <option value="in_progress">Đang làm (Đã bắt đầu thực hiện)</option>
                    <option value="done">Hoàn thành (Đã nghiệm thu xong)</option>
                  </select>
                </div>
              </div>

              {/* 6. NHIỆM VỤ LIÊN BAN (`is_cross_department` - BOOLEAN) */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isCrossDepartment}
                    onChange={(e) => setIsCrossDepartment(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#E11D48] focus:ring-[#E11D48]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">
                      8. Đánh dấu nhiệm vụ phối hợp liên ban (`is_cross_department`)
                    </span>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Bật cờ này nếu công việc yêu cầu sự tham gia, trao đổi hoặc nghiệm thu chéo giữa nhiều ban chuyên môn.
                    </p>
                  </div>
                </label>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <ActionButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  icon={<Send className="h-4 w-4" />}
                >
                  {isSubmitting
                    ? "Đang lưu..."
                    : assignToAllDepartments
                      ? "Phân phối tới 6 Trưởng ban"
                      : `Giao nhiệm vụ cho ${activeDeptMeta.recipientRole}`}
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setTaskTitle("");
                    setTaskDescription("");
                    setTaskDeadline("");
                    setTaskPriority("medium");
                    setTaskStatus("todo");
                    setTaskEventId("none");
                    setIsCrossDepartment(false);
                    setAssignToAllDepartments(false);
                  }}
                >
                  Đặt lại form
                </ActionButton>
              </div>
            </form>
          </Section>
        </div>

        {/* ==================================================================== */}
        {/* CỘT PHẢI: DANH SÁCH & BỘ LỌC NHIỆM VỤ THEO CÁC BAN */}
        {/* ==================================================================== */}
        <div className="space-y-6">
          <Section
            title="Nhiệm vụ đã phân phối theo Ban"
            subtitle={`Đang hiển thị ${filteredTasks.length} nhiệm vụ phù hợp với bộ lọc.`}
          >
            {/* Thanh tìm kiếm & bộ lọc */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tiêu đề, mô tả hoặc ban..."
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Tabs lọc theo Ban */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setFilterDepartment("ALL")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filterDepartment === "ALL"
                    ? "bg-[#E11D48] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  Tất cả các ban ({tasks.length})
                </button>
                {DEPARTMENTS.map((dept) => {
                  const count = tasks.filter((t) => t.department === dept.code).length;
                  const isSel = filterDepartment === dept.code;
                  return (
                    <button
                      key={dept.code}
                      type="button"
                      onClick={() => setFilterDepartment(dept.code)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${isSel
                        ? "bg-[#E11D48] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <span>{dept.short}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${isSel ? "bg-white/30 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Lọc phụ: Trạng thái, Ưu tiên, Cờ liên ban */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 outline-none focus:border-[#E11D48]"
                >
                  <option value="ALL">Mọi trạng thái</option>
                  <option value="todo">Cần làm (`todo`)</option>
                  <option value="in_progress">Đang làm (`in_progress`)</option>
                  <option value="done">Hoàn thành (`done`)</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 outline-none focus:border-[#E11D48]"
                >
                  <option value="ALL">Mọi mức ưu tiên</option>
                  <option value="high">Ưu tiên Cao</option>
                  <option value="medium">Ưu tiên Trung bình</option>
                  <option value="low">Ưu tiên Thấp</option>
                </select>

                <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={filterCrossDeptOnly}
                    onChange={(e) => setFilterCrossDeptOnly(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#E11D48] focus:ring-[#E11D48]"
                  />
                  <span>Chỉ task liên ban</span>
                </label>
              </div>
            </div>

            {/* DANH SÁCH THẺ NHIỆM VỤ */}
            <div className="mt-5 space-y-3.5">
              {filteredTasks.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                  <Clock className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 font-medium text-slate-800">
                    Không tìm thấy nhiệm vụ nào phù hợp
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Hãy thử thay đổi từ khóa hoặc điều chỉnh các tiêu chí bộ lọc phía trên.
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const deptMeta =
                    DEPARTMENTS.find((d) => d.code === task.department) ?? DEPARTMENTS[0];
                  const DeptIcon = deptMeta.icon;

                  // Priority badge config
                  const priorityConfig = {
                    low: { label: "Ưu tiên: Thấp", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                    medium: { label: "Ưu tiên: TB", class: "bg-amber-50 text-amber-700 border-amber-200" },
                    high: { label: "Ưu tiên: Cao", class: "bg-rose-50 text-rose-700 border-rose-200 font-semibold" },
                  }[task.priority];

                  // Status badge config
                  const statusConfig = {
                    todo: { label: "Cần làm", class: "bg-slate-100 text-slate-700 border-slate-200" },
                    in_progress: { label: "Đang làm", class: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse" },
                    done: { label: "Hoàn thành", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  }[task.status];

                  const deadlineDate = new Date(task.deadline);
                  const isOverdue =
                    task.status !== "done" && deadlineDate.getTime() < Date.now();

                  return (
                    <article
                      key={task.id}
                      className="group relative rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition hover:border-slate-300 hover:shadow-md"
                    >
                      {/* Header thẻ: Ban nhận & Mức độ ưu tiên */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${deptMeta.colors.badge}`}
                          >
                            <DeptIcon className="h-3.5 w-3.5" />
                            {task.department_name}
                          </span>
                          {task.is_cross_department && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                              <Layers className="h-3 w-3" />
                              Liên ban
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 ${priorityConfig.class}`}
                          >
                            {priorityConfig.label}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium ${statusConfig.class}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Tiêu đề & mô tả */}
                      <h4 className="mt-3 text-base font-semibold tracking-tight text-slate-900 group-hover:text-[#E11D48] transition">
                        {task.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                        {task.description}
                      </p>

                      {/* Sự kiện liên kết nếu có */}
                      {task.event_title && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">Sự kiện:</span>
                          <span className="truncate">{task.event_title}</span>
                        </div>
                      )}

                      {/* Footer: Trưởng ban tiếp nhận, Hạn chót & Action */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                            TB
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">
                              {task.assigned_to_title}
                            </span>
                            {task.assigned_to_name && (
                              <span className="text-slate-500 ml-1">
                                ({task.assigned_to_name})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center gap-1 font-medium ${isOverdue ? "text-rose-600 font-semibold" : "text-slate-600"
                              }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {isOverdue ? "Quá hạn: " : "Hạn: "}
                              {deadlineDate.toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedTaskForModal(task)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              title="Xem chi tiết đầy đủ thông số bảng tasks"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Toggle status
                                const next =
                                  task.status === "todo"
                                    ? "in_progress"
                                    : task.status === "in_progress"
                                      ? "done"
                                      : "todo";
                                handleUpdateStatus(task.id, next);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition"
                              title="Chuyển trạng thái tiếp theo"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Xóa nhiệm vụ"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL XEM CHI TIẾT ĐẦY ĐỦ CÁC CỘT TRONG BẢNG `tasks` */}
      {/* ==================================================================== */}
      {selectedTaskForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl md:p-8">
            <button
              type="button"
              onClick={() => setSelectedTaskForModal(null)}
              className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#E11D48]">
                Bảng `tasks` schema record
              </span>
              <span className="text-xs text-slate-400">
                ID: {selectedTaskForModal.id}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
              {selectedTaskForModal.title}
            </h3>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {selectedTaskForModal.description}
            </div>

            {/* Chi tiết từng thuộc tính cơ sở dữ liệu */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <span className="text-slate-400">Ban phụ trách (`department`)</span>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedTaskForModal.department_name} ({selectedTaskForModal.department})
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <span className="text-slate-400">Người nhận (`assigned_to`)</span>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedTaskForModal.assigned_to_title}
                  {selectedTaskForModal.assigned_to_name && (
                    <span className="block text-[11px] font-normal text-slate-500">
                      {selectedTaskForModal.assigned_to_name}
                    </span>
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <span className="text-slate-400">Người giao (`assigned_by`)</span>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedTaskForModal.assigned_by_name}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <span className="text-slate-400">Mức ưu tiên (`priority`)</span>
                <p className="mt-1 font-semibold uppercase text-slate-900">
                  {selectedTaskForModal.priority}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <span className="text-slate-400">Trạng thái (`status`)</span>
                <p className="mt-1 font-semibold uppercase text-slate-900">
                  {selectedTaskForModal.status}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <span className="text-slate-400">Liên ban (`is_cross_department`)</span>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedTaskForModal.is_cross_department ? "true (Có)" : "false (Không)"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3 sm:col-span-2">
                <span className="text-slate-400">Sự kiện liên kết (`event_id`)</span>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedTaskForModal.event_title || "null (Không gắn sự kiện)"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <span className="text-slate-400">Hạn chót (`deadline`)</span>
                <p className="mt-1 font-semibold text-slate-900">
                  {new Date(selectedTaskForModal.deadline).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
              <div>
                Tạo lúc: {new Date(selectedTaskForModal.created_at).toLocaleString("vi-VN")}
              </div>
              {selectedTaskForModal.completed_at && (
                <div className="text-emerald-600 font-medium">
                  Hoàn tất lúc: {new Date(selectedTaskForModal.completed_at).toLocaleString("vi-VN")}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <ActionButton
                variant="outline"
                onClick={() => setSelectedTaskForModal(null)}
              >
                Đóng
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
