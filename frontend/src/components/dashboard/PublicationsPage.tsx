"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Heart, Megaphone, MessageCircle, Plus, RefreshCw, Search, Share2, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { useUserContext } from "@/context/userContext";
import {
  createPublication,
  deletePublication,
  fetchEvents,
  fetchPublications,
  type ClubEvent,
  type Publication,
  type PublicationPlatform,
} from "@/lib/api";
import { DEPARTMENT_NAMES } from "@/lib/notifications";

export const PLATFORM_META: Record<PublicationPlatform, { label: string; badge: string }> = {
  FACEBOOK: { label: "Facebook", badge: "bg-blue-50 text-blue-700" },
  INSTAGRAM: { label: "Instagram", badge: "bg-pink-50 text-pink-700" },
  YOUTUBE: { label: "YouTube", badge: "bg-red-50 text-red-700" },
  TIKTOK: { label: "TikTok", badge: "bg-slate-900 text-white" },
  OTHER: { label: "Khác", badge: "bg-slate-100 text-slate-700" },
};

const PLATFORMS = Object.keys(PLATFORM_META) as PublicationPlatform[];

/** Chỉ render link http(s) — chặn javascript:/data: lọt vào href từ dữ liệu người dùng nhập. */
export function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

const dateOnly = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const compact = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

/** yyyy-MM-dd → ngày local (tránh lệch một ngày do UTC). */
export function formatIsoDate(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return y && m && d ? dateOnly.format(new Date(y, m - 1, d)) : value;
}

export function localIsoDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10";

const METRICS = [
  { key: "reach", label: "Tiếp cận", icon: Users },
  { key: "likes", label: "Lượt thích", icon: Heart },
  { key: "shares", label: "Chia sẻ", icon: Share2 },
  { key: "comments", label: "Bình luận", icon: MessageCircle },
] as const;

export function PublicationsPage() {
  const { user } = useUserContext();
  const isBcn = (user?.role ?? "").toUpperCase() === "BCN";
  const ownDepartment = (user?.department ?? "").toUpperCase();
  const canWrite = isBcn || (user?.modules ?? []).includes("PUBLICATIONS");

  const [today] = useState(() => localIsoDate(new Date()));
  const [items, setItems] = useState<Publication[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState<PublicationPlatform | "ALL">("ALL");
  const [department, setDepartment] = useState("ALL");
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  // ?new=1 (từ thao tác nhanh) mở sẵn form.
  const [open, setOpen] = useState(() => searchParams.has("new"));
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const emptyForm = {
    title: "",
    url: "",
    platform: "FACEBOOK" as PublicationPlatform,
    department: "TRUYEN_THONG", // chỉ BCN chọn; trưởng ban luôn gửi ban của mình khi lưu
    eventId: "",
    reach: "",
    likes: "",
    shares: "",
    comments: "",
    postedAt: today,
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [pubResult, eventResult] = await Promise.allSettled([fetchPublications(), fetchEvents()]);
    if (pubResult.status === "fulfilled") setItems(pubResult.value);
    else setError(pubResult.reason instanceof Error ? pubResult.reason.message : "Không thể tải ấn phẩm.");
    // Sự kiện chỉ để gắn tùy chọn khi thêm ấn phẩm; lỗi tải không chặn trang.
    if (eventResult.status === "fulfilled") setEvents(eventResult.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items
      .filter(
        (item) =>
          (platform === "ALL" || item.platform === platform) &&
          (department === "ALL" || item.department.toUpperCase() === department) &&
          (!keyword ||
            item.title.toLowerCase().includes(keyword) ||
            (item.eventTitle ?? "").toLowerCase().includes(keyword)),
      )
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  }, [items, platform, department, query]);

  function canDelete(item: Publication) {
    return isBcn || (canWrite && item.department.toUpperCase() === ownDepartment);
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function closeForm() {
    setOpen(false);
    setFormError("");
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return setFormError("Vui lòng nhập tiêu đề.");
    if (!safeHttpUrl(form.url.trim())) return setFormError("Link phải bắt đầu bằng http:// hoặc https://.");
    if (!form.postedAt) return setFormError("Vui lòng chọn ngày đăng.");
    const metric = (value: string) => Math.max(0, Math.floor(Number(value) || 0));
    setSaving(true);
    setFormError("");
    try {
      const saved = await createPublication({
        title: form.title.trim(),
        url: form.url.trim(),
        platform: form.platform,
        // Trưởng ban luôn đăng cho ban của mình; backend cũng kiểm tra lại.
        department: isBcn ? form.department : ownDepartment,
        eventId: form.eventId || null,
        reach: metric(form.reach),
        likes: metric(form.likes),
        shares: metric(form.shares),
        comments: metric(form.comments),
        postedAt: form.postedAt,
      });
      setItems((current) => [saved, ...current]);
      toast.success("Đã thêm ấn phẩm.");
      closeForm();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Không thể thêm ấn phẩm.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Publication) {
    if (!window.confirm(`Xóa ấn phẩm "${item.title}"?`)) return;
    setDeletingId(item.id);
    try {
      await deletePublication(item.id);
      setItems((current) => current.filter((pub) => pub.id !== item.id));
      toast.success("Đã xóa ấn phẩm.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Không thể xóa ấn phẩm.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageFrame
      title="Link ấn phẩm"
      description="Các bài đăng của CLB trên mạng xã hội cùng chỉ số tiếp cận và tương tác."
      action={
        canWrite ? (
          <ActionButton icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Thêm ấn phẩm
          </ActionButton>
        ) : undefined
      }
    >
      {error ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>
          <ActionButton variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
            Thử lại
          </ActionButton>
        </div>
      ) : null}

      {open && canWrite ? (
        <Section
          title="Thêm ấn phẩm"
          action={
            <button type="button" onClick={closeForm} aria-label="Đóng" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError ? (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>
                  Tiêu đề <span className="text-rose-500">*</span>
                </span>
                <input type="text" required maxLength={255} value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>
                  Link bài đăng <span className="text-rose-500">*</span>
                </span>
                <input
                  type="url"
                  required
                  maxLength={1000}
                  value={form.url}
                  onChange={(e) => update("url", e.target.value)}
                  placeholder="https://facebook.com/..."
                  className={inputClass}
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>Nền tảng</span>
                <select value={form.platform} onChange={(e) => update("platform", e.target.value as PublicationPlatform)} className={inputClass}>
                  {PLATFORMS.map((value) => (
                    <option key={value} value={value}>
                      {PLATFORM_META[value].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>Ban</span>
                {isBcn ? (
                  <select value={form.department} onChange={(e) => update("department", e.target.value)} className={inputClass}>
                    {Object.entries(DEPARTMENT_NAMES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="text" readOnly value={DEPARTMENT_NAMES[ownDepartment] ?? ownDepartment} className={`${inputClass} bg-slate-50`} />
                )}
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>Sự kiện</span>
                <select value={form.eventId} onChange={(e) => update("eventId", e.target.value)} className={inputClass}>
                  <option value="">Không gắn sự kiện</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>
                  Ngày đăng <span className="text-rose-500">*</span>
                </span>
                <input type="date" required value={form.postedAt} onChange={(e) => update("postedAt", e.target.value)} className={inputClass} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {METRICS.map((metric) => (
                <label key={metric.key} className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>{metric.label}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form[metric.key]}
                    onChange={(e) => update(metric.key, e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <ActionButton variant="outline" onClick={closeForm}>
                Hủy
              </ActionButton>
              <ActionButton type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu ấn phẩm"}
              </ActionButton>
            </div>
          </form>
        </Section>
      ) : null}

      <Section title="Ấn phẩm đã đăng" subtitle={loading ? undefined : `${filtered.length} trên tổng số ${items.length} ấn phẩm`}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, sự kiện..."
              aria-label="Tìm ấn phẩm"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select value={platform} onChange={(e) => setPlatform(e.target.value as PublicationPlatform | "ALL")} aria-label="Lọc theo nền tảng" className={`${inputClass} lg:w-48`}>
            <option value="ALL">Tất cả nền tảng</option>
            {PLATFORMS.map((value) => (
              <option key={value} value={value}>
                {PLATFORM_META[value].label}
              </option>
            ))}
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Lọc theo ban" className={`${inputClass} lg:w-52`}>
            <option value="ALL">Tất cả các ban</option>
            {Object.entries(DEPARTMENT_NAMES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div role="status" className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#E11D48]" />
            <p className="mt-3 text-sm text-slate-500">Đang tải ấn phẩm...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-base font-semibold text-slate-700">
              {items.length ? "Không có ấn phẩm phù hợp bộ lọc" : "Chưa có ấn phẩm nào"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const meta = PLATFORM_META[item.platform] ?? PLATFORM_META.OTHER;
              const href = safeHttpUrl(item.url);
              return (
                <article key={item.id} className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2.5 py-1 font-medium ${meta.badge}`}>{meta.label}</span>
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[#E11D48]">
                        {DEPARTMENT_NAMES[item.department.toUpperCase()] ?? item.department}
                      </span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-semibold text-slate-900">{item.title}</h3>
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatIsoDate(item.postedAt)}
                        {item.createdByName ? ` · ${item.createdByName}` : ""}
                      </p>
                      {item.eventTitle ? <p className="truncate">Sự kiện: {item.eventTitle}</p> : null}
                    </div>
                    <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center">
                      {METRICS.map((metric) => (
                        <div key={metric.key} title={metric.label}>
                          <dt className="flex justify-center text-slate-400">
                            <metric.icon className="h-3.5 w-3.5" aria-hidden />
                            <span className="sr-only">{metric.label}</span>
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-800">{compact.format(item[metric.key] ?? 0)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E11D48] px-4 py-2 text-sm text-white hover:bg-[#be123c]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Mở link
                      </a>
                    ) : (
                      <span className="flex-1 text-center text-xs text-slate-400">Link không hợp lệ</span>
                    )}
                    {canDelete(item) ? (
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        disabled={deletingId === item.id}
                        title="Xóa ấn phẩm"
                        aria-label="Xóa ấn phẩm"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>
    </PageFrame>
  );
}
