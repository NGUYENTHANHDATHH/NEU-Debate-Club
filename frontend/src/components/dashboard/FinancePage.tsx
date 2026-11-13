"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Filter, Plus, RefreshCw, Search, Trash2, Wallet, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  NO_EVENT,
  filterTransactions,
  summarizeByEvent,
  summarizeTransactions,
  type TransactionFilters,
} from "@/components/dashboard/financeMetrics";
import { StatGrid } from "@/components/dashboard/DashboardWidgets";
import { formatIsoDate, localIsoDate } from "@/components/dashboard/PublicationsPage";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import {
  createTransaction,
  deleteTransaction,
  fetchEvents,
  fetchTransactions,
  type ClubEvent,
  type FinanceTransaction,
  type TransactionType,
} from "@/lib/api";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition aria-[invalid=true]:border-rose-400 focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const PAGE_SIZE = 20;
const EMPTY_FILTERS: TransactionFilters = { query: "", type: "", month: "", eventId: "" };
type SortKey = "date" | "amount";
type FieldErrors = Partial<Record<"amount" | "description" | "transactionDate", string>>;

const TYPE_META: Record<TransactionType, { label: string; badge: string; sign: string }> = {
  INCOME: { label: "Thu", badge: "bg-emerald-50 text-emerald-700", sign: "+" },
  EXPENSE: { label: "Chi", badge: "bg-rose-50 text-[#E11D48]", sign: "−" },
};

export function FinancePage() {
  const [today] = useState(() => localIsoDate(new Date()));
  const [items, setItems] = useState<FinanceTransaction[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  // ?new=1 (từ thao tác nhanh) mở sẵn form.
  const [open, setOpen] = useState(() => searchParams.has("new"));
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    type: "INCOME" as TransactionType,
    amount: "",
    description: "",
    category: "",
    eventId: "",
    transactionDate: today,
  });

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

  const byEvent = useMemo(() => summarizeByEvent(items), [items]);
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

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function closeForm() {
    setOpen(false);
    setFormError("");
    setFieldErrors({});
    setForm({ type: "INCOME", amount: "", description: "", category: "", eventId: "", transactionDate: today });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    const nextErrors: FieldErrors = {};
    if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = "Nhập số tiền lớn hơn 0.";
    if (!form.description.trim()) nextErrors.description = "Nhập mô tả để người khác biết khoản này là gì.";
    if (!form.transactionDate) nextErrors.transactionDate = "Chọn ngày phát sinh giao dịch.";
    setFieldErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) return document.getElementById(`finance-${firstInvalid}`)?.focus();
    setSaving(true);
    setFormError("");
    try {
      const saved = await createTransaction({
        type: form.type,
        amount,
        description: form.description.trim(),
        category: form.category.trim() || null,
        eventId: form.eventId || null,
        transactionDate: form.transactionDate,
      });
      setItems((current) => [saved, ...current]);
      toast.success(`Đã thêm khoản ${form.type === "INCOME" ? "thu" : "chi"} ${money.format(amount)}.`);
      closeForm();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Không thể thêm giao dịch.");
    } finally {
      setSaving(false);
    }
  }

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
          action={
            <button type="button" onClick={closeForm} aria-label="Đóng" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          }
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError ? (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>Loại</span>
                <select value={form.type} onChange={(e) => update("type", e.target.value as TransactionType)} className={inputClass}>
                  <option value="INCOME">Thu</option>
                  <option value="EXPENSE">Chi</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>
                  Số tiền (VND) <span className="text-rose-500">*</span>
                </span>
                <input
                  id="finance-amount"
                  aria-invalid={Boolean(fieldErrors.amount)}
                  aria-describedby={fieldErrors.amount ? "finance-amount-error" : undefined}
                  type="number"
                  inputMode="numeric"
                  required
                  min="1"
                  step="1000"
                  value={form.amount}
                  onChange={(e) => update("amount", e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
                {fieldErrors.amount ? (
                  <span id="finance-amount-error" className="block text-xs font-normal text-rose-700">{fieldErrors.amount}</span>
                ) : null}
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>
                  Ngày giao dịch <span className="text-rose-500">*</span>
                </span>
                <input
                  id="finance-transactionDate"
                  aria-invalid={Boolean(fieldErrors.transactionDate)}
                  aria-describedby={fieldErrors.transactionDate ? "finance-transactionDate-error" : undefined}
                  type="date"
                  required
                  value={form.transactionDate}
                  onChange={(e) => update("transactionDate", e.target.value)}
                  className={inputClass}
                />
                {fieldErrors.transactionDate ? (
                  <span id="finance-transactionDate-error" className="block text-xs font-normal text-rose-700">{fieldErrors.transactionDate}</span>
                ) : null}
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              <span>
                Mô tả <span className="text-rose-500">*</span>
              </span>
              <input
                id="finance-description"
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? "finance-description-error" : undefined}
                type="text"
                required
                maxLength={500}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Ví dụ: Tài trợ giải Debate Open, in ấn poster..."
                className={inputClass}
              />
              {fieldErrors.description ? (
                <span id="finance-description-error" className="block text-xs font-normal text-rose-700">{fieldErrors.description}</span>
              ) : null}
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>Danh mục</span>
                <input
                  type="text"
                  list="finance-categories"
                  maxLength={100}
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="Ví dụ: Tài trợ, Sự kiện, Văn phòng phẩm"
                  className={inputClass}
                />
                <datalist id="finance-categories">
                  {existingCategories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>Sự kiện liên quan</span>
                <select value={form.eventId} onChange={(e) => update("eventId", e.target.value)} className={inputClass}>
                  <option value="">Không gắn sự kiện</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <ActionButton variant="outline" onClick={closeForm}>
                Hủy
              </ActionButton>
              <ActionButton type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu giao dịch"}
              </ActionButton>
            </div>
          </form>
        </Section>
      ) : null}

      {loading ? (
        <div role="status" className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#E11D48]" />
          <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu tài chính...</p>
        </div>
      ) : error ? null : (
        <>
          <StatGrid
            items={[
              { label: "Tổng quỹ", value: money.format(summary.balance), note: "Tổng thu trừ tổng chi, từ trước đến nay" },
              { label: "Thu tháng này", value: money.format(summary.monthIncome), note: `Tháng ${today.slice(5, 7)}/${today.slice(0, 4)}` },
              { label: "Chi tháng này", value: money.format(summary.monthExpense), note: `Tháng ${today.slice(5, 7)}/${today.slice(0, 4)}` },
              { label: "Giao dịch tháng này", value: String(summary.monthCount), note: `Trên tổng ${items.length} giao dịch` },
            ]}
          />

          <Section title="Theo sự kiện" subtitle="Thu, chi và chênh lệch của từng sự kiện có gắn giao dịch (VND).">
            {byEvent.length === 0 ? (
              <p className="py-4 text-sm text-[#71717A]">
                Chưa có giao dịch nào gắn sự kiện. Khi thêm giao dịch, chọn &ldquo;Sự kiện liên quan&rdquo; để theo dõi ở đây.
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm tabular-nums">
                  <thead className="border-b border-slate-200 text-xs text-slate-500">
                    <tr>
                      <th scope="col" className="py-2 pr-4 font-semibold">Sự kiện</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Thu</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Chi</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Chênh lệch</th>
                      <th scope="col" className="py-2 pl-4"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {byEvent.map((row) => (
                      <tr key={row.eventId}>
                        <td className="py-2.5 pr-4 font-medium text-[#18181B]">
                          {row.title}
                          <span className="ml-2 text-xs font-normal text-slate-500">{row.count} giao dịch</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-700">{money.format(row.income)}</td>
                        <td className="px-4 py-2.5 text-right text-[#BE123C]">{money.format(row.expense)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${row.net < 0 ? "text-[#BE123C]" : "text-emerald-700"}`}>
                          {row.net < 0 ? "−" : "+"}
                          {money.format(Math.abs(row.net))}
                        </td>
                        <td className="py-2.5 pl-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setFilters({ ...EMPTY_FILTERS, eventId: row.eventId });
                              setPage(1);
                              document.getElementById("finance-transactions")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-[#BE123C] hover:bg-rose-50"
                          >
                            Xem giao dịch
                          </button>
                        </td>
                      </tr>
                    ))}
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
                                  <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${item.type === "INCOME" ? "text-emerald-700" : "text-[#BE123C]"}`}>
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
