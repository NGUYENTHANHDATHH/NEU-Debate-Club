"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Download,
  ExternalLink,
  FileBadge2,
  FileText,
  Filter,
  HeartPulse,
  Mail,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Sparkles,
  SquareCheckBig,
  Upload,
  Users,
  Workflow,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

type Stat = {
  label: string;
  value: string;
  note?: string;
  tone?: "rose" | "emerald" | "slate" | "amber";
};

type Chip = {
  label: string;
  active?: boolean;
  count?: string | number;
};

type ListItem = {
  title: string;
  meta: string;
  detail: string;
  tone?: "rose" | "emerald" | "amber" | "slate";
};

type TableColumn = {
  label: string;
  align?: "left" | "right" | "center";
};

type TableRow = Array<string | ReactNode>;

type GalleryItem = {
  title: string;
  type: string;
  meta: string;
  status: string;
};

type TaskCardData = {
  title: string;
  department: string;
  deadline: string;
  priority: string;
  assignee: string;
  overdue?: boolean;
};

type SectionProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

type ButtonVariant = "primary" | "ghost" | "outline";

const toneClasses: Record<NonNullable<Stat["tone"]>, string> = {
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
};

function toneBadge(tone: NonNullable<Stat["tone"]>) {
  return toneClasses[tone];
}

export function PageFrame({
  eyebrow,
  title,
  description,
  children,
  action,
  aside,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#F9FAFB] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200/60 bg-white px-6 py-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#71717A]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight text-[#18181B] md:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#71717A] md:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {aside ? <div>{aside}</div> : null}
        <div className="grid gap-6">{children}</div>
      </div>
    </div>
  );
}

export function Section({
  title,
  subtitle,
  action,
  children,
  className,
}: SectionProps) {
  return (
    <section
      className={`rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] ${className ?? ""}`}
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#18181B]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#71717A]">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function ActionButton({
  children,
  icon,
  variant = "primary",
}: {
  children: ReactNode;
  icon?: ReactNode;
  variant?: ButtonVariant;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:translate-y-px";
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-[#E11D48] text-white shadow-[0_10px_30px_-12px_rgba(225,29,72,0.45)] hover:bg-[#be123c]",
    ghost: "bg-transparent text-[#18181B] hover:bg-slate-100",
    outline:
      "border border-slate-200 bg-white text-[#18181B] hover:bg-slate-50",
  };
  return (
    <button className={`${base} ${styles[variant]}`}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function StatGrid({ items }: { items: Stat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-[1.75rem] border p-5 shadow-[0_16px_32px_-18px_rgba(0,0,0,0.08)] ${
            item.tone
              ? toneBadge(item.tone)
              : "border-slate-200/60 bg-white text-[#18181B]"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-current/70">
            {item.label}
          </p>
          <div className="mt-3 text-3xl font-semibold tracking-tight">
            {item.value}
          </div>
          {item.note ? (
            <p className="mt-2 text-sm leading-6 text-current/75">
              {item.note}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ChipRow({ chips }: { chips: Chip[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
            chip.active
              ? "border-rose-200 bg-rose-50 text-[#E11D48]"
              : "border-slate-200 bg-white text-[#71717A]"
          }`}
        >
          {chip.label}
          {chip.count !== undefined ? (
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-current">
              {chip.count}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

export function InputToolbar() {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <label className="flex w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-[#71717A] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.15)] lg:max-w-md">
        <Search className="h-4 w-4 shrink-0" />
        <span className="sr-only">Search</span>
        <input
          className="w-full bg-transparent outline-none placeholder:text-[#A1A1AA]"
          placeholder="Tìm kiếm..."
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-[#18181B]">
          <Filter className="h-4 w-4" />
          Bộ lọc
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-[#18181B]">
          <SlidersHorizontalIcon />
          Sắp xếp
        </button>
      </div>
    </div>
  );
}

function SlidersHorizontalIcon() {
  return <BarChart3 className="h-4 w-4" />;
}

export function TaskBoard({ tasks }: { tasks: TaskCardData[] }) {
  const columns = [
    {
      title: "Cần làm",
      tone: "border-slate-200",
      items: tasks.filter(
        (task) => task.priority === "Thấp" || task.priority === "Trung bình",
      ),
    },
    {
      title: "Đang làm",
      tone: "border-blue-200",
      items: tasks.filter(
        (task) => task.priority === "Cao" || task.priority === "Khẩn cấp",
      ),
    },
    {
      title: "Hoàn thành",
      tone: "border-emerald-200",
      items: tasks.filter((task) => task.priority === "Done"),
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {columns.map((column) => (
        <div
          key={column.title}
          className={`rounded-[1.75rem] border bg-[#FAFAFA] p-4 ${column.tone}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#18181B]">{column.title}</h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#71717A]">
              {column.items.length}
            </span>
          </div>
          <div className="space-y-3">
            {column.items.map((task) => (
              <article
                key={`${column.title}-${task.title}`}
                className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_16px_28px_-20px_rgba(0,0,0,0.15)]"
              >
                <div className="flex items-start gap-3">
                  <SquareCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-[#E11D48]" />
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 text-sm font-medium leading-6 text-[#18181B]">
                      {task.title}
                    </h4>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[#E11D48]">
                        {task.department}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {task.deadline}
                      </span>
                      {task.overdue ? (
                        <span className="inline-flex items-center gap-1 text-rose-600">
                          <CircleAlert className="h-3.5 w-3.5" />
                          Quá hạn
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs text-[#71717A]">
                        <Users className="h-3.5 w-3.5" />
                        {task.assignee}
                      </span>
                      <button className="inline-flex items-center gap-1 text-xs font-medium text-[#E11D48]">
                        Xem chi tiết <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailList({ items }: { items: ListItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-white p-4"
        >
          <span
            className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone === "rose" ? "bg-rose-500" : item.tone === "emerald" ? "bg-emerald-500" : item.tone === "amber" ? "bg-amber-500" : "bg-slate-400"}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-medium text-[#18181B]">{item.title}</h4>
              <span className="shrink-0 text-xs text-[#71717A]">
                {item.meta}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#71717A]">
              {item.detail}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function TableCard({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
}) {
  return (
    <Section title={title}>
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/60">
        <table className="min-w-full divide-y divide-slate-200/60">
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.label}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8] ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 bg-white">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50/80">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-4 text-sm text-[#18181B] ${
                      columns[cellIndex]?.align === "right"
                        ? "text-right"
                        : columns[cellIndex]?.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function Timeline({ items }: { items: ListItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.title} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="h-3 w-3 rounded-full bg-[#E11D48]" />
            <span className="mt-2 min-h-14 w-px flex-1 bg-slate-200" />
          </div>
          <div className="flex-1 rounded-2xl border border-slate-200/60 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-medium text-[#18181B]">{item.title}</h4>
              <span className="text-xs text-[#71717A]">{item.meta}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#71717A]">
              {item.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Gallery({ items }: { items: GalleryItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="overflow-hidden rounded-[1.75rem] border border-slate-200/60 bg-white shadow-[0_16px_32px_-18px_rgba(0,0,0,0.08)]"
        >
          <div className="flex h-44 items-center justify-center border-b border-slate-200/60 bg-slate-50">
            {item.type === "Ảnh" ? (
              <ImageIcon className="h-10 w-10 text-[#E11D48]" />
            ) : item.type === "Video" ? (
              <Video className="h-10 w-10 text-[#E11D48]" />
            ) : (
              <FileText className="h-10 w-10 text-[#E11D48]" />
            )}
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="line-clamp-2 font-medium text-[#18181B]">
                {item.title}
              </h4>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs text-[#E11D48]">
                {item.status}
              </span>
            </div>
            <p className="text-sm text-[#71717A]">{item.type}</p>
            <p className="text-sm text-[#71717A]">{item.meta}</p>
            <div className="flex items-center gap-2">
              <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E11D48] px-4 py-2 text-sm text-white">
                <ExternalLink className="h-4 w-4" />
                Xem link
              </button>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-[#18181B]">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Metric({
  title,
  value,
  caption,
  icon,
  tone,
}: {
  title: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
  tone: "rose" | "emerald" | "amber" | "slate";
}) {
  return (
    <div className={`rounded-[1.75rem] border p-5 ${toneBadge(tone)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-current/70">
            {title}
          </p>
          <div className="mt-3 text-3xl font-semibold tracking-tight">
            {value}
          </div>
          <p className="mt-2 text-sm leading-6 text-current/75">{caption}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 text-current">{icon}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[#18181B]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-[#71717A]">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function DashboardHomePage() {
  return (
    <PageFrame
      eyebrow="Tổng quan hệ thống"
      title="NEU Debate Club Dashboard"
      description="Trang tổng quan theo vai trò, ưu tiên task, thông báo và các module quản trị nội bộ theo đúng mock spec."
      action={
        <ActionButton icon={<ArrowRight className="h-4 w-4" />}>
          Đi tới Todo-list
        </ActionButton>
      }
      aside={
        <StatGrid
          items={[
            {
              label: "Task đang mở",
              value: "24",
              note: "+4 so với hôm qua",
              tone: "rose",
            },
            {
              label: "Thông báo chưa đọc",
              value: "8",
              note: "2 thông báo quan trọng",
              tone: "amber",
            },
            {
              label: "Ấn phẩm tháng này",
              value: "13",
              note: "5 link mới được duyệt",
              tone: "emerald",
            },
            {
              label: "Sức khỏe tổ chức",
              value: "92",
              note: "Ổn định, đang theo dõi realtime",
              tone: "slate",
            },
          ]}
        />
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Section
          title="Lối vào nhanh theo vai trò"
          subtitle="Thành viên, Trưởng ban và BCN được gom thành các cụm hành động riêng."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href={ROUTES.todoList}
              className="rounded-[1.5rem] border border-slate-200/60 bg-[#FAFAFA] p-5 transition hover:border-rose-200 hover:bg-rose-50"
            >
              <div className="flex items-center justify-between">
                <SquareCheckBig className="h-5 w-5 text-[#E11D48]" />
                <ChevronRight className="h-4 w-4 text-[#71717A]" />
              </div>
              <h3 className="mt-4 font-semibold text-[#18181B]">Thành viên</h3>
              <p className="mt-2 text-sm leading-6 text-[#71717A]">
                Todo-list, cập nhật task, đọc thông báo, thư viện.
              </p>
            </Link>
            <Link
              href={ROUTES.assignTask}
              className="rounded-[1.5rem] border border-slate-200/60 bg-[#FAFAFA] p-5 transition hover:border-rose-200 hover:bg-rose-50"
            >
              <div className="flex items-center justify-between">
                <Workflow className="h-5 w-5 text-[#E11D48]" />
                <ChevronRight className="h-4 w-4 text-[#71717A]" />
              </div>
              <h3 className="mt-4 font-semibold text-[#18181B]">Trưởng ban</h3>
              <p className="mt-2 text-sm leading-6 text-[#71717A]">
                Giao task, tạo thông báo, biểu đồ, link ấn phẩm.
              </p>
            </Link>
            <Link
              href={ROUTES.members}
              className="rounded-[1.5rem] border border-slate-200/60 bg-[#FAFAFA] p-5 transition hover:border-rose-200 hover:bg-rose-50"
            >
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-[#E11D48]" />
                <ChevronRight className="h-4 w-4 text-[#71717A]" />
              </div>
              <h3 className="mt-4 font-semibold text-[#18181B]">BCN</h3>
              <p className="mt-2 text-sm leading-6 text-[#71717A]">
                Quản lý thành viên, phân quyền, tài chính, CMS, health
                dashboard.
              </p>
            </Link>
            <Link
              href={ROUTES.healthDashboard}
              className="rounded-[1.5rem] border border-slate-200/60 bg-[#FAFAFA] p-5 transition hover:border-rose-200 hover:bg-rose-50"
            >
              <div className="flex items-center justify-between">
                <HeartPulse className="h-5 w-5 text-[#E11D48]" />
                <ChevronRight className="h-4 w-4 text-[#71717A]" />
              </div>
              <h3 className="mt-4 font-semibold text-[#18181B]">
                Điểm sức khỏe
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#71717A]">
                Theo dõi hoạt động, cảnh báo và dòng dữ liệu tổ chức.
              </p>
            </Link>
          </div>
        </Section>

        <Section
          title="Hoạt động gần đây"
          subtitle="Dòng trạng thái được rút từ mock spec và ưu tiên các điểm chạm chính."
        >
          <DetailList
            items={[
              {
                title: "Task poster sự kiện đã được chuyển sang Đang làm",
                meta: "2 giờ trước",
                detail:
                  "Ban Truyền thông đã cập nhật tiến độ và đính kèm phiên bản mới.",
                tone: "rose",
              },
              {
                title: "Thông báo khẩn được ghim cho toàn ban",
                meta: "Hôm qua",
                detail: "Thông báo có gắn cờ ưu tiên và link task liên quan.",
                tone: "amber",
              },
              {
                title: "CMS vừa publish 2 template mới",
                meta: "Hôm qua",
                detail:
                  "Mục CMS và media library đang đồng bộ với ấn phẩm gần nhất.",
                tone: "emerald",
              },
            ]}
          />
        </Section>
      </div>
    </PageFrame>
  );
}

export function TasksHubPage() {
  return (
    <PageFrame
      eyebrow="Quản lý công việc"
      title="Trung tâm task"
      description="Điểm vào nhanh cho các luồng tác vụ, trạng thái và phân phối nhiệm vụ."
      action={
        <ActionButton icon={<Plus className="h-4 w-4" />}>
          Tạo task
        </ActionButton>
      }
    >
      <StatGrid
        items={[
          {
            label: "Todo",
            value: "12",
            note: "Các task đang chờ xử lý",
            tone: "slate",
          },
          {
            label: "In progress",
            value: "9",
            note: "Đang được theo dõi",
            tone: "amber",
          },
          {
            label: "Done",
            value: "18",
            note: "Hoàn tất đúng hạn",
            tone: "emerald",
          },
          {
            label: "Overdue",
            value: "3",
            note: "Cần ưu tiên xử lý",
            tone: "rose",
          },
        ]}
      />

      <Section
        title="Điểm vào các flow task"
        subtitle="Ba đường dẫn trong dashboard được đặt cạnh nhau để truy cập nhanh."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href={ROUTES.todoList}
            className="rounded-[1.5rem] border border-slate-200/60 bg-white p-5 hover:border-rose-200 hover:bg-rose-50"
          >
            <ClipboardList className="h-5 w-5 text-[#E11D48]" />
            <h3 className="mt-4 font-semibold text-[#18181B]">Todo-list</h3>
            <p className="mt-2 text-sm leading-6 text-[#71717A]">
              Kanban-lite chia theo trạng thái.
            </p>
          </Link>
          <Link
            href={ROUTES.updateTask}
            className="rounded-[1.5rem] border border-slate-200/60 bg-white p-5 hover:border-rose-200 hover:bg-rose-50"
          >
            <PenLine className="h-5 w-5 text-[#E11D48]" />
            <h3 className="mt-4 font-semibold text-[#18181B]">Cập nhật task</h3>
            <p className="mt-2 text-sm leading-6 text-[#71717A]">
              Form cập nhật tiến độ và file đính kèm.
            </p>
          </Link>
          <Link
            href={ROUTES.assignTask}
            className="rounded-[1.5rem] border border-slate-200/60 bg-white p-5 hover:border-rose-200 hover:bg-rose-50"
          >
            <Workflow className="h-5 w-5 text-[#E11D48]" />
            <h3 className="mt-4 font-semibold text-[#18181B]">Giao task</h3>
            <p className="mt-2 text-sm leading-6 text-[#71717A]">
              Split view với preview nhóm nhận task.
            </p>
          </Link>
        </div>
      </Section>
    </PageFrame>
  );
}

export function TodoListPage() {
  const tasks: TaskCardData[] = [
    {
      title: "Chốt nội dung bài đăng tuyển thành viên",
      department: "Truyền thông",
      deadline: "28/06",
      priority: "Thấp",
      assignee: "An",
      overdue: false,
    },
    {
      title: "Hoàn thiện timeline sự kiện debate night",
      department: "Sự kiện",
      deadline: "Hôm nay",
      priority: "Cao",
      assignee: "Hà",
      overdue: true,
    },
    {
      title: "Tổng hợp feedback workshop tuần trước",
      department: "Nội dung",
      deadline: "29/06",
      priority: "Trung bình",
      assignee: "Minh",
      overdue: false,
    },
    {
      title: "Gửi lại bản đồ tài liệu onboarding",
      department: "Hành chính",
      deadline: "30/06",
      priority: "Done",
      assignee: "Vy",
      overdue: false,
    },
    {
      title: "Thiết kế cover cho ấn phẩm tháng",
      department: "Truyền thông",
      deadline: "01/07",
      priority: "Khẩn cấp",
      assignee: "Khoa",
      overdue: false,
    },
  ];

  return (
    <PageFrame
      eyebrow="Thành viên"
      title="Công việc của tôi"
      description="Kanban-lite theo spec: bộ lọc, sắp xếp, checkbox tròn, deadline, priority và trạng thái."
      action={
        <ActionButton icon={<Plus className="h-4 w-4" />}>
          Thêm task
        </ActionButton>
      }
    >
      <Section
        title="Bộ lọc và trạng thái"
        action={
          <ActionButton variant="outline" icon={<Filter className="h-4 w-4" />}>
            Deadline
          </ActionButton>
        }
      >
        <ChipRow
          chips={[
            { label: "Tất cả", active: true },
            { label: "Hôm nay" },
            { label: "Tuần này" },
            { label: "Quá hạn", count: 3 },
          ]}
        />
      </Section>
      <TaskBoard tasks={tasks} />
    </PageFrame>
  );
}

export function UpdateTaskPage() {
  return (
    <PageFrame
      eyebrow="Thành viên"
      title="Cập nhật task"
      description="Form một cột với progress, trạng thái, note và timeline cập nhật trước đó."
      action={
        <ActionButton icon={<CheckCircle2 className="h-4 w-4" />}>
          Lưu cập nhật
        </ActionButton>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_0.55fr]">
        <Section title="Biểu mẫu cập nhật">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              {["Cần làm", "Đang làm", "Hoàn thành"].map((item, index) => (
                <button
                  key={item}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                    index === 1
                      ? "border-rose-200 bg-rose-50 text-[#E11D48]"
                      : "border-slate-200 bg-white text-[#18181B]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-[#71717A]">
                <span>Tiến độ</span>
                <span className="font-medium text-[#18181B]">60%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[60%] rounded-full bg-[#E11D48]" />
              </div>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#18181B]">
                Ghi chú cập nhật
              </span>
              <textarea
                className="min-h-36 w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm text-[#18181B] outline-none focus:border-[#E11D48]"
                placeholder="Bạn đã làm gì? Gặp khó khăn gì?"
              />
            </label>
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-[#E11D48]" />
              <p className="mt-3 text-sm font-medium text-[#18181B]">
                Kéo thả file hoặc chọn file
              </p>
              <p className="mt-1 text-sm text-[#71717A]">
                PDF, ảnh, docx được chấp nhận.
              </p>
            </div>
          </div>
        </Section>
        <Section
          title="Timeline cập nhật"
          subtitle="Các mốc tiến độ gần nhất hiển thị theo chiều dọc."
        >
          <Timeline
            items={[
              {
                title: "Đã cập nhật tiến độ 20%",
                meta: "09:10",
                detail: "Hoàn thành phần nghiên cứu và tạo bản nháp đầu.",
                tone: "emerald",
              },
              {
                title: "Đang làm lại nội dung",
                meta: "11:45",
                detail: "Điều chỉnh câu chữ và bố cục theo phản hồi.",
                tone: "amber",
              },
              {
                title: "Đính kèm file mới",
                meta: "Hôm nay",
                detail: "Upload file final để gửi duyệt.",
                tone: "rose",
              },
            ]}
          />
        </Section>
      </div>
    </PageFrame>
  );
}

export function ReadNotificationPage() {
  return (
    <PageFrame
      eyebrow="Thành viên"
      title="Đọc thông báo"
      description="Bố cục 2 panel: list trái và detail phải, trạng thái unread được nhấn rõ."
      action={
        <ActionButton icon={<Bell className="h-4 w-4" />}>
          Đánh dấu tất cả đã đọc
        </ActionButton>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Section
          title="Danh sách thông báo"
          subtitle="Tìm kiếm, tab và dot unread."
        >
          <InputToolbar />
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-rose-50 px-3 py-1.5 text-sm text-[#E11D48]">
              Tất cả
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-[#71717A]">
              Chưa đọc 5
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-[#71717A]">
              Đã ghim
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-[#71717A]">
              Quan trọng
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {[
              {
                title: "Lịch sinh hoạt tuần này",
                meta: "2 giờ trước",
                detail: "Có thay đổi nhỏ ở phòng họp và giờ check-in.",
                tone: "rose" as const,
              },
              {
                title: "Task poster đã liên kết",
                meta: "Hôm qua",
                detail: "Mở task liên quan và kiểm tra file đính kèm.",
                tone: "emerald" as const,
              },
              {
                title: "Nghiệp vụ ban cập nhật",
                meta: "Hôm qua",
                detail: "Dashboard nội bộ có thêm thống kê mới.",
                tone: "amber" as const,
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200/60 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone === "rose" ? "bg-rose-500" : item.tone === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium text-[#18181B]">
                        {item.title}
                      </h3>
                      <span className="text-xs text-[#71717A]">
                        {item.meta}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#71717A]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>
        <Section
          title="Chi tiết thông báo"
          subtitle="Markdown, metadata, file đính kèm và liên kết liên quan."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold tracking-tight text-[#18181B]">
                Lịch họp BCN tuần này
              </h3>
              <span className="rounded-full bg-rose-50 px-3 py-1.5 text-sm text-[#E11D48]">
                Khẩn cấp
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#71717A]">
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                Người gửi: Ban Điều phối
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                24/06/2026
              </span>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200/60 bg-slate-50 p-5 text-sm leading-7 text-[#18181B]">
              Nội dung thông báo được render như markdown, hỗ trợ tiêu đề, danh
              sách và liên kết liên quan đến task hoặc ấn phẩm.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {["Tệp chương trình.pdf", "Ảnh minh họa.png"].map((file) => (
                <div
                  key={file}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-[#E11D48]" />
                    <span className="text-sm text-[#18181B]">{file}</span>
                  </div>
                  <Download className="h-4 w-4 text-[#71717A]" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton
                variant="outline"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Xem task liên quan
              </ActionButton>
              <ActionButton
                variant="outline"
                icon={<ExternalLink className="h-4 w-4" />}
              >
                Xem ấn phẩm
              </ActionButton>
            </div>
          </div>
        </Section>
      </div>
    </PageFrame>
  );
}

export function LibraryPage() {
  return (
    <PageFrame
      eyebrow="Thành viên"
      title="Thư viện"
      description="Filter sidebar + grid/list view cho tài liệu, ấn phẩm, template và file được chia sẻ."
      action={
        <ActionButton icon={<BookOpen className="h-4 w-4" />}>
          Grid view
        </ActionButton>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Section
          title="Bộ lọc"
          subtitle="Tìm kiếm, danh mục, ban và thời gian."
        >
          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-[#71717A]">
              <Search className="h-4 w-4" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Tìm file..."
              />
            </label>
            <div className="space-y-2 text-sm text-[#71717A]">
              <p className="font-medium text-[#18181B]">Danh mục</p>
              {["Tất cả", "Tài liệu", "Ấn phẩm", "Template", "Khác"].map(
                (item, index) => (
                  <div
                    key={item}
                    className={`rounded-xl px-3 py-2 ${index === 0 ? "bg-rose-50 text-[#E11D48]" : "bg-white text-[#71717A]"}`}
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
            <div className="space-y-2 text-sm text-[#71717A]">
              <p className="font-medium text-[#18181B]">Lọc theo ban</p>
              {["Truyền thông", "Nội dung", "Sự kiện"].map((item) => (
                <div key={item} className="rounded-xl bg-white px-3 py-2">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Section
          title="Thư viện file"
          subtitle="Grid card nhẹ, có hover action xem và tải xuống."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-rose-50 px-3 py-1.5 text-sm text-[#E11D48]">
              Grid
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-[#71717A]">
              List
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-[#71717A]">
              Mới nhất
            </span>
          </div>
          <Gallery
            items={[
              {
                title: "Template bài đăng tuyển thành viên Q3",
                type: "Tài liệu",
                meta: "2.4 MB · Hôm nay",
                status: "Published",
              },
              {
                title: "Poster workshop debate night",
                type: "Ảnh",
                meta: "5.1 MB · Hôm qua",
                status: "Draft",
              },
              {
                title: "Video recap tuyển thành viên",
                type: "Video",
                meta: "48 MB · 2 ngày trước",
                status: "Published",
              },
            ]}
          />
        </Section>
      </div>
    </PageFrame>
  );
}

export function AssignTaskPage() {
  return (
    <PageFrame
      eyebrow="Trưởng ban"
      title="Giao task"
      description="Split view: form bên trái, preview board bên phải cho phân phối và theo dõi task của ban."
      action={
        <ActionButton icon={<Plus className="h-4 w-4" />}>
          Giao task
        </ActionButton>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Section
          title="Form giao task"
          subtitle="Task title, mô tả, người nhận, deadline, ưu tiên và file đính kèm."
        >
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]"
                placeholder="Tiêu đề task"
              />
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]"
                placeholder="Deadline"
              />
            </div>
            <textarea
              className="min-h-36 rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm outline-none focus:border-[#E11D48]"
              placeholder="Mô tả task..."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {["Thấp", "Trung bình", "Cao"].map((item, index) => (
                <button
                  key={item}
                  className={`rounded-2xl border px-4 py-3 text-sm ${index === 2 ? "border-rose-200 bg-rose-50 text-[#E11D48]" : "border-slate-200 bg-white text-[#18181B]"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <Upload className="mx-auto h-6 w-6 text-[#E11D48]" />
              <p className="mt-3 text-sm font-medium text-[#18181B]">
                Thả file đính kèm ở đây
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton icon={<CheckCircle2 className="h-4 w-4" />}>
                Giao task
              </ActionButton>
              <ActionButton variant="outline">Lưu nháp</ActionButton>
              <ActionButton variant="ghost">Hủy</ActionButton>
            </div>
          </div>
        </Section>
        <Section
          title="Preview board"
          subtitle="Mini Kanban theo người được giao."
        >
          <TaskBoard
            tasks={[
              {
                title: "Lập kế hoạch truyền thông sự kiện",
                department: "Truyền thông",
                deadline: "Hôm nay",
                priority: "Cao",
                assignee: "An",
              },
              {
                title: "Chốt timeline vận hành ban",
                department: "Hành chính",
                deadline: "28/06",
                priority: "Thấp",
                assignee: "Linh",
              },
              {
                title: "Kiểm tra file ấn phẩm",
                department: "Nội dung",
                deadline: "29/06",
                priority: "Khẩn cấp",
                assignee: "Vy",
              },
            ]}
          />
        </Section>
      </div>
    </PageFrame>
  );
}

export function CreateNotificationPage() {
  return (
    <PageFrame
      eyebrow="Trưởng ban"
      title="Tạo thông báo"
      description="Editor page full-width, có preview và draft autosave style."
      action={
        <ActionButton icon={<Mail className="h-4 w-4" />}>
          Gửi ngay
        </ActionButton>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Section
          title="Biên soạn"
          subtitle="Tiêu đề, loại, người nhận và nội dung."
        >
          <div className="space-y-4">
            <input
              className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]"
              placeholder="Tiêu đề thông báo..."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]">
                <option>Thông báo chung</option>
                <option>Cập nhật task</option>
                <option>Khen thưởng</option>
                <option>Khẩn cấp</option>
              </select>
              <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]">
                <option>Toàn ban</option>
                <option>Chọn thành viên cụ thể</option>
              </select>
            </div>
            <textarea
              className="min-h-64 w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm outline-none focus:border-[#E11D48]"
              placeholder="Nội dung thông báo..."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <Upload className="mx-auto h-6 w-6 text-[#E11D48]" />
                <p className="mt-3 text-sm text-[#18181B]">
                  Upload file đính kèm
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-[#18181B]">
                  Lên lịch gửi
                </p>
                <p className="mt-2 text-sm text-[#71717A]">
                  Toggle + date/time picker theo spec.
                </p>
              </div>
            </div>
          </div>
        </Section>
        <Section
          title="Preview panel"
          subtitle="Xem trước thông báo như người nhận."
        >
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-200/60 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717A]">
                Thông báo khẩn
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#18181B]">
                Lịch họp bổ sung chiều nay
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#71717A]">
                Thông báo preview thể hiện giống giao diện người nhận, gồm
                metadata, file đính kèm và action nhanh.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton variant="outline">Xem trước</ActionButton>
              <ActionButton variant="outline">Lưu nháp</ActionButton>
            </div>
          </div>
        </Section>
      </div>
    </PageFrame>
  );
}

export function DepartmentOperationsPage() {
  return (
    <PageFrame
      eyebrow="Trưởng ban"
      title="Nghiệp vụ ban"
      description="Dashboard nội bộ cho tổng quan thành viên, task tuần và các nghiệp vụ nổi bật."
    >
      <StatGrid
        items={[
          {
            label: "Tổng thành viên",
            value: "18",
            note: "15 hoạt động, 3 tạm nghỉ",
            tone: "slate",
          },
          {
            label: "Task tuần này",
            value: "11",
            note: "7 hoàn thành, 2 đang làm",
            tone: "rose",
          },
          {
            label: "Tỷ lệ đúng hạn",
            value: "84%",
            note: "Tăng 6% so với tuần trước",
            tone: "emerald",
          },
          {
            label: "Điểm đóng góp",
            value: "92",
            note: "Theo dõi đóng góp tổng",
            tone: "amber",
          },
        ]}
      />
      <TableCard
        title="Bảng theo dõi thành viên"
        columns={[
          { label: "Tên" },
          { label: "Chức vụ" },
          { label: "Task đang có", align: "center" },
          { label: "Tỷ lệ đúng hạn", align: "right" },
          { label: "Trạng thái", align: "right" },
        ]}
        rows={[
          [
            "An",
            "Trưởng ban",
            "4",
            "91%",
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              Hoạt động
            </span>,
          ],
          [
            "Vy",
            "Thành viên",
            "2",
            "78%",
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              Bình thường
            </span>,
          ],
          [
            "Minh",
            "Thành viên",
            "1",
            "46%",
            <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">
              Cần chú ý
            </span>,
          ],
        ]}
      />
    </PageFrame>
  );
}

export function ChartsPage() {
  return (
    <PageFrame
      eyebrow="Trưởng ban"
      title="Biểu đồ"
      description="Analytics page với line, donut, bar và stacked bar theo mock spec."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Hoàn thành task theo tuần">
          <div className="flex h-64 items-end gap-3 rounded-[1.5rem] border border-slate-200/60 bg-slate-50 p-5">
            {[38, 52, 48, 64, 55, 72, 80, 68].map((height, index) => (
              <div key={index} className="flex-1">
                <div
                  className="rounded-t-2xl bg-[#E11D48]"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
        </Section>
        <Section title="Phân bổ task theo trạng thái">
          <div className="grid place-items-center rounded-[1.5rem] border border-slate-200/60 bg-slate-50 p-8">
            <div className="grid h-52 w-52 place-items-center rounded-full border-12 border-rose-200 border-t-[#E11D48] border-r-[#F59E0B] border-b-emerald-200 border-l-slate-200 bg-white">
              <div className="text-center">
                <div className="text-4xl font-semibold tracking-tight text-[#18181B]">
                  48
                </div>
                <p className="mt-1 text-sm text-[#71717A]">Tổng task</p>
              </div>
            </div>
          </div>
        </Section>
      </div>
      <Section
        title="Task theo danh mục"
        subtitle="Stacked bar mô phỏng bằng các dải màu."
      >
        <div className="space-y-3">
          {[1, 2, 3, 4].map((week) => (
            <div key={week} className="flex items-center gap-4">
              <span className="w-20 shrink-0 text-sm text-[#71717A]">
                Tuần {week}
              </span>
              <div className="flex h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span className="w-[30%] bg-[#E11D48]" />
                <span className="w-[25%] bg-[#F59E0B]" />
                <span className="w-[20%] bg-[#10B981]" />
                <span className="w-[25%] bg-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </PageFrame>
  );
}

export function PublicationsPage() {
  return (
    <PageFrame
      eyebrow="Trưởng ban"
      title="Link ấn phẩm"
      description="Gallery 3 cột với thumbnail, nền trắng, status badge và action xem link."
      action={
        <ActionButton icon={<Plus className="h-4 w-4" />}>
          Đăng ấn phẩm mới
        </ActionButton>
      }
    >
      <Gallery
        items={[
          {
            title: "Poster tuyển thành viên",
            type: "Ảnh",
            meta: "Facebook · Hôm nay",
            status: "Đã duyệt",
          },
          {
            title: "Clip recap workshop",
            type: "Video",
            meta: "Instagram · Hôm qua",
            status: "Chờ duyệt",
          },
          {
            title: "Bài đăng thông báo lịch họp",
            type: "Bài viết",
            meta: "Website · 2 ngày trước",
            status: "Đã duyệt",
          },
        ]}
      />
    </PageFrame>
  );
}

export function MembersPage() {
  return (
    <PageFrame
      eyebrow="BCN"
      title="Quản lý thành viên"
      description="Data table full-width, search, filter, bulk actions và drawer detail."
      action={
        <ActionButton icon={<Plus className="h-4 w-4" />}>
          Thêm thành viên
        </ActionButton>
      }
    >
      <Section title="Toolbar" subtitle="Tìm kiếm, lọc, import/export.">
        <InputToolbar />
      </Section>
      <TableCard
        title="Danh sách thành viên"
        columns={[
          { label: "Tên" },
          { label: "Mã" },
          { label: "Ban" },
          { label: "Chức vụ" },
          { label: "Trạng thái", align: "right" },
        ]}
        rows={[
          [
            "An",
            <span className="font-mono text-[#71717A]">NDC-001</span>,
            "Truyền thông",
            "BCN",
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              Hoạt động
            </span>,
          ],
          [
            "Vy",
            <span className="font-mono text-[#71717A]">NDC-024</span>,
            "Nội dung",
            "Thành viên",
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              Tạm nghỉ
            </span>,
          ],
          [
            "Minh",
            <span className="font-mono text-[#71717A]">NDC-031</span>,
            "Sự kiện",
            "Trưởng ban",
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Đã nghỉ
            </span>,
          ],
        ]}
      />
    </PageFrame>
  );
}

export function RolesPage() {
  return (
    <PageFrame
      eyebrow="BCN"
      title="Phân quyền"
      description="Role list trái + permission matrix phải, toggle quyền ngay lập tức."
    >
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Section
          title="Role list"
          subtitle="BCN, Trưởng ban, Phó ban, Thành viên."
        >
          <div className="space-y-3">
            {["BCN", "Trưởng ban", "Phó ban", "Thành viên"].map(
              (role, index) => (
                <div
                  key={role}
                  className={`rounded-2xl border px-4 py-3 ${index === 0 ? "border-rose-200 bg-rose-50 text-[#E11D48]" : "border-slate-200 bg-white text-[#18181B]"}`}
                >
                  {role}
                </div>
              ),
            )}
          </div>
        </Section>
        <Section title="Permission matrix" subtitle="Module x action.">
          <div className="space-y-3">
            {["Task", "Thông báo", "Thư viện", "Tài chính", "CMS"].map(
              (module) => (
                <div
                  key={module}
                  className="grid grid-cols-[1fr_repeat(5,minmax(0,90px))] gap-3 rounded-2xl border border-slate-200/60 bg-white p-4"
                >
                  <div className="font-medium text-[#18181B]">{module}</div>
                  {["Xem", "Tạo", "Sửa", "Xóa", "Duyệt"].map(
                    (action, index) => (
                      <button
                        key={action}
                        className={`rounded-full px-3 py-2 text-xs font-medium ${index < 2 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {action}
                      </button>
                    ),
                  )}
                </div>
              ),
            )}
          </div>
        </Section>
      </div>
    </PageFrame>
  );
}

export function FinancePage() {
  return (
    <PageFrame
      eyebrow="BCN"
      title="Tài chính"
      description="Finance dashboard với summary cards, tab logic và progress ngân sách."
    >
      <StatGrid
        items={[
          {
            label: "Tổng quỹ",
            value: "128.5M",
            note: "Số dư hiện tại",
            tone: "emerald",
          },
          {
            label: "Thu tháng này",
            value: "18.2M",
            note: "+12% so với tháng trước",
            tone: "slate",
          },
          {
            label: "Chi tháng này",
            value: "9.4M",
            note: "-6% so với tháng trước",
            tone: "rose",
          },
          {
            label: "Chờ duyệt",
            value: "4",
            note: "Giao dịch chưa xét duyệt",
            tone: "amber",
          },
        ]}
      />
      <Section
        title="Ngân sách theo danh mục"
        subtitle="Progress bar cảnh báo khi vượt 90%."
      >
        <div className="space-y-4">
          {[
            { name: "Sự kiện", used: 82 },
            { name: "Văn phòng phẩm", used: 54 },
            { name: "Khác", used: 91 },
          ].map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#18181B]">{item.name}</span>
                <span className="text-[#71717A]">{item.used}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${item.used > 90 ? "bg-[#E11D48]" : "bg-[#10B981]"}`}
                  style={{ width: `${item.used}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </PageFrame>
  );
}

export function CmsPage() {
  return (
    <PageFrame
      eyebrow="BCN"
      title="CMS"
      description="Tree content bên trái, editor bên phải, version history và publish controls."
    >
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Section title="Cây nội dung" subtitle="Draft / Published / Archived.">
          <div className="space-y-3">
            {["Tài liệu", "Thông báo", "Template", "Biểu mẫu"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`rounded-2xl border px-4 py-3 ${index === 0 ? "border-rose-200 bg-rose-50 text-[#E11D48]" : "border-slate-200 bg-white text-[#18181B]"}`}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </Section>
        <Section
          title="Editor"
          subtitle="WYSIWYG mock với metadata và publish controls."
        >
          <div className="space-y-4">
            <input
              className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]"
              placeholder="Tiêu đề SEO"
            />
            <div className="rounded-[1.5rem] border border-slate-200/60 bg-slate-50 p-5 text-sm leading-7 text-[#18181B]">
              Nội dung editor mô phỏng Notion-style WYSIWYG, hỗ trợ heading,
              link, image, table và divider.
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton variant="outline">Lưu nháp</ActionButton>
              <ActionButton variant="outline">Xuất bản</ActionButton>
              <ActionButton icon={<Sparkles className="h-4 w-4" />}>
                Lên lịch
              </ActionButton>
            </div>
          </div>
        </Section>
      </div>
    </PageFrame>
  );
}

export function HealthDashboardPage() {
  return (
    <PageFrame
      eyebrow="BCN"
      title="Health Dashboard"
      description="Executive dashboard data-dense cho nhìn nhanh toàn tổ chức."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Metric
          title="Thành viên hoạt động"
          value="126"
          caption="Còn đang phản hồi tốt"
          icon={<Users className="h-5 w-5" />}
          tone="slate"
        />
        <Metric
          title="Task đúng hạn"
          value="92%"
          caption="Tỷ lệ hoàn thành đúng hạn"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />
        <Metric
          title="Task quá hạn"
          value="3"
          caption="Cần ưu tiên xử lý"
          icon={<CircleAlert className="h-5 w-5" />}
          tone="rose"
        />
        <Metric
          title="Ấn phẩm tháng này"
          value="13"
          caption="Đã đăng trong tháng"
          icon={<FileBadge2 className="h-5 w-5" />}
          tone="amber"
        />
        <Metric
          title="Điểm sức khỏe"
          value="92"
          caption="Tổng hợp từ hoạt động, task, ấn phẩm"
          icon={<HeartPulse className="h-5 w-5" />}
          tone="slate"
        />
        <Metric
          title="Tạm nghỉ"
          value="4"
          caption="Đang cần follow-up"
          icon={<Clock3 className="h-5 w-5" />}
          tone="amber"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Xếp hạng ban" subtitle="Heatmap theo hiệu suất.">
          <TableCard
            title="Top ban theo hoạt động"
            columns={[
              { label: "Ban" },
              { label: "Task" },
              { label: "Đúng hạn", align: "right" },
              { label: "Ấn phẩm", align: "right" },
            ]}
            rows={[
              ["Truyền thông", "18", "96%", "6"],
              ["Nội dung", "15", "90%", "4"],
              ["Sự kiện", "12", "84%", "3"],
            ]}
          />
        </Section>
        <Section title="Alerts" subtitle="Cảnh báo theo thời gian thực.">
          <DetailList
            items={[
              {
                title: "Ban Sự kiện có 5 task quá hạn",
                meta: "Cao",
                detail: "Theo dõi và nhắc nhở ngay.",
                tone: "rose",
              },
              {
                title: "Thành viên Minh chưa hoạt động 2 tuần",
                meta: "Trung bình",
                detail: "Cần kiểm tra tình trạng tham gia.",
                tone: "amber",
              },
              {
                title: "Ngân sách danh mục Khác sắp chạm ngưỡng",
                meta: "Thông tin",
                detail: "Xem lại phân bổ chi tiêu.",
                tone: "emerald",
              },
            ]}
          />
        </Section>
      </div>
    </PageFrame>
  );
}

export function AssignAllTasksPage() {
  return (
    <PageFrame
      eyebrow="BCN"
      title="Giao task mọi ban"
      description="Mở rộng phạm vi phân phối task liên ban, chọn ban trước rồi thành viên sau."
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Section
          title="Form liên ban"
          subtitle="Assign nhiều ban, clone task hoặc task nhóm."
        >
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]">
                <option>Chọn ban</option>
                <option>Truyền thông</option>
                <option>Nội dung</option>
                <option>Sự kiện</option>
              </select>
              <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]">
                <option>Chọn trưởng ban phụ trách</option>
                <option>An</option>
                <option>Vy</option>
              </select>
            </div>
            <textarea
              className="min-h-40 rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm outline-none focus:border-[#E11D48]"
              placeholder="Mô tả task..."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-[#18181B]">
                  Nhân bản task cho từng người
                </p>
                <p className="mt-2 text-sm text-[#71717A]">
                  Mỗi người nhận một bản task riêng.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-[#E11D48]">
                <p className="text-sm font-medium">Task chung cho nhóm</p>
                <p className="mt-2 text-sm">
                  Chỉ 1 task, nhiều người theo dõi.
                </p>
              </div>
            </div>
          </div>
        </Section>
        <Section
          title="Tổng hợp toàn tổ chức"
          subtitle="Preview board cho tất cả các ban."
        >
          <DetailList
            items={[
              {
                title: "Truyền thông: 4 task",
                meta: "Hôm nay",
                detail: "Đang chờ phân công thêm.",
                tone: "rose",
              },
              {
                title: "Sự kiện: 2 task",
                meta: "Hôm nay",
                detail: "Đang cần người phụ trách.",
                tone: "amber",
              },
              {
                title: "Nội dung: 3 task",
                meta: "Hôm nay",
                detail: "Đã có deadline và file đính kèm.",
                tone: "emerald",
              },
            ]}
          />
        </Section>
      </div>
    </PageFrame>
  );
}

export function ActivityLogPage() {
  return (
    <PageFrame
      eyebrow="BCN"
      title="Activity Log"
      description="Audit log viewer với timestamp, module, diff payload và export filter."
      action={
        <ActionButton variant="outline" icon={<Download className="h-4 w-4" />}>
          Export CSV
        </ActionButton>
      }
    >
      <Section
        title="Bộ lọc log"
        subtitle="Search, module, loại hành động, khoảng thời gian."
      >
        <InputToolbar />
      </Section>
      <TableCard
        title="Danh sách log"
        columns={[
          { label: "Thời gian" },
          { label: "Người thực hiện" },
          { label: "Hành động" },
          { label: "Module" },
          { label: "Chi tiết" },
        ]}
        rows={[
          [
            "24/06/2026 11:20:30",
            "An",
            "Sửa",
            "Task",
            "Đổi trạng thái Đang làm → Hoàn thành",
          ],
          [
            "24/06/2026 10:14:02",
            "Vy",
            "Tạo",
            "Thông báo",
            "Tạo thông báo khẩn cho toàn ban",
          ],
          [
            "24/06/2026 09:01:12",
            "Minh",
            "Xóa",
            "Tài chính",
            "Hủy giao dịch chờ duyệt",
          ],
        ]}
      />
    </PageFrame>
  );
}

export function TenurePage() {
  return (
    <PageFrame
      eyebrow="BCN"
      title="Nhiệm kỳ"
      description="Timeline nhiệm kỳ, detail panel, chuyển giao và lưu trữ."
      action={
        <ActionButton icon={<Plus className="h-4 w-4" />}>
          Tạo nhiệm kỳ mới
        </ActionButton>
      }
    >
      <Section
        title="Timeline nhiệm kỳ"
        subtitle="Block hiện tại được highlight accent."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {[
            "Nhiệm kỳ 2024-2025",
            "Nhiệm kỳ 2025-2026",
            "Nhiệm kỳ hiện tại",
          ].map((item, index) => (
            <div
              key={item}
              className={`rounded-[1.75rem] border p-5 ${index === 2 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}
            >
              <p className="text-sm font-semibold text-[#18181B]">{item}</p>
              <p className="mt-2 text-sm text-[#71717A]">
                Bao gồm BCN, mục tiêu và timeline chuyển giao.
              </p>
            </div>
          ))}
        </div>
      </Section>
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Thông tin nhiệm kỳ">
          <DetailList
            items={[
              {
                title: "Mục tiêu",
                meta: "Editable",
                detail: "Tăng chất lượng task, chuẩn hóa nội dung và lưu trữ.",
                tone: "rose",
              },
              {
                title: "BCN chủ chốt",
                meta: "Avatar grid",
                detail: "Danh sách thành viên nhiệm kỳ đó.",
                tone: "emerald",
              },
            ]}
          />
        </Section>
        <Section
          title="Chuyển giao"
          subtitle="Checklist tiến độ và file đính kèm."
        >
          <div className="space-y-3">
            {["Tài liệu", "Tài chính", "Tài sản", "Nhân sự"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`rounded-2xl border px-4 py-3 ${index === 0 ? "border-rose-200 bg-rose-50 text-[#E11D48]" : "border-slate-200 bg-white text-[#18181B]"}`}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </Section>
      </div>
    </PageFrame>
  );
}
