// Chạy: node --test src/components/dashboard/financeMetrics.test.mjs (Node >= 23.6 tự bỏ kiểu TS).
import assert from "node:assert/strict";
import test from "node:test";
import { NO_CATEGORY, summarizeTransactions } from "./financeMetrics.ts";

test("summarizeTransactions tính số dư, thu chi tháng và nhóm theo danh mục", () => {
  const summary = summarizeTransactions(
    [
      { type: "INCOME", amount: 5_000_000, category: "Tài trợ", transactionDate: "2026-11-02" },
      { type: "EXPENSE", amount: 1_200_000, category: " Sự kiện ", transactionDate: "2026-11-10" },
      { type: "EXPENSE", amount: 300_000, category: null, transactionDate: "2026-10-31" },
      { type: "INCOME", amount: 1_000_000, category: "Tài trợ", transactionDate: "2026-10-01" },
    ],
    "2026-11",
  );
  assert.equal(summary.balance, 4_500_000);
  assert.equal(summary.monthIncome, 5_000_000);
  assert.equal(summary.monthExpense, 1_200_000);
  assert.equal(summary.monthCount, 2);
  assert.deepEqual(
    summary.categories.map((c) => [c.name, c.income, c.expense]),
    [
      ["Tài trợ", 6_000_000, 0],
      ["Sự kiện", 0, 1_200_000],
      [NO_CATEGORY, 0, 300_000],
    ],
  );
  assert.equal(summary.maxValue, 6_000_000);
  assert.equal(summarizeTransactions([], "2026-11").maxValue, 1);
});
