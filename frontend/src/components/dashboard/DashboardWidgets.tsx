import type { ReactNode } from "react";
import { Section } from "@/components/ui/Dashboard/Section";

type Stat = {
  label: string;
  value: string;
  note?: string;
  tone?: "rose" | "emerald" | "slate" | "amber";
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

const toneClasses: Record<NonNullable<Stat["tone"]>, string> = {
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
};

function toneBadge(tone: NonNullable<Stat["tone"]>) {
  return toneClasses[tone];
}

export function StatGrid({ items }: { items: Stat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-[1.75rem] border p-5 shadow-[0_16px_32px_-18px_rgba(0,0,0,0.08)] ${item.tone
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
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8] ${column.align === "right"
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
                    className={`px-4 py-4 text-sm text-[#18181B] ${columns[cellIndex]?.align === "right"
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
