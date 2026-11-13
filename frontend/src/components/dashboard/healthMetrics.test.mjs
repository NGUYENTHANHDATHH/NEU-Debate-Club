// Chạy: node --test src/components/dashboard/healthMetrics.test.mjs (Node >= 23.6 tự bỏ kiểu TS).
import assert from "node:assert/strict";
import test from "node:test";
import {
  activityCalendar,
  heatLevel,
  loginTiers,
  monthlyTotals,
  overdueAging,
  seasonRetention,
  weeklyDelivery,
  workload,
} from "./healthMetrics.ts";

// Thứ Sáu 13/11/2026, 12h giờ địa phương.
const NOW = new Date(2026, 10, 13, 12).getTime();
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).toISOString();

test("weeklyDelivery tách đúng hạn, trễ hạn, không deadline theo tuần", () => {
  const weeks = weeklyDelivery(
    [
      { status: "DONE", deadline: at(2026, 11, 12), completedAt: at(2026, 11, 11) }, // tuần này, đúng hạn
      { status: "done", deadline: at(2026, 11, 3), completedAt: at(2026, 11, 5) }, // tuần trước, trễ
      { status: "DONE", deadline: null, completedAt: at(2026, 11, 9, 1) }, // thứ Hai tuần này
      { status: "IN_PROGRESS", deadline: null, completedAt: null },
      { status: "DONE", deadline: null, completedAt: at(2025, 1, 1) }, // ngoài cửa sổ
    ],
    NOW,
    4,
  );
  assert.equal(weeks.length, 4);
  assert.equal(new Date(weeks[3].start).getDay(), 1);
  assert.deepEqual(weeks.map((w) => [w.onTime, w.late, w.noDeadline]), [
    [0, 0, 0],
    [0, 0, 0],
    [0, 1, 0],
    [1, 0, 1],
  ]);
});

test("overdueAging gom task quá hạn theo số ngày trễ, bỏ task xong hoặc chưa tới hạn", () => {
  const buckets = overdueAging(
    [
      { status: "TODO", deadline: at(2026, 11, 12), completedAt: null }, // 1 ngày
      { status: "TODO", deadline: at(2026, 11, 6), completedAt: null }, // 7 ngày
      { status: "IN_PROGRESS", deadline: at(2026, 10, 1), completedAt: null }, // > 30
      { status: "DONE", deadline: at(2026, 10, 1), completedAt: at(2026, 10, 2) },
      { status: "TODO", deadline: at(2026, 11, 20), completedAt: null },
      { status: "TODO", deadline: null, completedAt: null },
    ],
    NOW,
  );
  assert.deepEqual(buckets.map((b) => b.count), [1, 1, 0, 0, 1]);
});

test("loginTiers chỉ đếm thành viên hoạt động", () => {
  const tiers = loginTiers(
    [
      { active: true, lastLoginAt: at(2026, 11, 10) },
      { active: true, lastLoginAt: at(2026, 10, 25) },
      { active: true, lastLoginAt: at(2026, 8, 1) },
      { active: true, lastLoginAt: null },
      { active: false, lastLoginAt: at(2026, 11, 12) },
    ],
    NOW,
  );
  assert.deepEqual(tiers.map((t) => [t.key, t.count]), [["week", 1], ["month", 1], ["stale", 1], ["never", 1]]);
});

test("workload đếm task mở theo người, gộp 5+ và liệt kê người giữ nhiều nhất", () => {
  const tasks = [
    ...Array.from({ length: 6 }, () => ({ status: "TODO", deadline: null, assignedToId: "A" })),
    { status: "IN_PROGRESS", deadline: null, assignedToId: "b" },
    { status: "DONE", deadline: null, assignedToId: "b" },
    { status: "TODO", deadline: null, assignedToId: null },
    { status: "TODO", deadline: null, assignedToId: "z-inactive" },
  ];
  const members = [
    { id: "a", fullName: "An", active: true, department: "NOI_DUNG" },
    { id: "b", fullName: "Bình", active: true, department: "SU_KIEN" },
    { id: "c", fullName: "Chi", active: true, department: "SU_KIEN" },
    { id: "z-inactive", fullName: "Zed", active: false, department: null },
  ];
  const result = workload(tasks, members);
  assert.deepEqual(result.histogram.map((b) => b.count), [1, 1, 0, 0, 0, 1]);
  assert.deepEqual(result.busiest.map((p) => [p.name, p.open]), [["An", 6], ["Bình", 1]]);
  assert.equal(result.idle, 1);
  assert.equal(result.total, 3);
});

test("activityCalendar dựng lưới tuần × ngày và bỏ ngày tương lai khỏi tổng", () => {
  const cal = activityCalendar(
    [{ createdAt: at(2026, 11, 13, 9) }, { createdAt: at(2026, 11, 13, 10) }, { createdAt: at(2026, 11, 2) }, { createdAt: at(2025, 1, 1) }],
    NOW,
    2,
  );
  assert.equal(cal.columns.length, 2);
  assert.equal(cal.columns[0][0].date, "2026-11-02");
  assert.equal(cal.columns[1][4].count, 2); // thứ Sáu 13/11
  assert.equal(cal.columns[1][5].future, true);
  assert.deepEqual([cal.total, cal.activeDays, cal.max], [3, 2, 2]);
  assert.deepEqual([0, 1, 2, 5, 10].map((c) => heatLevel(c, 10)), [0, 1, 1, 2, 4]);
  assert.equal(heatLevel(3, 0), 0);
});

test("monthlyTotals cộng theo tháng và khóa, bỏ ngoài cửa sổ và khóa lạ", () => {
  const rows = monthlyTotals(
    [
      { d: "2026-11-02", k: "INCOME", v: 100 },
      { d: "2026-11-20", k: "EXPENSE", v: 40 },
      { d: "2026-09-15", k: "INCOME", v: 5 },
      { d: "2026-01-01", k: "INCOME", v: 999 },
      { d: "2026-11-03", k: "TRANSFER", v: 7 },
    ],
    ["INCOME", "EXPENSE"],
    (x) => x.d,
    (x) => x.k,
    (x) => x.v,
    NOW,
    3,
  );
  assert.deepEqual(rows, [
    { month: "2026-09", INCOME: 5, EXPENSE: 0 },
    { month: "2026-10", INCOME: 0, EXPENSE: 0 },
    { month: "2026-11", INCOME: 100, EXPENSE: 40 },
  ]);
});

test("seasonRetention tính tỉ lệ ở lại, tổng và theo ban", () => {
  const result = seasonRetention(
    [
      { userId: "a", department: "NOI_DUNG", leftAt: null },
      { userId: "b", department: "NOI_DUNG", leftAt: null },
      { userId: "c", department: "SU_KIEN", leftAt: null },
    ],
    [
      { userId: "a", leftAt: null },
      { userId: "c", leftAt: "2026-11-01" },
      { userId: "new", leftAt: null },
    ],
  );
  assert.deepEqual([result.retained, result.total, result.rate], [1, 3, 33]);
  assert.deepEqual(result.byDepartment.map((d) => [d.department, d.retained, d.total, d.rate]), [
    ["SU_KIEN", 0, 1, 0],
    ["NOI_DUNG", 1, 2, 50],
  ]);
  assert.equal(seasonRetention([], []).rate, null);
});

test("resolveRange: mặc định 3 tháng, preset, tùy chỉnh hợp lệ và không hợp lệ", async () => {
  const { resolveRange, inRange } = await import("./healthMetrics.ts");
  const fallback = resolveRange(null, null, null, NOW);
  assert.deepEqual([fallback.key, fallback.weeks, fallback.months, fallback.end], ["3m", 13, 3, NOW]);
  assert.equal(new Date(fallback.start).getDay(), 1);

  const year = resolveRange("12m", null, null, NOW);
  assert.deepEqual([year.weeks, year.months], [52, 12]);

  const custom = resolveRange("custom", "2026-10-01", "2026-10-31", NOW);
  assert.equal(custom.key, "custom");
  assert.equal(custom.start, new Date(2026, 9, 1).getTime());
  assert.equal(custom.months, 1);
  assert.equal(custom.weeks, 5); // tuần 28/9 … tuần 26/10
  assert.ok(inRange("2026-10-31", custom) && inRange(at(2026, 10, 31, 23), custom));
  assert.ok(!inRange("2026-11-01", custom) && !inRange(null, custom));

  // Ngày kết thúc ở tương lai bị chặn ở hiện tại; khoảng đảo ngược hoặc sai định dạng rơi về mặc định.
  assert.equal(resolveRange("custom", "2026-11-01", "2027-01-01", NOW).end, NOW);
  assert.equal(resolveRange("custom", "2026-11-10", "2026-11-01", NOW).key, "3m");
  assert.equal(resolveRange("custom", "abc", "2026-11-01", NOW).key, "3m");
});
