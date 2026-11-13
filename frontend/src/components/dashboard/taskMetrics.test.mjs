// Chạy: node --test src/components/dashboard/taskMetrics.test.mjs (Node >= 23.6 tự bỏ kiểu TS).
import assert from "node:assert/strict";
import test from "node:test";
import { groupByStatus, isOverdue, onTimeStats, weeklyCompleted } from "./taskMetrics.ts";

const now = new Date(2026, 10, 13, 12).getTime(); // thứ Sáu 13/11/2026, giờ máy

test("onTimeStats chỉ tính task đã xong có deadline", () => {
  const stats = onTimeStats([
    { status: "DONE", deadline: "2026-11-10T00:00:00Z", completedAt: "2026-11-09T00:00:00Z" },
    { status: "done", deadline: "2026-11-10T00:00:00Z", completedAt: "2026-11-11T00:00:00Z" },
    { status: "DONE", deadline: null, completedAt: "2026-11-11T00:00:00Z" },
    { status: "TODO", deadline: "2026-11-10T00:00:00Z", completedAt: null },
  ]);
  assert.deepEqual(stats, { onTime: 1, total: 2, rate: 50 });
  assert.equal(onTimeStats([]).rate, null);
});

test("isOverdue bỏ qua task đã xong", () => {
  assert.equal(isOverdue({ status: "IN_PROGRESS", deadline: "2026-11-01T00:00:00Z", completedAt: null }, now), true);
  assert.equal(isOverdue({ status: "DONE", deadline: "2026-11-01T00:00:00Z", completedAt: null }, now), false);
});

test("weeklyCompleted xếp task vào đúng tuần thứ Hai", () => {
  const at = (day) => ({ status: "DONE", deadline: null, completedAt: new Date(2026, 10, day, 9).toISOString() });
  const weeks = weeklyCompleted([at(9), at(13), at(8), at(1), { ...at(12), status: "TODO" }], now);
  assert.equal(weeks.length, 8);
  assert.equal(new Date(weeks[7].start).getDate(), 9); // tuần này bắt đầu thứ Hai 9/11
  assert.deepEqual(weeks.slice(5).map((week) => week.count), [1, 1, 2]); // CN 1/11 và CN 8/11 thuộc tuần trước đó
});

test("groupByStatus gom và sắp xếp theo tổng", () => {
  const rows = groupByStatus(
    [
      { status: "DONE", deadline: null, completedAt: null, department: "A" },
      { status: "TODO", deadline: null, completedAt: null, department: "B" },
      { status: "IN_PROGRESS", deadline: null, completedAt: null, department: "B" },
    ],
    (task) => task.department,
  );
  assert.deepEqual(rows[0], { key: "B", TODO: 1, IN_PROGRESS: 1, DONE: 0, total: 2 });
});
