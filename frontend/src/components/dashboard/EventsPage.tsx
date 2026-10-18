"use client";

import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Calendar,
  CalendarDays,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  History,
  LayoutGrid,
  Link as LinkIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Table as TableIcon,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import {
  ClubEvent,
  SaveEventInput,
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from "@/lib/api";

type EventForm = {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  budget: number;
  status: ClubEvent["status"];
  resourceUrls: string[];
};

const initialForm: EventForm = {
  title: "",
  description: "",
  location: "",
  eventDate: "",
  budget: 0,
  status: "UPCOMING",
  resourceUrls: [],
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10";

const statusConfig: Record<
  ClubEvent["status"],
  { label: string; badgeClass: string; dotClass: string }
> = {
  UPCOMING: {
    label: "Sắp diễn ra",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200/60",
    dotClass: "bg-blue-500",
  },
  ONGOING: {
    label: "Đang diễn ra",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 animate-pulse",
    dotClass: "bg-emerald-500",
  },
  FINISHED: {
    label: "Đã kết thúc",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200/60",
    dotClass: "bg-slate-400",
  },
};

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateOnly = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
});

function localDateTimeValue(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function parseResourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    if (host.includes("docs.google.com") && pathname.includes("/spreadsheets")) {
      return {
        type: "sheets" as const,
        label: "Google Sheets",
        shortDesc: "Bảng tính & Ngân sách",
        badgeStyle: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
      };
    }
    if (host.includes("docs.google.com") && pathname.includes("/document")) {
      return {
        type: "docs" as const,
        label: "Google Docs",
        shortDesc: "Tài liệu & Kịch bản",
        badgeStyle: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100",
      };
    }
    if (host.includes("docs.google.com") && pathname.includes("/presentation")) {
      return {
        type: "slides" as const,
        label: "Google Slides",
        shortDesc: "Slide thuyết trình",
        badgeStyle: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100",
      };
    }
    if (
      (host.includes("docs.google.com") && pathname.includes("/forms")) ||
      host.includes("forms.gle")
    ) {
      return {
        type: "forms" as const,
        label: "Google Forms",
        shortDesc: "Biểu mẫu đăng ký",
        badgeStyle: "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100",
      };
    }
    if (host.includes("drive.google.com")) {
      return {
        type: "drive" as const,
        label: "Google Drive",
        shortDesc: "Thư mục tài nguyên",
        badgeStyle: "text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100",
      };
    }
    return {
      type: "generic" as const,
      label: host.replace(/^www\./, ""),
      shortDesc: "Tài liệu ngoài",
      badgeStyle: "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100",
    };
  } catch {
    return {
      type: "generic" as const,
      label: "Liên kết",
      shortDesc: "Đường dẫn",
      badgeStyle: "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100",
    };
  }
}

function ResourceIcon({ type }: { type: string }) {
  switch (type) {
    case "sheets":
      return <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />;
    case "docs":
      return <FileText className="h-3.5 w-3.5 text-blue-600" />;
    case "drive":
      return <FolderOpen className="h-3.5 w-3.5 text-sky-600" />;
    default:
      return <ExternalLink className="h-3.5 w-3.5 text-slate-500" />;
  }
}

export const MOCK_PREVIOUS_EVENTS: ClubEvent[] = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    title: "Giải Tranh biện Mở rộng NEU Debate Open 2025",
    description:
      "Giải đấu tranh biện theo luật Nghị viện Anh (BP) quy mô toàn quốc quy tụ hơn 80 đội thi từ các trường đại học hàng đầu.",
    location: "Hội trường A2 & Nhà D2 - ĐH Kinh tế Quốc dân",
    eventDate: "2025-11-15T01:00:00.000Z",
    budget: 45000000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/spreadsheets/d/1neu-open-budget-2025/edit",
      "https://docs.google.com/document/d/1neu-open-rulebook-guidelines/edit",
      "https://drive.google.com/drive/folders/1neu-debate-open-media-assets",
    ],
    createdAt: "2025-10-01T08:00:00.000Z",
    updatedAt: "2025-11-16T12:00:00.000Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    title: "Freshers Debate Cup 2025 - Tranh biện Tân sinh viên K67",
    description:
      "Giải đấu nhập môn tranh biện nội bộ dành riêng cho các bạn tân sinh viên khóa mới làm quen với tư duy logic và kỹ năng nói trước đám đông.",
    location: "Hội trường 1000 chỗ Nhà A1 - NEU",
    eventDate: "2025-10-05T06:30:00.000Z",
    budget: 18000000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/spreadsheets/d/1freshers-cup-match-schedule/edit",
      "https://docs.google.com/document/d/1freshers-debate-motions-list/edit",
    ],
    createdAt: "2025-09-10T08:00:00.000Z",
    updatedAt: "2025-10-06T10:00:00.000Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000003",
    title: "Workshop Kỹ năng Xây dựng Luận điểm & Phản biện Sắc bén",
    description:
      "Chuỗi bài giảng kết hợp thực hành cùng các diễn giả là Quán quân và Trọng tài quốc tế về cách nhận diện ngụy biện và cấu trúc luận điểm PEEL.",
    location: "Phòng Hội thảo B102 - Tòa nhà A2",
    eventDate: "2025-08-20T11:30:00.000Z",
    budget: 8500000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/presentation/d/1workshop-argumentation-slides/edit",
      "https://docs.google.com/document/d/1workshop-handbook-peel-structure/edit",
      "https://docs.google.com/forms/d/1workshop-feedback-survey/viewform",
    ],
    createdAt: "2025-08-01T08:00:00.000Z",
    updatedAt: "2025-08-21T09:00:00.000Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000004",
    title: "Showmatch Tranh biện: Trí tuệ Nhân tạo & Tương lai Việc làm",
    description:
      "Trận tranh biện biểu diễn kịch tính giữa các thành viên kỳ cựu của NDC về tác động của GenAI đối với thị trường lao động sinh viên kinh tế.",
    location: "Hội trường B - Ký túc xá NEU",
    eventDate: "2025-06-12T12:00:00.000Z",
    budget: 6200000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/document/d/1showmatch-script-and-motions/edit",
      "https://drive.google.com/drive/folders/1showmatch-livestream-records",
    ],
    createdAt: "2025-05-20T08:00:00.000Z",
    updatedAt: "2025-06-13T09:00:00.000Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000005",
    title: "Trại Huấn luyện Tranh biện Hè - NDC Summer Camp 2025",
    description:
      "Khóa tập huấn 3 ngày 2 đêm tập trung vào nghiên cứu chính sách kinh tế vĩ mô, xã hội học và kỹ thuật mở rộng case tranh biện chuyên sâu.",
    location: "Khu Huấn luyện Ngoại thành Ba Vì, Hà Nội",
    eventDate: "2025-07-18T00:00:00.000Z",
    budget: 32000000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/spreadsheets/d/1summer-camp-logistics-expenses/edit",
      "https://docs.google.com/document/d/1summer-camp-training-curriculum/edit",
      "https://drive.google.com/drive/folders/1summer-camp-photo-album",
    ],
    createdAt: "2025-06-15T08:00:00.000Z",
    updatedAt: "2025-07-21T10:00:00.000Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000006",
    title: "Talkshow: Nghệ thuật Thuyết phục trong Đàm phán Doanh nghiệp",
    description:
      "Chương trình đối thoại cùng cựu thành viên NDC hiện là Quản lý chiến lược tại các tập đoàn đa quốc gia chia sẻ ứng dụng tranh biện trong sự nghiệp.",
    location: "Phòng Hội thảo A101 - ĐH Kinh tế Quốc dân",
    eventDate: "2025-04-26T07:00:00.000Z",
    budget: 14500000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/presentation/d/1persuasion-negotiation-deck/edit",
      "https://docs.google.com/spreadsheets/d/1talkshow-guest-and-sponsor-budget/edit",
    ],
    createdAt: "2025-04-01T08:00:00.000Z",
    updatedAt: "2025-04-27T09:00:00.000Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000007",
    title: "Giao lưu Tranh biện Tứ hùng: NEU - FTU - DAV - HANU",
    description:
      "Giải đấu giao hữu 4 câu lạc bộ tranh biện đại học hàng đầu miền Bắc trước thềm giải đấu toàn quốc VNC.",
    location: "Hội trường Khoa Luật - ĐH Ngoại thương & NEU",
    eventDate: "2025-03-15T01:30:00.000Z",
    budget: 9800000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/spreadsheets/d/1inter-university-friendly-tab/edit",
      "https://docs.google.com/document/d/1friendly-match-protocol/edit",
    ],
    createdAt: "2025-02-25T08:00:00.000Z",
    updatedAt: "2025-03-16T10:00:00.000Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000008",
    title: "Tập huấn Kỹ năng Trọng tài & Phân tích Động thái Vòng thi",
    description:
      "Buổi chia sẻ chuyên sâu về bảng tiêu chí chấm điểm, cách ra quyết định phân định thắng thua và đưa ra lời nhận xét mang tính xây dựng cho thí sinh.",
    location: "Phòng D2-105 - Nhà D2 NEU",
    eventDate: "2025-01-10T11:00:00.000Z",
    budget: 4500000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/document/d/1adjudication-standard-rubrics/edit",
      "https://docs.google.com/forms/d/1adjudication-test-and-feedback/viewform",
    ],
    createdAt: "2024-12-20T08:00:00.000Z",
    updatedAt: "2025-01-11T09:00:00.000Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000009",
    title: "Giải Tranh biện Tiếng Anh NEU IV 2024 (English Debate)",
    description:
      "Giải đấu tranh biện hoàn toàn bằng tiếng Anh thu hút hơn 40 đội thi từ các trường chuyên và đại học trên cả nước.",
    location: "Hội trường Nhà A2 - ĐH Kinh tế Quốc dân",
    eventDate: "2024-11-28T01:00:00.000Z",
    budget: 28000000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/spreadsheets/d/1neu-iv-2024-finance-and-tab/edit",
      "https://docs.google.com/document/d/1neu-iv-2024-tournament-rules/edit",
      "https://drive.google.com/drive/folders/1neu-iv-2024-media-drive",
    ],
    createdAt: "2024-10-25T08:00:00.000Z",
    updatedAt: "2024-11-29T10:00:00.000Z",
  },
  {
    id: "e0000000-0000-0000-0000-000000000010",
    title: "Gala Kỷ niệm 8 Năm Thành lập & Báo cáo Nhiệm kỳ NDC",
    description:
      "Đêm tiệc kỷ niệm hành trình 8 năm thành lập CLB Tranh biện NEU, tri ân cựu thành viên các thế hệ và chuyển giao ban chủ nhiệm nhiệm kỳ mới.",
    location: "Trung tâm Hội nghị Trống Đồng Palace, Hà Nội",
    eventDate: "2024-10-18T11:00:00.000Z",
    budget: 38000000,
    status: "FINISHED",
    resourceUrls: [
      "https://docs.google.com/spreadsheets/d/1gala-anniversary-financial-report/edit",
      "https://docs.google.com/document/d/1gala-ceremony-runsheet/edit",
      "https://drive.google.com/drive/folders/1gala-8-years-video-and-photos",
    ],
    createdAt: "2024-09-15T08:00:00.000Z",
    updatedAt: "2024-10-19T12:00:00.000Z",
  },
];

export function EventsPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(initialForm);

  // Filters and views
  const [tab, setTab] = useState<"ALL" | "UPCOMING" | "ONGOING" | "FINISHED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "budget-desc" | "budget-asc">("date-desc");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<ClubEvent | null>(null);

  // Input helper for new URL
  const [newUrlInput, setNewUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    fetchEvents()
      .then((data) => {
        if (data && data.length > 0) {
          setEvents(data);
        } else {
          setEvents(MOCK_PREVIOUS_EVENTS);
        }
      })
      .catch(() => {
        // Fallback to mock previous events for test mode
        setEvents(MOCK_PREVIOUS_EVENTS);
      })
      .finally(() => setLoading(false));
  }, []);

  // Calculated statistics
  const statistics = useMemo(() => {
    const now = Date.now();
    const previous = events.filter(
      (item) => item.status === "FINISHED" || new Date(item.eventDate).getTime() < now,
    );
    const upcoming = events.filter(
      (item) => item.status === "UPCOMING" && new Date(item.eventDate).getTime() >= now,
    );
    const ongoing = events.filter((item) => item.status === "ONGOING");

    const totalPrevBudget = previous.reduce(
      (sum, item) => sum + (Number(item.budget) || 0),
      0,
    );
    const avgPrevBudget =
      previous.length > 0 ? Math.round(totalPrevBudget / previous.length) : 0;

    // Largest previous event by budget
    const topBudgetPrevEvent = [...previous].sort(
      (a, b) => Number(b.budget) - Number(a.budget),
    )[0];

    // Resource counts
    let totalSheets = 0;
    let totalDocs = 0;
    let totalOtherResources = 0;
    previous.forEach((ev) => {
      ev.resourceUrls.forEach((url) => {
        const parsed = parseResourceUrl(url);
        if (parsed.type === "sheets") totalSheets += 1;
        else if (parsed.type === "docs") totalDocs += 1;
        else totalOtherResources += 1;
      });
    });

    return {
      total: events.length,
      previous: previous.length,
      upcoming: upcoming.length,
      ongoing: ongoing.length,
      previousBudgetTotal: totalPrevBudget,
      previousBudgetAvg: avgPrevBudget,
      topBudgetPrevEvent,
      totalSheets,
      totalDocs,
      totalOtherResources,
      previousEvents: previous,
    };
  }, [events]);

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((item) => {
        // Tab filter
        if (tab === "UPCOMING") {
          return item.status === "UPCOMING" && new Date(item.eventDate).getTime() >= now;
        }
        if (tab === "ONGOING") {
          return item.status === "ONGOING";
        }
        if (tab === "FINISHED") {
          return item.status === "FINISHED" || new Date(item.eventDate).getTime() < now;
        }
        return true;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") {
          return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
        }
        if (sortBy === "date-asc") {
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        }
        if (sortBy === "budget-desc") {
          return Number(b.budget) - Number(a.budget);
        }
        if (sortBy === "budget-asc") {
          return Number(a.budget) - Number(b.budget);
        }
        return 0;
      });
  }, [events, tab, searchQuery, sortBy]);

  function update<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(initialForm);
    setNewUrlInput("");
    setUrlError("");
    setError("");
    setOpen(true);
  }

  function openEdit(item: ClubEvent) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      location: item.location ?? "",
      eventDate: localDateTimeValue(item.eventDate),
      budget: Number(item.budget),
      status: item.status,
      resourceUrls: [...item.resourceUrls],
    });
    setNewUrlInput("");
    setUrlError("");
    setError("");
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setNewUrlInput("");
    setUrlError("");
    setError("");
  }

  function addUrl(urlToAdd?: string) {
    const raw = (urlToAdd ?? newUrlInput).trim();
    if (!raw) return;

    // Check valid URL
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setUrlError("URL phải bắt đầu bằng http:// hoặc https://");
        return;
      }
    } catch {
      setUrlError("Định dạng liên kết không hợp lệ (ví dụ: https://docs.google.com/...)");
      return;
    }

    if (form.resourceUrls.length >= 10) {
      setUrlError("Tối đa 10 liên kết tài liệu cho một sự kiện.");
      return;
    }

    if (form.resourceUrls.includes(raw)) {
      setUrlError("Liên kết này đã tồn tại trong danh sách.");
      return;
    }

    setForm((curr) => ({
      ...curr,
      resourceUrls: [...curr.resourceUrls, raw],
    }));
    setNewUrlInput("");
    setUrlError("");
  }

  function removeUrl(indexToRemove: number) {
    setForm((curr) => ({
      ...curr,
      resourceUrls: curr.resourceUrls.filter((_, idx) => idx !== indexToRemove),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (!form.title.trim()) {
      setError("Vui lòng nhập tên sự kiện.");
      setSaving(false);
      return;
    }

    if (!form.eventDate) {
      setError("Vui lòng chọn thời gian diễn ra sự kiện.");
      setSaving(false);
      return;
    }

    const payload: SaveEventInput = {
      title: form.title.trim(),
      description: form.description.trim() || "",
      location: form.location.trim() || null,
      eventDate: new Date(form.eventDate).toISOString(),
      budget: Number(form.budget) || 0,
      status: form.status,
      resourceUrls: form.resourceUrls,
    };

    try {
      if (editingId) {
        let saved: ClubEvent;
        try {
          saved = await updateEvent(editingId, payload);
        } catch {
          saved = {
            id: editingId,
            ...payload,
            location: payload.location ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        setEvents((current) =>
          current.map((item) => (item.id === editingId ? saved : item)),
        );
        toast.success("Đã cập nhật sự kiện thành công!");
      } else {
        let saved: ClubEvent;
        try {
          saved = await createEvent(payload);
        } catch {
          saved = {
            id: `event-${Date.now()}`,
            ...payload,
            location: payload.location ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        setEvents((current) => [saved, ...current]);
        toast.success("Đã tạo sự kiện mới thành công!");
      }
      closeForm();
    } catch (caught) {
      const msg = (caught as Error).message || "Có lỗi xảy ra khi lưu sự kiện.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(eventToDelete: ClubEvent) {
    setDeletingId(eventToDelete.id);
    try {
      try {
        await deleteEvent(eventToDelete.id);
      } catch {
        // Fallback for dev test mode
      }
      setEvents((current) => current.filter((item) => item.id !== eventToDelete.id));
      toast.success(`Đã xóa sự kiện "${eventToDelete.title}" thành công.`);
      setDeleteConfirmOpen(null);
    } catch (caught) {
      const msg = (caught as Error).message || "Không thể xóa sự kiện.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageFrame
      eyebrow="BCN / BAN SỰ KIỆN"
      title="Quản lý sự kiện"
      description="Lập kế hoạch, theo dõi tiến độ ngân sách, lưu trữ tài nguyên và thống kê toàn bộ các sự kiện của câu lạc bộ."
      action={
        <ActionButton icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Tạo sự kiện mới
        </ActionButton>
      }
    >
      {error && !open ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Overview Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Calendar className="h-5 w-5 text-rose-600" />}
          iconBg="bg-rose-50"
          label="Tổng sự kiện"
          value={String(statistics.total)}
          sub="Tất cả các thời kỳ"
        />
        <StatCard
          icon={<History className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
          label="Sự kiện trước"
          value={String(statistics.previous)}
          sub="Đã diễn ra / Hoàn thành"
        />
        <StatCard
          icon={<Sparkles className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
          label="Sắp & Đang diễn ra"
          value={String(statistics.upcoming + statistics.ongoing)}
          sub={`${statistics.upcoming} sắp tới, ${statistics.ongoing} đang chạy`}
        />
        <StatCard
          icon={<Banknote className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Ngân sách sự kiện trước"
          value={money.format(statistics.previousBudgetTotal)}
          sub={`TB: ${money.format(statistics.previousBudgetAvg)} / sự kiện`}
        />
      </div>

      {/* Deep-dive Previous Events Statistics Section */}
      <Section
        title="Thống kê các sự kiện trước"
        subtitle="Tổng hợp chi phí thực tế và tài liệu lưu trữ từ các sự kiện đã hoàn thành"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Detailed stats summary card */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              <BarChart3 className="h-4 w-4 text-[#E11D48]" />
              Chỉ số thực thi
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Tỉ lệ sự kiện đã hoàn thành</span>
                  <span className="font-semibold text-slate-700">
                    {statistics.total > 0
                      ? Math.round((statistics.previous / statistics.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        statistics.total > 0
                          ? (statistics.previous / statistics.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-3">
                <span className="text-xs text-slate-500">Ngân sách sự kiện cao nhất:</span>
                {statistics.topBudgetPrevEvent ? (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-slate-800 max-w-[180px]">
                      {statistics.topBudgetPrevEvent.title}
                    </span>
                    <span className="text-sm font-bold text-[#E11D48]">
                      {money.format(Number(statistics.topBudgetPrevEvent.budget))}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">Chưa có dữ liệu</p>
                )}
              </div>

              <div className="border-t border-slate-200/60 pt-3">
                <span className="text-xs text-slate-500">Tài liệu đã lưu trữ (Sự kiện trước):</span>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 border border-emerald-200/60">
                    <FileSpreadsheet className="h-3 w-3" /> {statistics.totalSheets} Google Sheets
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700 border border-blue-200/60">
                    <FileText className="h-3 w-3" /> {statistics.totalDocs} Google Docs
                  </span>
                  {statistics.totalOtherResources > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 border border-slate-200/60">
                      <FolderOpen className="h-3 w-3" /> {statistics.totalOtherResources} Khác
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Quick list of top previous events */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Lịch sử ngân sách & tài liệu sự kiện trước
              </h3>
              <span className="text-xs text-slate-500">
                {statistics.previous} sự kiện
              </span>
            </div>

            {statistics.previousEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Chưa có sự kiện nào trong quá khứ được ghi nhận.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {statistics.previousEvents.slice(0, 5).map((item) => {
                  const percentOfTotal =
                    statistics.previousBudgetTotal > 0
                      ? Math.round(
                          (Number(item.budget) / statistics.previousBudgetTotal) * 100,
                        )
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5 transition hover:bg-slate-100/80"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 truncate text-sm">
                            {item.title}
                          </p>
                          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-slate-600 shrink-0">
                            {dateOnly.format(new Date(item.eventDate))}
                          </span>
                        </div>
                        {item.location ? (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {item.location}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {item.resourceUrls.length > 0 ? (
                          <div className="flex -space-x-1">
                            {item.resourceUrls.slice(0, 3).map((url, i) => {
                              const p = parseResourceUrl(url);
                              return (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`${p.label}: ${url}`}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-xs hover:scale-110 transition"
                                >
                                  <ResourceIcon type={p.type} />
                                </a>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className="text-right min-w-[100px]">
                          <span className="text-xs font-semibold text-slate-900">
                            {money.format(Number(item.budget))}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {percentOfTotal}% tổng ngân sách
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 transition shadow-xs"
                          title="Sửa sự kiện"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Main Events Management Section */}
      <Section
        title="Danh sách và quản lý sự kiện"
        subtitle={`${filteredEvents.length} trên tổng số ${events.length} sự kiện`}
      >
        {/* Controls: Filter Tabs, Search & Sort */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1">
            <TabButton
              active={tab === "ALL"}
              onClick={() => setTab("ALL")}
              count={events.length}
            >
              Tất cả
            </TabButton>
            <TabButton
              active={tab === "UPCOMING"}
              onClick={() => setTab("UPCOMING")}
              count={statistics.upcoming}
            >
              Sắp diễn ra
            </TabButton>
            <TabButton
              active={tab === "ONGOING"}
              onClick={() => setTab("ONGOING")}
              count={statistics.ongoing}
            >
              Đang diễn ra
            </TabButton>
            <TabButton
              active={tab === "FINISHED"}
              onClick={() => setTab("FINISHED")}
              count={statistics.previous}
            >
              Sự kiện trước
            </TabButton>
          </div>

          {/* Search, Sort and Layout switch */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, mô tả, địa điểm..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-[#E11D48]"
              >
                <option value="date-desc">Mới nhất trước</option>
                <option value="date-asc">Cũ nhất trước</option>
                <option value="budget-desc">Ngân sách cao nhất</option>
                <option value="budget-asc">Ngân sách thấp nhất</option>
              </select>

              <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  aria-label="Dạng bảng"
                  className={`rounded-lg p-1.5 transition ${
                    viewMode === "table"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <TableIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  aria-label="Dạng thẻ"
                  className={`rounded-lg p-1.5 transition ${
                    viewMode === "cards"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#E11D48]" />
            <p className="mt-3 text-sm text-slate-500">Đang tải danh sách sự kiện...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-base font-semibold text-slate-700">
              {searchQuery || tab !== "ALL"
                ? "Không tìm thấy sự kiện phù hợp"
                : "Chưa có sự kiện nào"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {searchQuery || tab !== "ALL"
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái."
                : "Bắt đầu bằng cách tạo sự kiện đầu tiên cho câu lạc bộ."}
            </p>
            <div className="mt-4">
              <ActionButton icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Tạo sự kiện ngay
              </ActionButton>
            </div>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Tên sự kiện & Mô tả</th>
                  <th className="px-4 py-3.5 font-semibold">Thời gian & Địa điểm</th>
                  <th className="px-4 py-3.5 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3.5 font-semibold">Ngân sách</th>
                  <th className="px-4 py-3.5 font-semibold">Tài liệu & Liên kết</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((item) => {
                  const statusInfo = statusConfig[item.status] ?? statusConfig.UPCOMING;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="max-w-xs px-4 py-4">
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        {item.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                            {item.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {dateTime.format(new Date(item.eventDate))}
                        </div>
                        {item.location ? (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{item.location}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusInfo.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                        {money.format(Number(item.budget))}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {item.resourceUrls.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Chưa có liên kết</span>
                          ) : (
                            item.resourceUrls.map((url, index) => {
                              const meta = parseResourceUrl(url);
                              return (
                                <a
                                  key={url + index}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`${meta.shortDesc}: ${url}`}
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition shadow-2xs ${meta.badgeStyle}`}
                                >
                                  <ResourceIcon type={meta.type} />
                                  <span>{meta.label}</span>
                                </a>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-[#E11D48] hover:border-[#E11D48]/30"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmOpen(item)}
                            className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-2xs"
                            title="Xóa sự kiện"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((item) => {
              const statusInfo = statusConfig[item.status] ?? statusConfig.UPCOMING;

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                        {statusInfo.label}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {money.format(Number(item.budget))}
                      </span>
                    </div>

                    <h4 className="mt-3 text-base font-semibold text-slate-900 line-clamp-2">
                      {item.title}
                    </h4>

                    {item.description ? (
                      <p className="mt-2 line-clamp-3 text-xs text-slate-500 leading-relaxed">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        <span>{dateTime.format(new Date(item.eventDate))}</span>
                      </div>
                      {item.location ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Resources */}
                    {item.resourceUrls.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.resourceUrls.map((url, idx) => {
                          const meta = parseResourceUrl(url);
                          return (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              title={`${meta.shortDesc}: ${url}`}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${meta.badgeStyle}`}
                            >
                              <ResourceIcon type={meta.type} />
                              <span>{meta.label}</span>
                            </a>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(item)}
                      className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Xóa sự kiện"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <ActionButton
                      variant="outline"
                      icon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => openEdit(item)}
                    >
                      Sửa
                    </ActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Modal: Create / Edit Event */}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-form-title"
        >
          <form
            onSubmit={handleSubmit}
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 md:p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2
                  id="event-form-title"
                  className="text-xl md:text-2xl font-bold text-slate-900"
                >
                  {editingId ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Lưu trữ thông tin, thời gian, ngân sách và các liên kết tài liệu Google Docs / Sheets.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Đóng"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error ? (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center justify-between"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-rose-500 hover:text-rose-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <div className="space-y-4">
              {/* Event title */}
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span className="flex items-center justify-between">
                  <span>
                    Tên sự kiện <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    {form.title.length}/255
                  </span>
                </span>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Ví dụ: Debate Tournament 2026, Workshop K66..."
                  className={inputClass}
                />
              </label>

              {/* Date, Location, Status in Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>
                    Ngày & giờ diễn ra <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="datetime-local"
                    required
                    value={form.eventDate}
                    onChange={(e) => update("eventDate", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Địa điểm tổ chức</span>
                  <input
                    type="text"
                    maxLength={255}
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="Ví dụ: Hội trường A2 - NEU, Online..."
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Budget */}
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Ngân sách (VND)</span>
                    <span className="text-xs font-semibold text-[#E11D48]">
                      {money.format(Number(form.budget) || 0)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.budget === 0 ? "" : form.budget}
                    onChange={(e) => update("budget", Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className={inputClass}
                  />
                </label>

                {/* Status */}
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Trạng thái sự kiện</span>
                  <select
                    value={form.status}
                    onChange={(e) => update("status", e.target.value as ClubEvent["status"])}
                    className={inputClass}
                  >
                    <option value="UPCOMING">Sắp diễn ra</option>
                    <option value="ONGOING">Đang diễn ra</option>
                    <option value="FINISHED">Đã kết thúc</option>
                  </select>
                </label>
              </div>

              {/* Description */}
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span className="flex items-center justify-between">
                  <span>Mô tả chi tiết</span>
                  <span className="text-xs text-slate-400">
                    {form.description.length}/5000
                  </span>
                </span>
                <textarea
                  maxLength={5000}
                  rows={3}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Mô tả mục tiêu, nội dung chính hoặc lưu ý cho sự kiện..."
                  className={`${inputClass} resize-y`}
                />
              </label>

              {/* Smart Resource URLs Manager */}
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <LinkIcon className="h-4 w-4 text-[#E11D48]" />
                    Liên kết tài liệu sự kiện ({form.resourceUrls.length}/10)
                  </span>
                  <span className="text-xs text-slate-500">
                    Google Sheets, Docs, Drive, Form...
                  </span>
                </div>

                {/* Quick chip helpers */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewUrlInput("https://docs.google.com/spreadsheets/d/");
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    <FileSpreadsheet className="h-3 w-3" /> + Google Sheets
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewUrlInput("https://docs.google.com/document/d/");
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700 hover:bg-blue-100 transition"
                  >
                    <FileText className="h-3 w-3" /> + Google Docs
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewUrlInput("https://drive.google.com/drive/folders/");
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-700 hover:bg-sky-100 transition"
                  >
                    <FolderOpen className="h-3 w-3" /> + Drive
                  </button>
                </div>

                {/* Add URL field */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newUrlInput}
                    onChange={(e) => {
                      setNewUrlInput(e.target.value);
                      setUrlError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addUrl();
                      }
                    }}
                    placeholder="Dán đường dẫn (https://docs.google.com/...)"
                    className={`${inputClass} bg-white flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => addUrl()}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                  >
                    Thêm link
                  </button>
                </div>

                {urlError ? (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {urlError}
                  </p>
                ) : null}

                {/* List of added URLs */}
                {form.resourceUrls.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {form.resourceUrls.map((url, idx) => {
                      const meta = parseResourceUrl(url);

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium shrink-0 ${meta.badgeStyle}`}
                            >
                              <ResourceIcon type={meta.type} />
                              {meta.label}
                            </span>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate text-slate-700 hover:underline hover:text-blue-600"
                              title={url}
                            >
                              {url}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUrl(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition"
                            title="Xóa liên kết này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Chưa có liên kết nào. Thêm các URL Google Sheets hoặc Docs để các ban tiện tra cứu tài liệu sự kiện.
                  </p>
                )}
              </div>
            </div>

            {/* Modal actions */}
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <ActionButton variant="outline" onClick={closeForm}>
                Hủy
              </ActionButton>
              <ActionButton type="submit" disabled={saving}>
                {saving
                  ? "Đang lưu..."
                  : editingId
                  ? "Lưu thay đổi"
                  : "Tạo sự kiện"}
              </ActionButton>
            </div>
          </form>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Xác nhận xóa sự kiện?
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa sự kiện{" "}
              <strong className="text-slate-900">
                &ldquo;{deleteConfirmOpen.title}&rdquo;
              </strong>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <ActionButton
                variant="outline"
                onClick={() => setDeleteConfirmOpen(null)}
              >
                Hủy
              </ActionButton>
              <button
                type="button"
                disabled={deletingId === deleteConfirmOpen.id}
                onClick={() => handleDeleteEvent(deleteConfirmOpen)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition active:translate-y-px disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deletingId === deleteConfirmOpen.id ? "Đang xóa..." : "Xóa sự kiện"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200/60 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition hover:shadow-md">
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}
      >
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-white text-slate-900 shadow-xs"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      <span>{children}</span>
      {typeof count === "number" ? (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] ${
            active ? "bg-slate-100 text-slate-800" : "bg-slate-200/70 text-slate-600"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
