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

type FilterableTransaction = MetricTransaction &
  Pick<FinanceTransaction, "description" | "eventId" | "eventTitle" | "createdByName">;

/** "" = mọi sự kiện; NO_EVENT = giao dịch không gắn sự kiện. */
export const NO_EVENT = "__none__";

export type TransactionFilters = { query: string; type: "" | "INCOME" | "EXPENSE"; month: string; eventId: string };

export function filterTransactions<T extends FilterableTransaction>(items: T[], filters: TransactionFilters) {
  const query = filters.query.trim().toLocaleLowerCase("vi");
  return items.filter((item) => {
    if (filters.type && item.type !== filters.type) return false;
    if (filters.month && !item.transactionDate.startsWith(filters.month)) return false;
    if (filters.eventId === NO_EVENT ? item.eventId : filters.eventId && item.eventId !== filters.eventId) return false;
    if (!query) return true;
    return [item.description, item.category, item.eventTitle, item.createdByName]
      .some((field) => field?.toLocaleLowerCase("vi").includes(query));
  });
}

/** Thu, chi, chênh lệch theo từng sự kiện có giao dịch; sự kiện chi nhiều nhất lên đầu. */
export function summarizeByEvent(items: FilterableTransaction[]) {
  const byEvent = new Map<string, { eventId: string; title: string; income: number; expense: number; count: number }>();
  for (const item of items) {
    if (!item.eventId) continue;
    const bucket = byEvent.get(item.eventId) ?? {
      eventId: item.eventId,
      title: item.eventTitle || "Sự kiện không tên",
      income: 0,
      expense: 0,
      count: 0,
    };
    const amount = Number(item.amount) || 0;
    if (item.type === "INCOME") bucket.income += amount;
    else bucket.expense += amount;
    bucket.count += 1;
    byEvent.set(item.eventId, bucket);
  }
  return [...byEvent.values()]
    .map((row) => ({ ...row, net: row.income - row.expense }))
    .sort((a, b) => b.expense - a.expense || b.income - a.income);
}
