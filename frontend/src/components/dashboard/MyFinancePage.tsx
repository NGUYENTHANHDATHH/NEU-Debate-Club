"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleCheck, QrCode, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PayosDialog } from "@/components/dashboard/PayosDialog";
import { StatGrid } from "@/components/dashboard/DashboardWidgets";
import { formatIsoDate } from "@/components/dashboard/PublicationsPage";
import { TYPE_META, money } from "@/components/dashboard/TransactionForm";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import { fetchMyTransactions, refreshPayosPayment, type FinanceTransaction } from "@/lib/api";

/** Công cụ cho mọi thành viên: khoản còn thiếu và lịch sử thu chi gắn với chính mình. */
export function MyFinancePage() {
  const [items, setItems] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<FinanceTransaction | null>(null);
  // PayOS đưa về ?pay=<id> sau khi thanh toán trên trang của họ: hỏi lại trước khi tải, khỏi chờ webhook.
  const returnedFrom = useSearchParams().get("pay");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (returnedFrom) await refreshPayosPayment(returnedFrom).catch(() => false);
      setItems(await fetchMyTransactions());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải thu chi của bạn.");
    } finally {
      setLoading(false);
    }
  }, [returnedFrom]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePaid = useCallback(() => {
    void fetchMyTransactions().then(setItems).catch(() => undefined);
  }, []);

  const owedItems = useMemo(() => items.filter((tx) => !tx.paid), [items]);
  const history = useMemo(() => items.filter((tx) => tx.paid), [items]);
  const sum = (list: FinanceTransaction[]) => list.reduce((total, tx) => total + Number(tx.amount), 0);
  const owed = sum(owedItems);
  const paid = sum(history.filter((tx) => tx.type === "INCOME"));
  const received = sum(history.filter((tx) => tx.type === "EXPENSE"));
  const show = (value: number) => (loading ? "…" : error ? "—" : money.format(value));

  return (
    <PageFrame
      title="Thu chi của tôi"
      description="Các khoản bạn cần đóng, đã đóng cho CLB và CLB đã chi cho bạn. Chỉ bạn và người quản lý Tài chính thấy."
      aside={
        <StatGrid
          items={[
            {
              label: "Còn thiếu",
              value: show(owed),
              note: owedItems.length ? `${owedItems.length} khoản cần đóng` : "Không có khoản nào cần đóng",
              tone: owed ? "amber" : undefined,
            },
            { label: "Đã đóng", value: show(paid), note: "Quỹ và các khoản bạn đã nộp" },
            { label: "Đã nhận", value: show(received), note: "Hoàn ứng, thưởng CLB chi cho bạn" },
          ]}
        />
      }
    >
      {loading ? (
        <p role="status" className="py-12 text-center text-sm text-[#71717A]">Đang tải thu chi của bạn…</p>
      ) : error ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>
          <ActionButton variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
            Thử lại
          </ActionButton>
        </div>
      ) : (
        <>
          <Section
            title="Khoản còn thiếu"
            subtitle="Bấm “Thanh toán QR” để chuyển khoản qua PayOS, hệ thống tự ghi nhận khi tiền vào. Hoặc nộp trực tiếp cho người quản lý Tài chính."
          >
            {owedItems.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-emerald-700">
                <CircleCheck className="h-4 w-4" aria-hidden />
                Bạn không còn khoản nào cần đóng.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {owedItems.map((tx) => (
                  <li key={tx.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-medium text-[#18181B]">{tx.description}</span>
                      <span className="text-xs text-[#71717A]">
                        Ghi ngày {formatIsoDate(tx.transactionDate)}
                        {tx.category ? ` · ${tx.category}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="font-semibold tabular-nums text-amber-700">{money.format(Number(tx.amount))}</span>
                      <ActionButton icon={<QrCode className="h-4 w-4" />} onClick={() => setPaying(tx)}>
                        Thanh toán QR
                      </ActionButton>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Lịch sử giao dịch" subtitle={`${history.length} giao dịch đã hoàn tất, mới nhất trước.`}>
            {history.length === 0 ? (
              <p className="text-sm text-[#71717A]">Chưa có giao dịch nào gắn với bạn.</p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs text-slate-500">
                    <tr>
                      <th scope="col" className="py-2 pr-4 font-semibold">Ngày</th>
                      <th scope="col" className="px-4 py-2 font-semibold">Loại</th>
                      <th scope="col" className="px-4 py-2 font-semibold">Mô tả</th>
                      <th scope="col" className="px-4 py-2 font-semibold">Danh mục</th>
                      <th scope="col" className="py-2 pl-4 text-right font-semibold">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((tx) => {
                      const meta = TYPE_META[tx.type] ?? TYPE_META.EXPENSE;
                      return (
                        <tr key={tx.id}>
                          <td className="whitespace-nowrap py-3 pr-4 tabular-nums text-slate-600">{formatIsoDate(tx.transactionDate)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>
                              {tx.type === "INCOME" ? "Bạn đóng" : "CLB chi"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-900">{tx.description}</td>
                          <td className="px-4 py-3 text-slate-600">{tx.category || "—"}</td>
                          <td className={`whitespace-nowrap py-3 pl-4 text-right font-semibold tabular-nums ${meta.text}`}>
                            {money.format(Number(tx.amount))}
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
      <PayosDialog key={paying?.id ?? "none"} item={paying} onClose={() => setPaying(null)} onPaid={handlePaid} />
    </PageFrame>
  );
}
