"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ExternalLink, FolderOpen, Megaphone, RefreshCw, Search } from "lucide-react";
import { formatIsoDate, localIsoDate, PLATFORM_META, safeHttpUrl } from "@/components/dashboard/PublicationsPage";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { fetchEvents, fetchPublications } from "@/lib/api";
import { DEPARTMENT_NAMES } from "@/lib/notifications";

type LibraryKind = "PUBLICATION" | "EVENT_RESOURCE";

type LibraryItem = {
  key: string;
  kind: LibraryKind;
  title: string;
  subtitle: string;
  href: string;
  date: string; // yyyy-MM-dd
  department: string | null;
};

const KIND_LABELS: Record<LibraryKind, string> = {
  PUBLICATION: "Ấn phẩm",
  EVENT_RESOURCE: "Tài nguyên sự kiện",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10";

function hostLabel(href: string) {
  return new URL(href).hostname.replace(/^www\./, "");
}

/** Gộp link ấn phẩm + link tài nguyên sự kiện; nguồn nào lỗi thì báo lỗi riêng, nguồn còn lại vẫn hiển thị. */
async function loadLibrary() {
  const [pubResult, eventResult] = await Promise.allSettled([fetchPublications(), fetchEvents()]);
  const next: LibraryItem[] = [];
  const failed: string[] = [];
  if (pubResult.status === "fulfilled") {
    for (const pub of pubResult.value) {
      const href = safeHttpUrl(pub.url);
      if (!href) continue;
      next.push({
        key: `pub-${pub.id}`,
        kind: "PUBLICATION",
        title: pub.title,
        subtitle: [(PLATFORM_META[pub.platform] ?? PLATFORM_META.OTHER).label, pub.eventTitle].filter(Boolean).join(" · "),
        href,
        date: pub.postedAt,
        department: pub.department.toUpperCase(),
      });
    }
  } else {
    failed.push(pubResult.reason instanceof Error ? pubResult.reason.message : "Không thể tải ấn phẩm.");
  }
  if (eventResult.status === "fulfilled") {
    for (const ev of eventResult.value) {
      ev.resourceUrls.forEach((url, index) => {
        const href = safeHttpUrl(url);
        if (!href) return;
        next.push({
          key: `event-${ev.id}-${index}`,
          kind: "EVENT_RESOURCE",
          title: ev.title,
          subtitle: hostLabel(href),
          href,
          date: localIsoDate(new Date(ev.eventDate)),
          department: null,
        });
      });
    }
  } else {
    failed.push(eventResult.reason instanceof Error ? eventResult.reason.message : "Không thể tải sự kiện.");
  }
  next.sort((a, b) => b.date.localeCompare(a.date));
  return { items: next, errors: failed };
}

// shortcut: thư viện chỉ gộp link ấn phẩm + link tài nguyên sự kiện (không có bảng riêng, không upload file);
// thêm bảng library_items khi CLB cần lưu tài liệu không gắn ấn phẩm/sự kiện.
export function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [kind, setKind] = useState<LibraryKind | "ALL">("ALL");
  const [department, setDepartment] = useState("ALL");
  const [query, setQuery] = useState("");

  const load = useCallback(
    () =>
      loadLibrary().then((result) => {
        setItems(result.items);
        setErrors(result.errors);
        setLoading(false);
      }),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (kind === "ALL" || item.kind === kind) &&
        // Lọc ban chỉ áp dụng cho ấn phẩm; tài nguyên sự kiện không thuộc ban nào nên bị ẩn khi chọn ban.
        (department === "ALL" || item.department === department) &&
        (!keyword || item.title.toLowerCase().includes(keyword) || item.subtitle.toLowerCase().includes(keyword)),
    );
  }, [items, kind, department, query]);

  const counts = useMemo(
    () => ({
      ALL: items.length,
      PUBLICATION: items.filter((item) => item.kind === "PUBLICATION").length,
      EVENT_RESOURCE: items.filter((item) => item.kind === "EVENT_RESOURCE").length,
    }),
    [items],
  );

  return (
    <PageFrame
      eyebrow="Thành viên"
      title="Thư viện"
      description="Tổng hợp link ấn phẩm đã đăng và tài nguyên (Docs, Sheets, Drive...) của các sự kiện."
    >
      {errors.length ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{errors.join(" ")}</span>
          <ActionButton variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={() => {
              setLoading(true);
              void load();
            }}>
            Thử lại
          </ActionButton>
        </div>
      ) : null}

      <Section title="Tài liệu & liên kết" subtitle={loading ? undefined : `${filtered.length} trên tổng số ${items.length} mục`}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1">
            {(["ALL", "PUBLICATION", "EVENT_RESOURCE"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                aria-pressed={kind === value}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${kind === value ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                {value === "ALL" ? "Tất cả" : KIND_LABELS[value]} ({counts[value]})
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, sự kiện, nền tảng..."
              aria-label="Tìm trong thư viện"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={kind === "EVENT_RESOURCE"}
            aria-label="Lọc ấn phẩm theo ban"
            className={`${inputClass} disabled:opacity-50 lg:w-52`}
          >
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
            <p className="mt-3 text-sm text-slate-500">Đang tải thư viện...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-base font-semibold text-slate-700">
              {items.length ? "Không có mục nào phù hợp bộ lọc" : "Thư viện chưa có liên kết nào"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-[#E11D48]/30 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 font-medium text-[#E11D48]">
                    {item.kind === "PUBLICATION" ? <Megaphone className="h-3.5 w-3.5" /> : <FolderOpen className="h-3.5 w-3.5" />}
                    {KIND_LABELS[item.kind]}
                  </span>
                  <ExternalLink className="h-4 w-4 text-slate-300 transition group-hover:text-[#E11D48]" />
                </div>
                <h3 className="mt-3 line-clamp-2 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 truncate text-sm text-slate-500">{item.subtitle}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatIsoDate(item.date)}
                  </span>
                  {item.department ? <span>· {DEPARTMENT_NAMES[item.department] ?? item.department}</span> : null}
                </div>
              </a>
            ))}
          </div>
        )}
      </Section>
    </PageFrame>
  );
}
