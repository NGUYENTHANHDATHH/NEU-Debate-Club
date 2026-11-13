"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Plus, Receipt, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { budgetUsage } from "@/components/dashboard/financeMetrics";
import { formatIsoDate } from "@/components/dashboard/PublicationsPage";
import { BUDGET_TONE, TYPE_META, TransactionForm, money } from "@/components/dashboard/TransactionForm";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { ROUTES } from "@/constants/routes";
import { deleteTransaction, type ClubEvent, type FinanceTransaction } from "@/lib/api";

/** Thu chi của một sự kiện. Mỗi khoản là một giao dịch Tài chính gắn sự kiện, nên hiện ở cả hai trang. */
export function EventFinanceDialog({
  event,
  transactions,
  categories,
  canOpenFinance,
  onClose,
  onAdded,
  onDeleted,
}: {
  event: ClubEvent | null;
  transactions: FinanceTransaction[];
  categories: string[];
  canOpenFinance: boolean;
  onClose: () => void;
  onAdded: (saved: FinanceTransaction) => void;
  onDeleted: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const rows = event
    ? transactions
        .filter((tx) => tx.eventId === event.id)
        .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt))
    : [];
  const income = rows.filter((tx) => tx.type === "INCOME").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expense = rows.filter((tx) => tx.type === "EXPENSE").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const budget = Number(event?.budget) || 0;
  const usage = budgetUsage(expense, budget);
  const tone = BUDGET_TONE[usage.tone];
  const pct = Math.round((usage.ratio ?? 0) * 100);

  async function handleDelete(tx: FinanceTransaction) {
    if (!window.confirm(`Xóa khoản "${tx.description}" (${money.format(Number(tx.amount))})?\nKhoản này cũng bị xóa khỏi Tài chính và không thể hoàn tác.`)) return;
    setDeletingId(tx.id);
    try {
      await deleteTransaction(tx.id);
      onDeleted(tx.id);
      toast.success(`Đã xóa khoản "${tx.description}".`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Không thể xóa khoản thu chi.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog.Root
      open={event !== null}
      onOpenChange={(open) => {
        if (!open) {
          setAdding(false);
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40" />
        <Dialog.Content className="fixed inset-x-4 top-[5vh] z-50 mx-auto flex max-h-[90vh] max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_-16px_rgba(0,0,0,0.35)] outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-lg font-semibold text-[#18181B]">Thu chi · {event?.title}</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-slate-500">
                Mọi khoản ghi ở đây tự cập nhật vào trang Tài chính.
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Đóng" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto px-6 py-5">
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-500">Dự toán</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-slate-800">{budget ? money.format(budget) : "Chưa đặt"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Đã chi</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-[#BE123C]">{money.format(expense)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Đã thu</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-emerald-700">{money.format(income)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{usage.remaining !== null && usage.remaining < 0 ? "Vượt dự toán" : "Còn trong dự toán"}</dt>
                <dd className={`mt-0.5 font-semibold tabular-nums ${tone.text}`}>
                  {usage.remaining === null ? "—" : money.format(Math.abs(usage.remaining))}
                </dd>
              </div>
            </dl>
            {usage.ratio !== null ? (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <p className={`mt-1 text-xs font-medium ${tone.text}`}>
                  Đã chi {pct}% dự toán{tone.status ? ` · ${tone.status} dự toán` : ""}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Đặt &ldquo;Ngân sách&rdquo; khi sửa sự kiện để so sánh với số thực chi.</p>
            )}

            <div className="mt-5 border-t border-slate-100 pt-4">
              {adding && event ? (
                <TransactionForm
                  fixedEvent={{ id: event.id, title: event.title }}
                  categories={categories}
                  onSaved={(saved) => {
                    onAdded(saved);
                    setAdding(false);
                  }}
                  onCancel={() => setAdding(false)}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#18181B]">Các khoản đã ghi ({rows.length})</h3>
                  <ActionButton icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>
                    Thêm khoản thu/chi
                  </ActionButton>
                </div>
              )}
            </div>

            {!adding ? (
              rows.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
                  <p className="mt-2 text-sm text-slate-600">Chưa ghi khoản thu chi nào cho sự kiện này.</p>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {rows.map((tx) => {
                    const meta = TYPE_META[tx.type] ?? TYPE_META.EXPENSE;
                    return (
                      <li key={tx.id} className="flex items-center gap-3 py-2.5 text-sm">
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>{meta.label}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-slate-900">{tx.description}</p>
                          <p className="text-xs text-slate-500">
                            {formatIsoDate(tx.transactionDate)}
                            {tx.category ? ` · ${tx.category}` : ""}
                            {tx.createdByName ? ` · ${tx.createdByName}` : ""}
                          </p>
                        </div>
                        <span className={`shrink-0 font-semibold tabular-nums ${meta.text}`}>
                          {meta.sign}
                          {money.format(Number(tx.amount))}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleDelete(tx)}
                          disabled={deletingId === tx.id}
                          aria-label={`Xóa khoản ${tx.description}`}
                          className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : null}

            {canOpenFinance ? (
              <Link
                href={ROUTES.finance}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#BE123C] hover:underline"
              >
                Mở trang Tài chính
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
