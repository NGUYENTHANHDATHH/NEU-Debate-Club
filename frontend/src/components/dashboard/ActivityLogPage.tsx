"use client";

import { History, Search, X } from "lucide-react";
import { localIsoDate } from "@/components/dashboard/PublicationsPage";
import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { ActivityLogEntry, fetchActivityLogs } from "@/lib/api";
import { refreshApiCache } from "@/lib/requestCache";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Tạo",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  STATUS_CHANGE: "Đổi trạng thái",
  PROGRESS_UPDATE: "Cập nhật tiến độ",
  SEND: "Gửi",
  PUBLISH: "Xuất bản",
  ADD_MEMBER: "Thêm thành viên",
  REMOVE_MEMBER: "Xóa thành viên",
};

const MODULE_LABELS: Record<string, string> = {
  TASK: "Nhiệm vụ",
  MEMBER: "Thành viên",
  EVENT: "Sự kiện",
  NOTIFICATION: "Thông báo",
  LANDING_SECTION: "Trang chủ",
  LANDING_CATALOG: "Dự án / Thành tích",
  TRANSACTION: "Tài chính",
  PUBLICATION: "Ấn phẩm",
  SEASON: "Nhiệm kỳ",
};

// Backend trả tối đa 500 bản ghi mới nhất; "Tải thêm" nâng giới hạn theo từng bước.
const LOG_STEP = 200;
const LOG_MAX = 500;

const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" });

function label(map: Record<string, string>, value: string) {
  return map[value?.toUpperCase()] ?? value;
}

function show(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/** Compact one-line view of the log metadata: title first, then "from → to", then the remaining keys. */
function formatDetails(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return "";
  const { title, from, to, ...rest } = metadata;
  const parts: string[] = [];
  if (title !== undefined) parts.push(show(title));
  if (from !== undefined || to !== undefined) parts.push(`${show(from)} → ${show(to)}`);
  for (const [key, value] of Object.entries(rest)) parts.push(`${key}: ${show(value)}`);
  return parts.join(" · ");
}

const inputClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#E11D48]";

export function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState(LOG_STEP);

  const load = useCallback(async (nextLimit: number) => {
    setLoading(true);
    setError("");
    try {
      setLogs(await fetchActivityLogs(nextLimit));
      setLimit(nextLimit);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(LOG_STEP);
  }, [load]);

  const needle = query.trim().toLocaleLowerCase("vi");
  const visible = logs.filter((log) => {
    if (moduleFilter && log.entityType?.toUpperCase() !== moduleFilter) return false;
    if (actionFilter && log.action?.toUpperCase() !== actionFilter) return false;
    const day = localIsoDate(new Date(log.createdAt));
    if (fromDate && day < fromDate) return false;
    if (toDate && day > toDate) return false;
    if (!needle) return true;
    return `${log.userName ?? ""} ${log.action} ${log.entityType} ${formatDetails(log.metadata)}`
      .toLocaleLowerCase("vi")
      .includes(needle);
  });

  // Offer every known value plus any unknown one that appears in the loaded logs.
  const moduleOptions = [...new Set([...Object.keys(MODULE_LABELS), ...logs.map((log) => log.entityType?.toUpperCase())])].filter(Boolean);
  const actionOptions = [...new Set([...Object.keys(ACTION_LABELS), ...logs.map((log) => log.action?.toUpperCase())])].filter(Boolean);
  const filtering = Boolean(needle || moduleFilter || actionFilter || fromDate || toDate);
  // Đủ đúng "limit" bản ghi nghĩa là có thể còn bản ghi cũ hơn chưa tải.
  const mayHaveMore = logs.length === limit && limit < LOG_MAX;
  const oldest = logs.at(-1);

  return (
    <PageFrame
      title="Nhật ký hoạt động"
      description="Ai đã làm gì, ở module nào, lúc nào. Mới nhất ở trên cùng."
    >
      <Section
        title="Danh sách log"
        subtitle={
          loading || error
            ? undefined
            : `${filtering ? `${visible.length} khớp bộ lọc / ` : ""}${logs.length} bản ghi mới nhất${
                oldest ? `, từ ${dateTime.format(new Date(oldest.createdAt))}` : ""
              }`
        }
        action={
          <ActionButton variant="outline" onClick={() => { refreshApiCache(); void load(limit); }} disabled={loading}>
            Tải lại
          </ActionButton>
        }
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <label className="relative flex-1 lg:max-w-md">
            <span className="sr-only">Tìm kiếm</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm người thực hiện, chi tiết..."
              className={`${inputClass} w-full pl-9`}
            />
          </label>
          <select
            aria-label="Module"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">Tất cả module</option>
            {moduleOptions.map((value) => (
              <option key={value} value={value}>
                {label(MODULE_LABELS, value)}
              </option>
            ))}
          </select>
          <select
            aria-label="Hành động"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">Tất cả hành động</option>
            {actionOptions.map((value) => (
              <option key={value} value={value}>
                {label(ACTION_LABELS, value)}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              Từ
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2">
              đến
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          {filtering ? (
            <ActionButton
              variant="ghost"
              icon={<X className="h-4 w-4" />}
              onClick={() => {
                setQuery("");
                setModuleFilter("");
                setActionFilter("");
                setFromDate("");
                setToDate("");
              }}
            >
              Xóa lọc
            </ActionButton>
          ) : null}
        </div>

        {loading && logs.length === 0 ? (
          <p role="status" className="py-10 text-center text-sm text-slate-500">
            Đang tải nhật ký...
          </p>
        ) : error ? (
          <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            <History className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            {filtering
              ? mayHaveMore
                ? "Không có log nào khớp bộ lọc trong các bản ghi đã tải. Thử “Tải thêm bản ghi cũ hơn”."
                : "Không có log nào khớp bộ lọc."
              : "Chưa có hoạt động nào được ghi nhận. Mọi thao tác thêm, sửa, xóa sẽ tự động xuất hiện ở đây."}
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-[1.5rem] border border-slate-200/60">
            <table className="w-full min-w-[860px] divide-y divide-slate-200/60 text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Người thực hiện</th>
                  <th className="px-4 py-3">Hành động</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {visible.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {dateTime.format(new Date(log.createdAt))}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#18181B]">{log.userName ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{label(ACTION_LABELS, log.action)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{label(MODULE_LABELS, log.entityType)}</td>
                    <td className="max-w-md break-words px-4 py-3 text-slate-600">
                      {formatDetails(log.metadata) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!error && logs.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
            {mayHaveMore ? (
              <ActionButton variant="outline" onClick={() => void load(Math.min(limit + LOG_STEP, LOG_MAX))} disabled={loading}>
                {loading ? "Đang tải…" : "Tải thêm bản ghi cũ hơn"}
              </ActionButton>
            ) : (
              <span>
                {logs.length >= LOG_MAX
                  ? `Đã tải tối đa ${LOG_MAX} bản ghi mới nhất mà hệ thống cho xem.`
                  : "Đã hiển thị toàn bộ nhật ký."}
              </span>
            )}
          </div>
        ) : null}
      </Section>
    </PageFrame>
  );
}
