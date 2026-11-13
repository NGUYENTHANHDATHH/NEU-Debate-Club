"use client";

import { FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import type { BudgetTone } from "@/components/dashboard/financeMetrics";
import { localIsoDate } from "@/components/dashboard/PublicationsPage";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { createTransaction, type ClubEvent, type FinanceTransaction, type TransactionType } from "@/lib/api";

export const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export const TYPE_META: Record<TransactionType, { label: string; badge: string; text: string; sign: string }> = {
  INCOME: { label: "Thu", badge: "bg-emerald-50 text-emerald-700", text: "text-emerald-700", sign: "+" },
  EXPENSE: { label: "Chi", badge: "bg-rose-50 text-[#BE123C]", text: "text-[#BE123C]", sign: "−" },
};

/** Màu theo mức dùng dự toán: xanh trong dự toán, hổ phách gần chạm, đỏ đã vượt. */
export const BUDGET_TONE: Record<BudgetTone, { bar: string; text: string; status: string }> = {
  ok: { bar: "bg-emerald-500", text: "text-emerald-700", status: "" },
  warn: { bar: "bg-amber-500", text: "text-amber-700", status: "sắp chạm" },
  over: { bar: "bg-[#BE123C]", text: "text-[#BE123C]", status: "vượt" },
  none: { bar: "bg-slate-300", text: "text-slate-500", status: "" },
};

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition aria-[invalid=true]:border-rose-400 focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10";

type FieldErrors = Partial<Record<"amount" | "description" | "transactionDate", string>>;

/**
 * Form thêm một khoản thu/chi vào sổ Tài chính. Dùng ở trang Tài chính và trong trang Quản lý sự kiện;
 * `fixedEvent` khóa sự kiện để mọi khoản ghi từ sự kiện tự xuất hiện ở Tài chính.
 */
export function TransactionForm({
  events = [],
  categories = [],
  fixedEvent,
  defaultType = "EXPENSE",
  onSaved,
  onCancel,
}: {
  events?: ClubEvent[];
  categories?: string[];
  fixedEvent?: { id: string; title: string };
  defaultType?: TransactionType;
  onSaved: (saved: FinanceTransaction) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [form, setForm] = useState({
    type: defaultType,
    amount: "",
    description: "",
    category: "",
    eventId: fixedEvent?.id ?? "",
    transactionDate: localIsoDate(new Date()),
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key in fieldErrors) setFieldErrors((current) => ({ ...current, [key]: undefined }));
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
    if (firstInvalid) return document.getElementById(`${id}-${firstInvalid}`)?.focus();
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
      toast.success(
        `Đã ghi khoản ${form.type === "INCOME" ? "thu" : "chi"} ${money.format(amount)}${
          fixedEvent ? " vào Tài chính" : ""
        }.`,
      );
      onSaved(saved);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Không thể thêm giao dịch.");
    } finally {
      setSaving(false);
    }
  }

  function errorText(key: keyof FieldErrors) {
    return fieldErrors[key] ? (
      <span id={`${id}-${key}-error`} className="block text-xs font-normal text-rose-700">
        {fieldErrors[key]}
      </span>
    ) : null;
  }

  function invalidProps(key: keyof FieldErrors) {
    return {
      id: `${id}-${key}`,
      "aria-invalid": Boolean(fieldErrors[key]),
      "aria-describedby": fieldErrors[key] ? `${id}-${key}-error` : undefined,
    };
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </p>
      ) : null}

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Loại</legend>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {(["INCOME", "EXPENSE"] as const).map((type) => (
            <label
              key={type}
              className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rose-300 ${
                form.type === type
                  ? type === "INCOME"
                    ? "bg-emerald-600 text-white"
                    : "bg-[#BE123C] text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name={`${id}-type`}
                value={type}
                checked={form.type === type}
                onChange={() => update("type", type)}
                className="sr-only"
              />
              {type === "INCOME" ? "Khoản thu" : "Khoản chi"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>
            Số tiền (VND) <span className="text-rose-500">*</span>
          </span>
          <input
            {...invalidProps("amount")}
            type="number"
            inputMode="numeric"
            min="1"
            step="1000"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            placeholder="0"
            className={inputClass}
          />
          {errorText("amount")}
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>
            Ngày giao dịch <span className="text-rose-500">*</span>
          </span>
          <input
            {...invalidProps("transactionDate")}
            type="date"
            value={form.transactionDate}
            onChange={(e) => update("transactionDate", e.target.value)}
            className={inputClass}
          />
          {errorText("transactionDate")}
        </label>
      </div>

      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        <span>
          Mô tả <span className="text-rose-500">*</span>
        </span>
        <input
          {...invalidProps("description")}
          type="text"
          maxLength={500}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder={fixedEvent ? "Ví dụ: Thuê hội trường, bán vé khán giả..." : "Ví dụ: Tài trợ giải Debate Open, in ấn poster..."}
          className={inputClass}
        />
        {errorText("description")}
      </label>

      <div className={`grid gap-4 ${fixedEvent ? "" : "md:grid-cols-2"}`}>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Danh mục</span>
          <input
            type="text"
            list={`${id}-categories`}
            maxLength={100}
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            placeholder="Ví dụ: Tài trợ, Địa điểm, In ấn"
            className={inputClass}
          />
          <datalist id={`${id}-categories`}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        {fixedEvent ? null : (
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
        )}
      </div>

      <div className="flex justify-end gap-3">
        <ActionButton variant="outline" onClick={onCancel}>
          Hủy
        </ActionButton>
        <ActionButton type="submit" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu giao dịch"}
        </ActionButton>
      </div>
    </form>
  );
}
