// Chạy: node --test src/components/dashboard/financeMetrics.test.mjs (Node >= 23.6 tự bỏ kiểu TS).
import assert from "node:assert/strict";
import test from "node:test";
import { NO_CATEGORY, NO_EVENT, budgetUsage, eventBudgetRows, filterTransactions, summarizeByEvent, summarizeTransactions } from "./financeMetrics.ts";

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

const tx = (over) => ({
  type: "EXPENSE",
  amount: 100,
  category: null,
  transactionDate: "2026-11-01",
  description: "",
  eventId: null,
  eventTitle: null,
  createdByName: null,
  ...over,
});

test("filterTransactions lọc theo loại, tháng, sự kiện và từ khóa", () => {
  const items = [
    tx({ type: "INCOME", description: "Tài trợ Open", eventId: "e1", eventTitle: "Debate Open" }),
    tx({ description: "In poster", transactionDate: "2026-10-05", eventId: "e1", eventTitle: "Debate Open" }),
    tx({ description: "Văn phòng phẩm", category: "Văn phòng" }),
  ];
  const all = { query: "", type: "", month: "", eventId: "" };
  assert.equal(filterTransactions(items, all).length, 3);
  assert.equal(filterTransactions(items, { ...all, type: "INCOME" }).length, 1);
  assert.equal(filterTransactions(items, { ...all, month: "2026-10" })[0].description, "In poster");
  assert.equal(filterTransactions(items, { ...all, eventId: "e1" }).length, 2);
  assert.equal(filterTransactions(items, { ...all, eventId: NO_EVENT })[0].description, "Văn phòng phẩm");
  assert.equal(filterTransactions(items, { ...all, query: "  VĂN phòng " }).length, 1);
  assert.equal(filterTransactions(items, { ...all, query: "debate open" }).length, 2);
});

test("summarizeByEvent cộng thu chi theo sự kiện, bỏ giao dịch không gắn sự kiện", () => {
  const rows = summarizeByEvent([
    tx({ type: "INCOME", amount: 500, eventId: "e1", eventTitle: "Open" }),
    tx({ amount: 200, eventId: "e1", eventTitle: "Open" }),
    tx({ amount: 900, eventId: "e2", eventTitle: "Workshop" }),
    tx({ amount: 50 }),
  ]);
  assert.deepEqual(
    rows.map((r) => [r.eventId, r.income, r.expense, r.net, r.count]),
    [
      ["e2", 0, 900, -900, 1],
      ["e1", 500, 200, 300, 2],
    ],
  );
});

test("budgetUsage phân loại dưới, gần và vượt dự toán", () => {
  assert.deepEqual(budgetUsage(500, 1000), { ratio: 0.5, remaining: 500, tone: "ok" });
  assert.equal(budgetUsage(800, 1000).tone, "warn");
  assert.equal(budgetUsage(1000, 1000).tone, "warn");
  assert.deepEqual(budgetUsage(1200, 1000), { ratio: 1.2, remaining: -200, tone: "over" });
  assert.deepEqual(budgetUsage(300, 0), { ratio: null, remaining: null, tone: "none" });
});

test("eventBudgetRows ghép dự toán với thu chi, vượt dự toán lên đầu", () => {
  const rows = eventBudgetRows(
    [
      tx({ amount: 900, eventId: "a", eventTitle: "A" }),
      tx({ amount: 1500, eventId: "b", eventTitle: "B" }),
      tx({ type: "INCOME", amount: 400, eventId: "b", eventTitle: "B" }),
      tx({ amount: 50, eventId: "gone", eventTitle: "Đã xóa" }),
    ],
    [
      { id: "a", title: "A", budget: 2000 },
      { id: "b", title: "B", budget: "1000" },
      { id: "c", title: "C chưa chi", budget: 500 },
      { id: "d", title: "D không dự toán", budget: 0 },
    ],
  );
  assert.deepEqual(
    rows.map((r) => [r.eventId, r.usage.tone, r.expense, r.income, r.net]),
    [
      ["b", "over", 1500, 400, -1100],
      ["a", "ok", 900, 0, -900],
      ["c", "ok", 0, 0, 0],
      ["gone", "none", 50, 0, -50],
    ],
  );
  assert.equal(rows.find((r) => r.eventId === "gone").title, "Đã xóa");
});
