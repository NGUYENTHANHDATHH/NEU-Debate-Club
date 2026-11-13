"use client";

import { Fragment, useState, type ReactNode } from "react";
import { heatLevel } from "@/components/dashboard/healthMetrics";

/**
 * Biểu đồ nhỏ cho Health dashboard, vẽ bằng HTML. Màu lấy từ bảng màu dataviz đã kiểm tra
 * (validate_palette.js trên nền trắng): mỗi cặp màu luôn đi kèm chú giải, khe 2px và bảng số liệu.
 */
export const VIZ = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  red: "#e34948",
  critical: "#d03b3b",
  neutral: "#c3c2b7",
  grid: "#e1e0d9",
  // Dải xanh dương tuần tự (heatmap) và theo bậc (đậm → nhạt).
  heat: ["#f1f1ef", "#cde2fb", "#86b6ef", "#3987e5", "#1c5cab"],
  ordinal: ["#184f95", "#3987e5", "#86b6ef"],
} as const;

export type Series = { key: string; label: string; color: string };
type Row = { key: string; label: string; values: Record<string, number> };

const fmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

function niceMax(value: number) {
  if (value <= 4) return Math.max(1, Math.ceil(value));
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value / 4)! * magnitude;
  return Math.ceil(value / step) * step;
}

export function Legend({ series, shape = "rect" }: { series: Series[]; shape?: "rect" | "dot" }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#52514e]">
      {series.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={shape === "dot" ? "h-2.5 w-2.5 rounded-full" : "h-2.5 w-2.5 rounded-[2px]"}
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <details className="mt-3 text-xs text-[#52514e]">
      <summary className="cursor-pointer select-none rounded font-medium text-[#52514e] hover:text-[#18181B]">
        Xem bảng số liệu
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead className="text-[#898781]">
            <tr>
              {head.map((cell, index) => (
                <th key={cell} scope="col" className={`py-1 pr-3 font-medium ${index ? "text-right" : ""}`}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1e0d9]">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, index) => (
                  <td key={index} className={`py-1 pr-3 ${index ? "text-right" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/**
 * Cột theo nhóm (`stacked`: chồng; `grouped`: đặt cạnh nhau). Cột ≤ 24px, đầu bo 4px, khe 2px giữa các phần.
 * Rê chuột hoặc Tab vào một cột để xem mọi chuỗi tại đó.
 */
export function ColumnChart({
  rows,
  series,
  mode = "stacked",
  height = 176,
  unit,
  format = (value: number) => fmt.format(value),
  caption,
}: {
  rows: Row[];
  series: Series[];
  mode?: "stacked" | "grouped";
  height?: number;
  unit: string;
  format?: (value: number) => string;
  caption: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const totals = rows.map((row) => series.reduce((sum, item) => sum + (row.values[item.key] ?? 0), 0));
  const peak = mode === "stacked" ? Math.max(0, ...totals) : Math.max(0, ...rows.flatMap((row) => series.map((s) => row.values[s.key] ?? 0)));
  const max = niceMax(peak);
  const ticks = [max, max / 2, 0];
  const labelStep = Math.ceil(rows.length / 8); // tối đa ~8 nhãn trục X
  const tickLabel = (value: number) => (max >= 10_000 ? compact.format(value) : fmt.format(value));

  return (
    <figure>
      {series.length > 1 ? <Legend series={series} /> : null}
      <div className="mt-3 flex gap-2">
        <div className="relative w-10 shrink-0 text-right text-[11px] tabular-nums text-[#898781]" style={{ height }} aria-hidden>
          {ticks.map((tick, index) => (
            <span key={index} className="absolute right-0 -translate-y-1/2" style={{ top: `${(index / 2) * 100}%` }}>
              {tickLabel(tick)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            {ticks.map((_, index) => (
              <span
                key={index}
                aria-hidden
                className="absolute inset-x-0 h-px"
                style={{ top: `${(index / 2) * 100}%`, background: index === 2 ? "#c3c2b7" : VIZ.grid }}
              />
            ))}
            <div className="absolute inset-0 flex items-end">
              {rows.map((row, index) => {
                const summary = `${row.label}: ${series.map((s) => `${s.label} ${format(row.values[s.key] ?? 0)}`).join(", ")}`;
                return (
                  <div
                    key={row.key}
                    tabIndex={0}
                    role="img"
                    aria-label={summary}
                    onPointerEnter={() => setActive(index)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    className="relative flex h-full flex-1 items-end justify-center rounded-sm outline-none focus-visible:bg-[#f1f1ef] hover:bg-[#f7f7f5]"
                  >
                    {mode === "stacked" ? (
                      <div className="flex w-full max-w-6 flex-col-reverse gap-[2px]" style={{ height: `${(totals[index] / max) * 100}%` }}>
                        {series.map((item, segment) => {
                          const value = row.values[item.key] ?? 0;
                          if (!value) return null;
                          const isTop = series.slice(segment + 1).every((next) => !(row.values[next.key] ?? 0));
                          return (
                            <span
                              key={item.key}
                              className={isTop ? "rounded-t-[4px]" : ""}
                              style={{ background: item.color, flexGrow: value, minHeight: 2 }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex h-full w-full max-w-12 items-end justify-center gap-[2px]">
                        {series.map((item) => {
                          const value = row.values[item.key] ?? 0;
                          return (
                            <span
                              key={item.key}
                              className="w-full max-w-5 rounded-t-[4px]"
                              style={{ background: item.color, height: `${(value / max) * 100}%`, minHeight: value ? 2 : 0 }}
                            />
                          );
                        })}
                      </div>
                    )}
                    {active === index ? (
                      <div
                        role="presentation"
                        className={`pointer-events-none absolute top-1 z-10 w-max min-w-40 rounded-lg border border-[#e1e0d9] bg-white px-3 py-2 text-xs shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] ${
                          index > rows.length / 2 ? "right-0" : "left-0"
                        }`}
                      >
                        <p className="font-medium text-[#52514e]">{row.label}</p>
                        <ul className="mt-1 space-y-0.5">
                          {series.map((item) => (
                            <li key={item.key} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5 whitespace-nowrap text-[#52514e]">
                                <span aria-hidden className="h-0.5 w-3 rounded" style={{ background: item.color }} />
                                {item.label}
                              </span>
                              <strong className="tabular-nums text-[#0b0b0b]">{format(row.values[item.key] ?? 0)}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-1.5 flex text-[11px] text-[#898781]" aria-hidden>
            {rows.map((row, index) => (
              <span key={row.key} className="relative h-4 flex-1">
                {index % labelStep === 0 ? (
                  <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{row.label}</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        {caption}. Đơn vị: {unit}.
      </figcaption>
      <DataTable
        caption={caption}
        head={["", ...series.map((s) => s.label), ...(mode === "stacked" && series.length > 1 ? ["Tổng"] : [])]}
        rows={rows.map((row, index) => [
          row.label,
          ...series.map((s) => format(row.values[s.key] ?? 0)),
          ...(mode === "stacked" && series.length > 1 ? [format(totals[index])] : []),
        ])}
      />
    </figure>
  );
}

/** Thanh chia phần cao 28px: mỗi phần ghi tỉ lệ bên trong nếu đủ chỗ, chú giải ghi tên. */
export function SegmentedBar({
  parts,
  caption,
}: {
  parts: { key: string; label: string; count: number; color: string; ink: "light" | "dark" }[];
  caption: string;
}) {
  const total = parts.reduce((sum, part) => sum + part.count, 0);
  if (!total) return <p className="text-sm text-[#71717A]">Chưa có dữ liệu.</p>;
  return (
    <figure>
      <div className="flex h-7 gap-[2px]" role="img" aria-label={`${caption}: ${parts.map((p) => `${p.label} ${p.count}`).join(", ")}`}>
        {parts
          .filter((part) => part.count > 0)
          .map((part) => {
            const share = Math.round((part.count / total) * 100);
            return (
              <span
                key={part.key}
                title={`${part.label}: ${part.count} (${share}%)`}
                className="flex items-center overflow-hidden rounded-[4px] px-2 text-xs font-semibold"
                style={{ flexGrow: part.count, background: part.color, color: part.ink === "light" ? "#ffffff" : "#0b0b0b" }}
              >
                {share >= 12 ? `${share}%` : ""}
              </span>
            );
          })}
      </div>
      <div className="mt-2">
        <Legend series={parts.map((part) => ({ key: part.key, label: `${part.label} · ${part.count}`, color: part.color }))} />
      </div>
    </figure>
  );
}

/** Danh sách thanh đo: tên, thanh, con số; thanh xuống dòng dưới tên khi hẹp. */
export function MeterList({
  rows,
  color = VIZ.blue,
  emptyText,
}: {
  rows: { key: string; label: string; ratio: number; figure: string; hint?: string }[];
  color?: string;
  emptyText: string;
}) {
  if (!rows.length) return <p className="text-sm text-[#71717A]">{emptyText}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]">
          <span className="truncate text-sm text-[#18181B]" title={row.hint ?? row.label}>
            {row.label}
          </span>
          <span className="col-span-2 row-start-2 h-2 overflow-hidden rounded-full sm:col-span-1 sm:row-start-auto" style={{ background: "#e7eefa" }} aria-hidden>
            <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, row.ratio * 100))}%`, background: color }} />
          </span>
          <span className="row-start-1 text-right text-sm font-medium tabular-nums text-[#18181B] sm:row-start-auto">{row.figure}</span>
        </li>
      ))}
    </ul>
  );
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const dayLabel = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "numeric" });

/** Heatmap lịch: cột = tuần, hàng = thứ; màu xanh dương đậm dần theo số thao tác. */
export function CalendarHeatmap({
  columns,
  max,
}: {
  columns: { date: string; count: number; future: boolean }[][];
  max: number;
}) {
  const monthOf = (date: string) => `Th${Number(date.slice(5, 7))}`;
  // Nhãn tháng ở cột đổi tháng; bỏ nhãn nếu cách nhãn trước dưới 3 cột để không đè nhau.
  const monthLabels = new Set<number>();
  columns.forEach((week, index) => {
    const changed = index === 0 || week[0].date.slice(5, 7) !== columns[index - 1][0].date.slice(5, 7);
    const last = Math.max(-Infinity, ...monthLabels);
    if (!changed) return;
    if (index - last < 3) monthLabels.delete(last);
    monthLabels.add(index);
  });
  return (
    <figure>
      {/* Lưới: cột đầu là nhãn thứ, hàng đầu là nhãn tháng; ô vuông giãn theo bề rộng thẻ. */}
      <div
        role="img"
        aria-label={`Số thao tác mỗi ngày trong ${columns.length} tuần, tối đa ${max} thao tác một ngày. Xem bảng số liệu bên dưới.`}
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `1.5rem repeat(${columns.length}, minmax(0, 2.25rem))` }}
      >
        <span aria-hidden />
        {columns.map((week, index) => (
          <span key={`m-${week[0].date}`} aria-hidden className="h-4 whitespace-nowrap text-[10px] text-[#898781]">
            {monthLabels.has(index) ? monthOf(week[0].date) : ""}
          </span>
        ))}
        {WEEKDAYS.map((day, row) => (
          <Fragment key={day}>
            <span aria-hidden className="flex items-center text-[10px] text-[#898781]">
              {row % 2 === 0 ? day : ""}
            </span>
            {columns.map((week) => {
              const cell = week[row];
              const label = `${dayLabel.format(new Date(`${cell.date}T00:00:00`))}: ${cell.future ? "chưa tới" : `${cell.count} thao tác`}`;
              return (
                <span
                  key={cell.date}
                  title={label}
                  className="aspect-square rounded-[3px]"
                  style={{ background: cell.future ? "transparent" : VIZ.heat[heatLevel(cell.count, max)] }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#898781]" aria-hidden>
        Ít
        {VIZ.heat.map((color) => (
          <span key={color} className="h-3 w-3 rounded-[2px]" style={{ background: color }} />
        ))}
        Nhiều {max ? `(tối đa ${max}/ngày)` : ""}
      </div>
    </figure>
  );
}
