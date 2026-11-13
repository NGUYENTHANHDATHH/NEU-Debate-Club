import type { FinanceTransaction } from "@/lib/api";

// Thuần logic (không import runtime) để FinancePage và test node dùng chung.

type MetricTransaction = Pick<FinanceTransaction, "type" | "amount" | "category" | "transactionDate">;

export const NO_CATEGORY = "Chưa phân loại";

/** monthKey dạng yyyy-MM; transactionDate dạng yyyy-MM-dd. */
export function summarizeTransactions(items: MetricTransaction[], monthKey: string) {
  let balance = 0;
  let monthIncome = 0;
  let monthExpense = 0;
  let monthCount = 0;
  const byCategory = new Map<string, { income: number; expense: number }>();
  for (const item of items) {
    const amount = Number(item.amount) || 0;
    const isIncome = item.type === "INCOME";
    balance += isIncome ? amount : -amount;
    if (item.transactionDate.startsWith(monthKey)) {
      monthCount += 1;
      if (isIncome) monthIncome += amount;
      else monthExpense += amount;
    }
    const key = item.category?.trim() || NO_CATEGORY;
    const bucket = byCategory.get(key) ?? { income: 0, expense: 0 };
    if (isIncome) bucket.income += amount;
    else bucket.expense += amount;
    byCategory.set(key, bucket);
  }
  const categories = [...byCategory.entries()]
    .map(([name, totals]) => ({ name, ...totals }))
    .sort((a, b) => b.income + b.expense - (a.income + a.expense));
  const maxValue = Math.max(1, ...categories.map((c) => Math.max(c.income, c.expense)));
  return { balance, monthIncome, monthExpense, monthCount, categories, maxValue };
}
