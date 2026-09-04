import assert from "node:assert/strict";
import test from "node:test";

import {
  BROWSER_DAILY_CEILING_MS,
  BROWSER_QUOTA_DATE_KEY,
  BROWSER_QUOTA_TOTAL_KEY,
  BROWSER_RUN_RESERVATION_MS,
  reserveBrowserRun,
  settleBrowserRun,
} from "../workers/trusted-runtime/src/browser-quota.ts";
import {
  FinalPdfQueue,
  MIN_QUICK_ACTION_INTERVAL_MS,
} from "../workers/trusted-runtime/src/pdf-queue.ts";

class FakeStorage {
  values = new Map();
  tail = Promise.resolve();

  async get(keys) {
    return new Map(keys.filter((key) => this.values.has(key)).map((key) => [key, this.values.get(key)]));
  }

  async put(entries) {
    for (const [key, value] of Object.entries(entries)) this.values.set(key, value);
  }

  async transaction(callback) {
    const previous = this.tail;
    let release; this.tail = new Promise((resolve) => { release = resolve; });
    await previous;
    try { return await callback(this); } finally { release(); }
  }
}

const firstDay = Date.UTC(2026, 7, 28, 12);
const secondDay = Date.UTC(2026, 7, 29, 12);

test("quota storage contains only UTC date and aggregate Browser Run milliseconds", async () => {
  const storage = new FakeStorage();
  const reserved = await reserveBrowserRun(storage, firstDay);
  assert.equal(reserved.ok, true);
  assert.deepEqual([...storage.values.keys()].sort(), [BROWSER_QUOTA_TOTAL_KEY, BROWSER_QUOTA_DATE_KEY].sort());
  assert.equal(storage.values.get(BROWSER_QUOTA_DATE_KEY), "2026-08-28");
  assert.equal(storage.values.get(BROWSER_QUOTA_TOTAL_KEY), BROWSER_RUN_RESERVATION_MS);
  assert.equal(await settleBrowserRun(storage, reserved.reservation, 216), true);
  assert.equal(storage.values.get(BROWSER_QUOTA_TOTAL_KEY), 216);
});

test("quota guard reserves conservatively, fails closed, and resets lazily on UTC change", async () => {
  const storage = new FakeStorage();
  storage.values.set(BROWSER_QUOTA_DATE_KEY, "2026-08-28");
  storage.values.set(BROWSER_QUOTA_TOTAL_KEY, BROWSER_DAILY_CEILING_MS - BROWSER_RUN_RESERVATION_MS + 1);
  assert.deepEqual(await reserveBrowserRun(storage, firstDay), { ok: false, reason: "exhausted" });

  const reset = await reserveBrowserRun(storage, secondDay);
  assert.equal(reset.ok, true);
  assert.equal(storage.values.get(BROWSER_QUOTA_DATE_KEY), "2026-08-29");
  assert.equal(storage.values.get(BROWSER_QUOTA_TOTAL_KEY), BROWSER_RUN_RESERVATION_MS);

  storage.values.set(BROWSER_QUOTA_TOTAL_KEY, "corrupt");
  assert.deepEqual(await reserveBrowserRun(storage, secondDay), { ok: false, reason: "storage" });
});

test("reservation boundary and concurrent reservations are atomic", async () => {
  const atBoundary = new FakeStorage();
  atBoundary.values.set(BROWSER_QUOTA_DATE_KEY, "2026-08-28");
  atBoundary.values.set(BROWSER_QUOTA_TOTAL_KEY, BROWSER_DAILY_CEILING_MS - BROWSER_RUN_RESERVATION_MS);
  assert.equal((await reserveBrowserRun(atBoundary, firstDay)).ok, true);

  const aboveBoundary = new FakeStorage();
  aboveBoundary.values.set(BROWSER_QUOTA_DATE_KEY, "2026-08-28");
  aboveBoundary.values.set(BROWSER_QUOTA_TOTAL_KEY,
    BROWSER_DAILY_CEILING_MS - BROWSER_RUN_RESERVATION_MS + 1);
  assert.deepEqual(await reserveBrowserRun(aboveBoundary, firstDay), { ok: false, reason: "exhausted" });

  const concurrent = new FakeStorage();
  concurrent.values.set(BROWSER_QUOTA_DATE_KEY, "2026-08-28");
  concurrent.values.set(BROWSER_QUOTA_TOTAL_KEY, BROWSER_DAILY_CEILING_MS - BROWSER_RUN_RESERVATION_MS);
  const results = await Promise.all([reserveBrowserRun(concurrent, firstDay), reserveBrowserRun(concurrent, firstDay)]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.filter((result) => !result.ok && result.reason === "exhausted").length, 1);
});

test("the final-PDF queue is bounded and spaces Quick Actions by ten seconds", async () => {
  let now = 0;
  const waits = [];
  const queue = new FinalPdfQueue(async (milliseconds) => {
    waits.push(milliseconds);
    now += milliseconds;
  }, () => now);
  let releaseFirst;
  const first = queue.run(() => new Promise((resolve) => { releaseFirst = () => resolve("first"); }));
  await Promise.resolve();
  const second = queue.run(async () => "second");
  const third = await queue.run(async () => "third");
  assert.deepEqual(third, { ok: false, reason: "full" });
  releaseFirst();
  assert.deepEqual(await first, { ok: true, value: "first" });
  assert.deepEqual(await second, { ok: true, value: "second" });
  assert.deepEqual(waits, [MIN_QUICK_ACTION_INTERVAL_MS]);
});
