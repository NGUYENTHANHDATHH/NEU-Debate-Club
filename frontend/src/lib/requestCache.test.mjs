// Chạy: node --test src/lib/requestCache.test.mjs (Node >= 23.6 tự bỏ kiểu TS).
import assert from "node:assert/strict";
import test from "node:test";
import { cachedGet, refreshApiCache } from "./requestCache.ts";

function counter() {
  let calls = 0;
  return { load: async () => ++calls, calls: () => calls };
}

test("trên server không cache", async () => {
  const { load, calls } = counter();
  await cachedGet("ssr", load);
  await cachedGet("ssr", load);
  assert.equal(calls(), 2);
});

test("trong trình duyệt: gộp request trùng, giữ kết quả, xóa khi refresh, không giữ lỗi", async (t) => {
  globalThis.window = {};
  t.after(() => delete globalThis.window);

  const { load, calls } = counter();
  assert.deepEqual(await Promise.all([cachedGet("a", load), cachedGet("a", load)]), [1, 1]);
  assert.equal(await cachedGet("a", load), 1);
  assert.equal(await cachedGet("b", load), 2); // khóa khác không dùng chung

  refreshApiCache();
  assert.equal(await cachedGet("a", load), 3);
  assert.equal(calls(), 3);

  let fail = true;
  const flaky = async () => {
    if (fail) throw new Error("mất mạng");
    return "ok";
  };
  await assert.rejects(cachedGet("c", flaky));
  fail = false;
  assert.equal(await cachedGet("c", flaky), "ok");

  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  t.mock.timers.tick(30_001);
  assert.equal(await cachedGet("a", load), 4); // hết 30s thì tải lại
});
