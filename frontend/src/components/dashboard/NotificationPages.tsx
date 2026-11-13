"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, RefreshCw, Search, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { useUserContext } from "@/context/userContext";
import {
  createNotification,
  fetchMembers,
  fetchNotifications,
  type AppNotification,
  type ManualNotificationType,
  type Member,
  type NotificationAudience,
  type NotificationType,
} from "@/lib/api";
import { refreshApiCache } from "@/lib/requestCache";
import {
  DEPARTMENT_NAMES,
  MANUAL_NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_META,
  formatDateTime,
  formatRelativeTime,
  notificationHref,
} from "@/lib/notifications";

const READ_PAGE_LIMIT = 100;
const TYPE_FILTERS: (NotificationType | "ALL")[] = ["ALL", "TASK_ASSIGNED", ...MANUAL_NOTIFICATION_TYPES];

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#E11D48]";

function typeMeta(type: NotificationType) {
  return NOTIFICATION_TYPE_META[type] ?? NOTIFICATION_TYPE_META.GENERAL;
}

// ============================================================================
// ĐỌC THÔNG BÁO
// ============================================================================

export function ReadNotificationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const requestedId = useSearchParams().get("id");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchNotifications(READ_PAGE_LIMIT));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải thông báo.");
    } finally {
      setNow(Date.now());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (typeFilter === "ALL" || item.type === typeFilter) &&
        (!keyword ||
          item.title.toLowerCase().includes(keyword) ||
          item.body.toLowerCase().includes(keyword) ||
          (item.senderName ?? "").toLowerCase().includes(keyword)),
    );
  }, [items, typeFilter, query]);

  // URL (?id=) là nguồn chọn thông báo, để chuông có thể mở thẳng một thông báo.
  const selected =
    items.find((item) => item.id === requestedId) ?? filtered[0] ?? null;

  function select(id: string) {
    router.replace(`${pathname}?id=${encodeURIComponent(id)}`, { scroll: false });
  }

  return (
    <PageFrame
      title="Đọc thông báo"
      description="Thông báo gửi tới bạn, bao gồm thông báo giao nhiệm vụ tự động và thông báo từ BCN, trưởng ban."
      action={
        <ActionButton
          variant="outline"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => { refreshApiCache(); void load(); }}
          disabled={loading}
        >
          Tải lại
        </ActionButton>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Section title="Danh sách thông báo" subtitle={`${items.length} thông báo gần nhất`}>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#71717A] focus-within:border-[#E11D48]">
            <Search className="h-4 w-4 shrink-0" />
            <span className="sr-only">Tìm thông báo</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-[#A1A1AA]"
              placeholder="Tìm theo tiêu đề, nội dung, người gửi..."
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => {
              const active = typeFilter === filter;
              const count = filter === "ALL" ? items.length : items.filter((item) => item.type === filter).length;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTypeFilter(filter)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-rose-50 text-[#E11D48]"
                      : "border border-slate-200 bg-white text-[#71717A] hover:bg-slate-50"
                  }`}
                >
                  {filter === "ALL" ? "Tất cả" : typeMeta(filter).label} {count}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            {loading && items.length === 0 && (
              <p role="status" className="text-sm text-[#71717A]">Đang tải thông báo...</p>
            )}
            {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-[#71717A]">
                {items.length === 0 ? "Bạn chưa có thông báo nào." : "Không có thông báo phù hợp bộ lọc."}
              </p>
            )}
            {filtered.map((item) => {
              const meta = typeMeta(item.type);
              const isSelected = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    isSelected ? "border-rose-200 bg-rose-50/40" : "border-slate-200/60 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate font-medium text-[#18181B]">{item.title}</h3>
                        <span className="shrink-0 text-xs text-[#71717A]">
                          {formatRelativeTime(item.createdAt, now)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#71717A]">{item.body}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Chi tiết thông báo">
          {selected ? (
            <NotificationDetail notification={selected} />
          ) : (
            <p className="text-sm text-[#71717A]">Chọn một thông báo để xem chi tiết.</p>
          )}
        </Section>
      </div>
    </PageFrame>
  );
}

function NotificationDetail({ notification }: { notification: AppNotification }) {
  const meta = typeMeta(notification.type);
  const isTask = notification.type === "TASK_ASSIGNED" && notification.entityId;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-2xl font-semibold tracking-tight text-[#18181B]">{notification.title}</h3>
        <span className={`rounded-full px-3 py-1.5 text-sm ${meta.badge}`}>{meta.label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-[#71717A]">
        <span className="inline-flex items-center gap-2">
          <Users className="h-4 w-4" />
          Người gửi: {notification.senderName ?? "Hệ thống"}
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {formatDateTime(notification.createdAt)}
        </span>
      </div>
      <div className="whitespace-pre-line break-words rounded-[1.5rem] border border-slate-200/60 bg-slate-50 p-5 text-sm leading-7 text-[#18181B]">
        {notification.body}
      </div>
      {isTask && (
        <Link
          href={notificationHref(notification)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#18181B] hover:bg-slate-50"
        >
          <ArrowRight className="h-4 w-4" />
          Xem nhiệm vụ
        </Link>
      )}
    </div>
  );
}

// ============================================================================
// TẠO THÔNG BÁO
// ============================================================================

export function CreateNotificationPage() {
  const { user } = useUserContext();
  const isBcn = (user?.role ?? "").toUpperCase() === "BCN";
  const ownDepartment = (user?.department ?? "").toUpperCase();
  const selfId = (user?.id ?? "").toLowerCase();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<ManualNotificationType>("GENERAL");
  const [audienceChoice, setAudienceChoice] = useState<NotificationAudience | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [membersError, setMembersError] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"title" | "body" | "departments" | "members", string>>>({});

  // Trưởng ban không có lựa chọn "Toàn CLB"; mặc định là cả ban của mình.
  const audience: NotificationAudience =
    audienceChoice && (isBcn || audienceChoice !== "ALL")
      ? audienceChoice
      : isBcn
        ? "ALL"
        : "DEPARTMENTS";

  useEffect(() => {
    fetchMembers()
      .then(setMembers)
      .catch((error: Error) => setMembersError(error.message));
  }, []);

  const selectableMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          member.active &&
          member.id.toLowerCase() !== selfId &&
          (isBcn || (member.department ?? "").toUpperCase() === ownDepartment),
      ),
    [members, selfId, isBcn, ownDepartment],
  );

  const visibleMembers = useMemo(() => {
    const keyword = memberQuery.trim().toLowerCase();
    return keyword
      ? selectableMembers.filter(
          (member) =>
            member.fullName.toLowerCase().includes(keyword) ||
            member.email.toLowerCase().includes(keyword),
        )
      : selectableMembers;
  }, [selectableMembers, memberQuery]);

  const audienceOptions: { value: NotificationAudience; label: string }[] = isBcn
    ? [
        { value: "ALL", label: "Toàn CLB" },
        { value: "DEPARTMENTS", label: "Chọn ban" },
        { value: "MEMBERS", label: "Chọn thành viên cụ thể" },
      ]
    : [
        { value: "DEPARTMENTS", label: `Toàn ${DEPARTMENT_NAMES[ownDepartment] ?? "ban"}` },
        { value: "MEMBERS", label: "Chọn thành viên trong ban" },
      ];

  const recipientSummary =
    audience === "ALL"
      ? "Toàn CLB"
      : audience === "DEPARTMENTS"
        ? isBcn
          ? departments.length
            ? departments.map((code) => DEPARTMENT_NAMES[code] ?? code).join(", ")
            : "Chưa chọn ban"
          : `Toàn ${DEPARTMENT_NAMES[ownDepartment] ?? "ban"}`
        : memberIds.length
          ? `${memberIds.length} thành viên`
          : "Chưa chọn thành viên";

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = "Nhập tiêu đề để người nhận biết thông báo nói về gì.";
    if (audience === "DEPARTMENTS" && isBcn && departments.length === 0) nextErrors.departments = "Chọn ít nhất một ban.";
    if (audience === "MEMBERS" && memberIds.length === 0) nextErrors.members = "Chọn ít nhất một thành viên.";
    if (!body.trim()) nextErrors.body = "Nhập nội dung thông báo.";
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(`notification-${firstInvalid}`)?.focus();
      return;
    }

    setSending(true);
    try {
      const result = await createNotification({
        title: title.trim(),
        body: body.trim(),
        type,
        audience,
        departments: audience === "DEPARTMENTS" ? (isBcn ? departments : [ownDepartment]) : undefined,
        memberIds: audience === "MEMBERS" ? memberIds : undefined,
      });
      toast.success(`Đã gửi "${title.trim()}" tới ${result.recipientCount} người.`);
      setTitle("");
      setBody("");
      setMemberIds([]);
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : "Không thể gửi thông báo.");
    } finally {
      setSending(false);
    }
  }

  const previewMeta = typeMeta(type);

  return (
    <PageFrame
      title="Tạo thông báo"
      description={
        isBcn
          ? "Gửi thông báo tới toàn CLB, một hoặc nhiều ban, hoặc từng thành viên."
          : "Gửi thông báo tới cả ban hoặc từng thành viên trong ban của bạn."
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Section title="Biên soạn" subtitle="Tiêu đề, loại, người nhận và nội dung.">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#18181B]">
                Tiêu đề <span className="text-rose-600">*</span>
              </span>
              <input
                id="notification-title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErrors((current) => ({ ...current, title: undefined }));
                }}
                maxLength={255}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "notification-title-error" : undefined}
                className={`${inputClass} aria-[invalid=true]:border-rose-400`}
                placeholder="Ví dụ: Họp toàn ban tối thứ Hai"
              />
              {errors.title ? (
                <span id="notification-title-error" className="mt-1 block text-xs text-rose-700">{errors.title}</span>
              ) : null}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#18181B]">Loại thông báo</span>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value as ManualNotificationType)}
                  className={inputClass}
                >
                  {MANUAL_NOTIFICATION_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {NOTIFICATION_TYPE_META[value].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#18181B]">Người nhận</span>
                <select
                  value={audience}
                  onChange={(event) => setAudienceChoice(event.target.value as NotificationAudience)}
                  className={inputClass}
                >
                  {audienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {audience === "DEPARTMENTS" && isBcn && (
              <fieldset aria-describedby={errors.departments ? "notification-departments-error" : undefined}>
                <legend className="mb-2 text-sm font-medium text-[#18181B]">
                  Chọn ban <span className="text-rose-600">*</span>
                </legend>
                <div id="notification-departments" tabIndex={-1} className="flex flex-wrap gap-2 outline-none">
                  {Object.entries(DEPARTMENT_NAMES).map(([code, name]) => {
                    const checked = departments.includes(code);
                    return (
                      <label
                        key={code}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rose-300 ${
                          checked
                            ? "border-rose-200 bg-rose-50 text-[#E11D48]"
                            : "border-slate-200 bg-white text-[#71717A] hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => {
                            setDepartments((current) => toggle(current, code));
                            setErrors((current) => ({ ...current, departments: undefined }));
                          }}
                        />
                        {name}
                      </label>
                    );
                  })}
                </div>
                {errors.departments ? (
                  <p id="notification-departments-error" className="mt-1.5 text-xs text-rose-700">{errors.departments}</p>
                ) : null}
              </fieldset>
            )}

            {audience === "MEMBERS" && (
              <fieldset
                className={`rounded-2xl border p-4 ${errors.members ? "border-rose-300" : "border-slate-200"}`}
                aria-describedby={errors.members ? "notification-members-error" : undefined}
              >
                <legend className="px-1 text-sm font-medium text-[#18181B]">
                  Chọn thành viên ({memberIds.length} đã chọn)
                </legend>
                {errors.members ? (
                  <p id="notification-members-error" className="mb-2 text-xs text-rose-700">{errors.members}</p>
                ) : null}
                <input
                  id="notification-members"
                  aria-label="Tìm thành viên"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  className={`${inputClass} py-2`}
                  placeholder="Tìm theo tên hoặc email..."
                />
                {membersError && <p role="alert" className="mt-2 text-sm text-rose-600">{membersError}</p>}
                <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
                  {visibleMembers.length === 0 && !membersError && (
                    <p className="py-3 text-center text-sm text-[#71717A]">Không có thành viên phù hợp.</p>
                  )}
                  {visibleMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={memberIds.includes(member.id)}
                        onChange={() => {
                          setMemberIds((current) => toggle(current, member.id));
                          setErrors((current) => ({ ...current, members: undefined }));
                        }}
                        className="h-4 w-4 accent-[#E11D48]"
                      />
                      <span className="min-w-0 flex-1 truncate text-[#18181B]">{member.fullName}</span>
                      {isBcn && (
                        <span className="shrink-0 text-xs text-[#71717A]">
                          {DEPARTMENT_NAMES[(member.department ?? "").toUpperCase()] ?? ""}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#18181B]">
                Nội dung <span className="text-rose-600">*</span>
              </span>
              <textarea
                id="notification-body"
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setErrors((current) => ({ ...current, body: undefined }));
                }}
                maxLength={5000}
                aria-invalid={Boolean(errors.body)}
                aria-describedby={errors.body ? "notification-body-error" : undefined}
                className={`${inputClass} min-h-64 rounded-[1.5rem] p-4 aria-[invalid=true]:border-rose-400`}
                placeholder="Nội dung thông báo..."
              />
              <span className="mt-1 flex justify-between gap-3 text-xs">
                <span id="notification-body-error" className="text-rose-700">{errors.body}</span>
                <span className="text-[#71717A]">{body.length}/5000</span>
              </span>
            </label>

            <ActionButton type="submit" icon={<Send className="h-4 w-4" />} disabled={sending}>
              {sending ? "Đang gửi..." : "Gửi thông báo"}
            </ActionButton>
          </div>
        </Section>

        <Section title="Xem trước" subtitle="Thông báo hiển thị như người nhận thấy.">
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-200/60 bg-slate-50 p-5">
              <span className={`rounded-full px-3 py-1 text-xs ${previewMeta.badge}`}>{previewMeta.label}</span>
              <h3 className="mt-3 break-words text-2xl font-semibold tracking-tight text-[#18181B]">
                {title.trim() || "Tiêu đề thông báo"}
              </h3>
              <p className="mt-2 text-sm text-[#71717A]">Người gửi: {user?.name ?? "Bạn"}</p>
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-[#18181B]">
                {body.trim() || "Nội dung thông báo sẽ hiện ở đây."}
              </p>
            </div>
            <p className="text-sm text-[#71717A]">
              <span className="font-medium text-[#18181B]">Người nhận:</span> {recipientSummary}
              {audience !== "MEMBERS" && " (thành viên đang hoạt động, trừ bạn)"}
            </p>
          </div>
        </Section>
      </form>
    </PageFrame>
  );
}
