"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { summarizeTransactions } from "@/components/dashboard/financeMetrics";
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
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

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
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
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

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt),
      ),
    [items],
  );

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
    setForm({ type: "INCOME", amount: "", description: "", category: "", eventId: "", transactionDate: today });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return setFormError("Số tiền phải lớn hơn 0.");
    if (!form.description.trim()) return setFormError("Vui lòng nhập mô tả giao dịch.");
    if (!form.transactionDate) return setFormError("Vui lòng chọn ngày giao dịch.");
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
      toast.success("Đã thêm giao dịch.");
      closeForm();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Không thể thêm giao dịch.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: FinanceTransaction) {
    if (!window.confirm(`Xóa giao dịch "${item.description}" (${money.format(Number(item.amount))})?`)) return;
    setDeletingId(item.id);
    try {
      await deleteTransaction(item.id);
      setItems((current) => current.filter((tx) => tx.id !== item.id));
      toast.success("Đã xóa giao dịch.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Không thể xóa giao dịch.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageFrame
      eyebrow="Tài chính"
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  type="number"
                  required
                  min="1"
                  step="1000"
                  value={form.amount}
                  onChange={(e) => update("amount", e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>
                  Ngày giao dịch <span className="text-rose-500">*</span>
                </span>
                <input type="date" required value={form.transactionDate} onChange={(e) => update("transactionDate", e.target.value)} className={inputClass} />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              <span>
                Mô tả <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                required
                maxLength={500}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Ví dụ: Tài trợ giải Debate Open, in ấn poster..."
                className={inputClass}
              />
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
              { label: "Tổng quỹ", value: money.format(summary.balance), note: "Tổng thu trừ tổng chi", tone: "emerald" },
              { label: "Thu tháng này", value: money.format(summary.monthIncome), tone: "slate" },
              { label: "Chi tháng này", value: money.format(summary.monthExpense), tone: "rose" },
              { label: "Giao dịch tháng này", value: String(summary.monthCount), tone: "amber" },
            ]}
          />

          <Section title="Thu chi theo danh mục" subtitle="Tổng từ trước đến nay">
            {summary.categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Chưa có dữ liệu.</p>
            ) : (
              <div className="space-y-4">
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
                        <span className="w-32 text-right font-medium text-slate-700">{money.format(category[kind])}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Giao dịch" subtitle={`${items.length} giao dịch`}>
            {sorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                <Wallet className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-base font-semibold text-slate-700">Chưa có giao dịch nào</p>
                <p className="mt-1 text-sm text-slate-400">Bấm &ldquo;Thêm giao dịch&rdquo; để ghi khoản thu chi đầu tiên.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Ngày</th>
                      <th className="px-4 py-3 font-semibold">Loại</th>
                      <th className="px-4 py-3 font-semibold">Mô tả</th>
                      <th className="px-4 py-3 font-semibold">Danh mục</th>
                      <th className="px-4 py-3 font-semibold">Sự kiện</th>
                      <th className="px-4 py-3 text-right font-semibold">Số tiền</th>
                      <th className="px-4 py-3 font-semibold">Người tạo</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sorted.map((item) => {
                      const meta = TYPE_META[item.type] ?? TYPE_META.EXPENSE;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatIsoDate(item.transactionDate)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>{meta.label}</span>
                          </td>
                          <td className="max-w-xs px-4 py-3 text-slate-900">{item.description}</td>
                          <td className="px-4 py-3 text-slate-600">{item.category || "—"}</td>
                          <td className="px-4 py-3 text-slate-600">{item.eventTitle || "—"}</td>
                          <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${item.type === "INCOME" ? "text-emerald-700" : "text-[#E11D48]"}`}>
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
                              aria-label="Xóa giao dịch"
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
            )}
          </Section>
        </>
      )}
    </PageFrame>
  );
}
