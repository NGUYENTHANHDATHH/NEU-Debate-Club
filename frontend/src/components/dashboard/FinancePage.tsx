"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  CircleCheck,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  NO_EVENT,
  eventBudgetRows,
  filterTransactions,
  summarizeTransactions,
  type TransactionFilters,
} from "@/components/dashboard/financeMetrics";
import { formatIsoDate, localIsoDate } from "@/components/dashboard/PublicationsPage";
import { BUDGET_TONE, TYPE_META, TransactionForm, inputClass, money } from "@/components/dashboard/TransactionForm";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import {
  deleteTransaction,
  fetchEvents,
  fetchTransactions,
  type ClubEvent,
  type FinanceTransaction,
} from "@/lib/api";

const PAGE_SIZE = 20;
const EMPTY_FILTERS: TransactionFilters = { query: "", type: "", month: "", eventId: "" };
type SortKey = "date" | "amount";

function signed(value: number) {
  return `${value < 0 ? "−" : "+"}${money.format(Math.abs(value))}`;
}

export function FinancePage() {
  const [today] = useState(() => localIsoDate(new Date()));
  const [items, setItems] = useState<FinanceTransaction[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  // ?new=1 (từ thao tác nhanh) mở sẵn form.
  const [open, setOpen] = useState(() => searchParams.has("new"));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    // Sự kiện chỉ dùng cho ô chọn tùy chọn — lỗi tải sự kiện không chặn trang.
    const [txResult, eventResult] = await Promise.allSettled([fetchTransactions(), fetchEvents()]);
    if (txResult.status === "fulfilled") setItems(txResult.value);
    else setError(txResult.reason instanceof Error ? txResult.reason.message : "Không thể tải giao dịch.");
    if (eventResult.status === "fulfilled") setEvents(eventResult.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summarizeTransactions(items, today.slice(0, 7)), [items, today]);

  const eventRows = useMemo(() => eventBudgetRows(items, events), [items, events]);
  const overBudget = eventRows.filter((row) => row.usage.tone === "over");
  const nearBudget = eventRows.filter((row) => row.usage.tone === "warn");
  const totalIncome = summary.categories.reduce((sum, category) => sum + category.income, 0);
  const totalExpense = summary.categories.reduce((sum, category) => sum + category.expense, 0);
  const monthNet = summary.monthIncome - summary.monthExpense;
  const monthFlow = summary.monthIncome + summary.monthExpense;
  const monthLabel = `tháng ${Number(today.slice(5, 7))}/${today.slice(0, 4)}`;

  function showEvent(eventId: string) {
    setFilters({ ...EMPTY_FILTERS, eventId });
    setPage(1);
    document.getElementById("finance-transactions")?.scrollIntoView({ behavior: "smooth" });
  }
  const filtered = useMemo(() => filterTransactions(items, filters), [items, filters]);
  const filteredTotals = useMemo(() => summarizeTransactions(filtered, ""), [filtered]);
  const sorted = useMemo(() => {
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const primary =
        sort.key === "amount"
          ? Number(a.amount) - Number(b.amount)
          : a.transactionDate.localeCompare(b.transactionDate) || a.createdAt.localeCompare(b.createdAt);
      return primary * sign;
    });
  }, [filtered, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtering = filters !== EMPTY_FILTERS;

  function updateFilter<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    setSort((current) => ({ key, dir: current.key === key && current.dir === "desc" ? "asc" : "desc" }));
    setPage(1);
  }

  const existingCategories = useMemo(
    () => [...new Set(items.map((item) => item.category?.trim()).filter((c): c is string => !!c))].sort(),
    [items],
  );

  async function handleDelete(item: FinanceTransaction) {
    if (
      !window.confirm(
        `Xóa giao dịch "${item.description}" (${money.format(Number(item.amount))})?
Số dư quỹ sẽ được tính lại và không thể hoàn tác.`,
      )
    )
      return;
    setDeletingId(item.id);
    try {
      await deleteTransaction(item.id);
      setItems((current) => current.filter((tx) => tx.id !== item.id));
      toast.success(`Đã xóa giao dịch "${item.description}".`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Không thể xóa giao dịch.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageFrame
      title="Thu chi câu lạc bộ"
      description="Sổ thu chi thực tế của CLB: số dư quỹ, thu chi trong tháng và chi tiết từng giao dịch."
      action={
        <ActionButton icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
          Thêm giao dịch
        </ActionButton>
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

      {open ? (
        <Section
          title="Thêm giao dịch"
          subtitle="Khoản gắn sự kiện cũng hiện trong trang Quản lý sự kiện."
          action={
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          }
        >
          <TransactionForm
            events={events}
            categories={existingCategories}
            defaultType="INCOME"
            onSaved={(saved) => {
              setItems((current) => [saved, ...current]);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </Section>
      ) : null}

      {loading ? (
        <div role="status" className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#E11D48]" />
          <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu tài chính...</p>
        </div>
      ) : error ? null : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <section aria-labelledby="fund-heading" className="rounded-2xl border border-slate-200/70 bg-white p-5">
              <h2 id="fund-heading" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Wallet className="h-4 w-4" aria-hidden />
                Quỹ hiện tại
              </h2>
              <p className={`mt-2 text-3xl font-semibold tracking-tight tabular-nums ${summary.balance < 0 ? "text-[#BE123C]" : "text-emerald-700"}`}>
                {summary.balance < 0 ? "−" : ""}
                {money.format(Math.abs(summary.balance))}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {summary.balance < 0 ? "Quỹ đang âm: chi nhiều hơn thu." : "Tổng thu trừ tổng chi, từ trước đến nay."}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Tổng thu</dt>
                  <dd className="font-semibold tabular-nums text-emerald-700">{money.format(totalIncome)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Tổng chi</dt>
                  <dd className="font-semibold tabular-nums text-[#BE123C]">{money.format(totalExpense)}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="month-heading" className="rounded-2xl border border-slate-200/70 bg-white p-5">
              <h2 id="month-heading" className="text-sm font-medium text-slate-600">
                Thu chi {monthLabel}
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-600">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    Thu
                  </dt>
                  <dd className="font-semibold tabular-nums text-emerald-700">{money.format(summary.monthIncome)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-600">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-[#BE123C]">
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    Chi
                  </dt>
                  <dd className="font-semibold tabular-nums text-[#BE123C]">{money.format(summary.monthExpense)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                {monthFlow > 0 ? (
                  <>
                    <span className="bg-emerald-500" style={{ width: `${(summary.monthIncome / monthFlow) * 100}%` }} />
                    <span className="bg-[#E11D48]" style={{ width: `${(summary.monthExpense / monthFlow) * 100}%` }} />
                  </>
                ) : null}
              </div>
              <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-600">Chênh lệch ({summary.monthCount} giao dịch)</span>
                <span className={`font-semibold tabular-nums ${monthNet < 0 ? "text-[#BE123C]" : "text-emerald-700"}`}>{signed(monthNet)}</span>
              </p>
            </section>

            <section
              aria-labelledby="budget-heading"
              className={`rounded-2xl border p-5 ${
                overBudget.length ? "border-rose-200 bg-rose-50/60" : nearBudget.length ? "border-amber-200 bg-amber-50/60" : "border-emerald-200 bg-emerald-50/50"
              }`}
            >
              <h2 id="budget-heading" className="text-sm font-medium text-slate-600">
                Dự toán sự kiện
              </h2>
              {overBudget.length || nearBudget.length ? (
                <>
                  <p className={`mt-2 flex items-center gap-2 text-lg font-semibold ${overBudget.length ? "text-[#BE123C]" : "text-amber-800"}`}>
                    <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
                    {overBudget.length ? `${overBudget.length} sự kiện vượt dự toán` : `${nearBudget.length} sự kiện sắp chạm dự toán`}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {[...overBudget, ...nearBudget].slice(0, 3).map((row) => (
                      <li key={row.eventId}>
                        <button
                          type="button"
                          onClick={() => showEvent(row.eventId)}
                          className="flex w-full items-baseline justify-between gap-3 rounded-md text-left hover:underline"
                        >
                          <span className="truncate text-slate-800">{row.title}</span>
                          <span className={`shrink-0 tabular-nums ${BUDGET_TONE[row.usage.tone].text}`}>
                            {Math.round((row.usage.ratio ?? 0) * 100)}%
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-emerald-800">
                  <CircleCheck className="h-5 w-5 shrink-0" aria-hidden />
                  {eventRows.some((row) => row.usage.tone !== "none") ? "Mọi sự kiện trong dự toán" : "Chưa có sự kiện nào đặt dự toán"}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-600">
                So số đã chi với &ldquo;Ngân sách&rdquo; đặt trong Quản lý sự kiện. Đỏ: vượt; vàng: từ 80%.
              </p>
            </section>
          </div>

          <Section title="Theo sự kiện" subtitle="Dự toán so với thực chi, cùng số đã thu của từng sự kiện (VND).">
            {eventRows.length === 0 ? (
              <p className="py-4 text-sm text-[#71717A]">
                Chưa có sự kiện nào có dự toán hoặc giao dịch. Ghi thu chi ngay trong trang Quản lý sự kiện, hoặc chọn
                &ldquo;Sự kiện liên quan&rdquo; khi thêm giao dịch.
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm tabular-nums">
                  <thead className="border-b border-slate-200 text-xs text-slate-500">
                    <tr>
                      <th scope="col" className="py-2 pr-4 font-semibold">Sự kiện</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Dự toán</th>
                      <th scope="col" className="w-56 px-4 py-2 font-semibold">Đã chi (% dự toán)</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Đã thu</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Thu − chi</th>
                      <th scope="col" className="py-2 pl-4"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventRows.map((row) => {
                      const tone = BUDGET_TONE[row.usage.tone];
                      const pct = Math.round((row.usage.ratio ?? 0) * 100);
                      return (
                        <tr key={row.eventId}>
                          <td className="min-w-[200px] py-3 pr-4">
                            <span className="font-medium text-[#18181B]">{row.title}</span>
                            <span className="block text-xs text-slate-500">{row.count ? `${row.count} giao dịch` : "Chưa ghi khoản nào"}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">{row.budget ? money.format(row.budget) : "—"}</td>
                          {row.count === 0 ? (
                            <td colSpan={3} className="px-4 py-3 text-xs text-slate-500">
                              Chưa có khoản thu chi nào. Dự toán còn nguyên.
                            </td>
                          ) : (
                          <>
                          <td className="px-4 py-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-semibold text-[#BE123C]">{money.format(row.expense)}</span>
                              <span className={`whitespace-nowrap text-xs font-medium ${tone.text}`}>
                                {row.usage.ratio === null ? "Chưa có dự toán" : `${pct}%${tone.status ? ` · ${tone.status}` : ""}`}
                              </span>
                            </div>
                            {row.usage.ratio !== null ? (
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-700">{money.format(row.income)}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${row.net < 0 ? "text-[#BE123C]" : "text-emerald-700"}`}>
                            {signed(row.net)}
                          </td>
                          </>
                          )}
                          <td className="py-3 pl-4 text-right">
                            {row.count ? (
                              <button
                                type="button"
                                onClick={() => showEvent(row.eventId)}
                                className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-[#BE123C] hover:bg-rose-50"
                              >
                                Xem giao dịch
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Thu chi theo danh mục" subtitle="Tổng từ trước đến nay, đơn vị VND.">
            {summary.categories.length === 0 ? (
              <p className="py-4 text-sm text-[#71717A]">Chưa có giao dịch nào để chia theo danh mục.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4 text-xs text-slate-500" aria-hidden>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Thu</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#E11D48]" />Chi</span>
                </div>
                {summary.categories.map((category) => (
                  <div key={category.name} className="space-y-1.5">
                    <p className="text-sm font-medium text-[#18181B]">{category.name}</p>
                    {(["income", "expense"] as const).map((kind) => (
                      <div key={kind} className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="w-6">{kind === "income" ? "Thu" : "Chi"}</span>
                        <div className="h-2 flex-1 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${kind === "income" ? "bg-emerald-500" : "bg-[#E11D48]"}`}
                            style={{ width: `${(category[kind] / summary.maxValue) * 100}%` }}
                          />
                        </div>
                        <span className="w-32 text-right font-medium tabular-nums text-slate-700">{money.format(category[kind])}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <div id="finance-transactions" className="scroll-mt-20">
            <Section
              title="Giao dịch"
              subtitle={
                filtering
                  ? `${filtered.length}/${items.length} giao dịch khớp bộ lọc · Thu ${money.format(filteredTotals.monthIncome)} · Chi ${money.format(filteredTotals.monthExpense)}`
                  : `${items.length} giao dịch`
              }
            >
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                  <Wallet className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
                  <p className="mt-3 text-base font-semibold text-slate-700">Chưa có giao dịch nào</p>
                  <p className="mt-1 text-sm text-slate-500">Bấm &ldquo;Thêm giao dịch&rdquo; để ghi khoản thu chi đầu tiên.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
                    <label className="relative block">
                      <span className="sr-only">Tìm giao dịch</span>
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                      <input
                        type="search"
                        value={filters.query}
                        onChange={(e) => updateFilter("query", e.target.value)}
                        placeholder="Tìm mô tả, danh mục, sự kiện, người tạo…"
                        className={`${inputClass} pl-9`}
                      />
                    </label>
                    <label className="block">
                      <span className="sr-only">Loại giao dịch</span>
                      <select value={filters.type} onChange={(e) => updateFilter("type", e.target.value as TransactionFilters["type"])} className={inputClass}>
                        <option value="">Thu và chi</option>
                        <option value="INCOME">Chỉ thu</option>
                        <option value="EXPENSE">Chỉ chi</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="sr-only">Tháng</span>
                      <input type="month" value={filters.month} onChange={(e) => updateFilter("month", e.target.value)} className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="sr-only">Sự kiện</span>
                      <select value={filters.eventId} onChange={(e) => updateFilter("eventId", e.target.value)} className={inputClass}>
                        <option value="">Mọi sự kiện</option>
                        <option value={NO_EVENT}>Không gắn sự kiện</option>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    {filtering ? (
                      <ActionButton
                        variant="ghost"
                        icon={<X className="h-4 w-4" />}
                        onClick={() => {
                          setFilters(EMPTY_FILTERS);
                          setPage(1);
                        }}
                      >
                        Xóa lọc
                      </ActionButton>
                    ) : null}
                  </div>

                  {sorted.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                      <Filter className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
                      <p className="mt-3 text-sm font-semibold text-slate-700">Không có giao dịch nào khớp bộ lọc</p>
                      <p className="mt-1 text-sm text-slate-500">Thử bỏ bớt điều kiện hoặc bấm &ldquo;Xóa lọc&rdquo;.</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative overflow-x-auto rounded-2xl border border-slate-200/80">
                        <table className="w-full min-w-[860px] text-left text-sm">
                          <thead className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
                            <tr>
                              <SortHeader label="Ngày" sortKey="date" sort={sort} onSort={toggleSort} />
                              <th scope="col" className="px-4 py-3 font-semibold">Loại</th>
                              <th scope="col" className="px-4 py-3 font-semibold">Mô tả</th>
                              <th scope="col" className="px-4 py-3 font-semibold">Danh mục</th>
                              <th scope="col" className="px-4 py-3 font-semibold">Sự kiện</th>
                              <SortHeader label="Số tiền (VND)" sortKey="amount" sort={sort} onSort={toggleSort} alignRight />
                              <th scope="col" className="px-4 py-3 font-semibold">Người tạo</th>
                              <th scope="col" className="px-4 py-3"><span className="sr-only">Thao tác</span></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {pageItems.map((item) => {
                              const meta = TYPE_META[item.type] ?? TYPE_META.EXPENSE;
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/80">
                                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">{formatIsoDate(item.transactionDate)}</td>
                                  <td className="px-4 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>{meta.label}</span>
                                  </td>
                                  <td className="max-w-xs px-4 py-3 text-slate-900">{item.description}</td>
                                  <td className="px-4 py-3 text-slate-600">{item.category || "—"}</td>
                                  <td className="px-4 py-3 text-slate-600">{item.eventTitle || "—"}</td>
                                  <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${meta.text}`}>
                                    {meta.sign}
                                    {money.format(Number(item.amount))}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{item.createdByName || "—"}</td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => void handleDelete(item)}
                                      disabled={deletingId === item.id}
                                      title="Xóa giao dịch"
                                      aria-label={`Xóa giao dịch ${item.description}`}
                                      className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {pageCount > 1 ? (
                        <nav aria-label="Phân trang giao dịch" className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                          <span className="tabular-nums">
                            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} / {sorted.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <ActionButton variant="outline" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
                              Trước
                            </ActionButton>
                            <span className="tabular-nums">
                              Trang {currentPage}/{pageCount}
                            </span>
                            <ActionButton variant="outline" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount}>
                              Sau
                            </ActionButton>
                          </div>
                        </nav>
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </PageFrame>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  alignRight,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
  alignRight?: boolean;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-2 font-semibold ${alignRight ? "text-right" : ""}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-1 py-1 text-xs font-semibold hover:text-[#18181B] ${active ? "text-[#18181B]" : ""}`}
      >
        {label}
        {active ? (
          sort.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" aria-hidden /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        ) : null}
      </button>
    </th>
  );
}
