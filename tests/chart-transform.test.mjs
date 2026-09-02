import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildDeterministicCharts } from "../src/report/chart-transform.ts";

const reference = Object.freeze({ kind: "pdf_page", page: 1 });
function candidate(id, label, value, unit = "GBP", context = "Annual savings") {
  return { id, label, value, unit, context, evidence: [reference] };
}

test("compatible candidates group by exact unit and context in source order", () => {
  const input = [candidate("a", "Current", 12), candidate("b", "Target", 18),
    candidate("c", "Margin", 4, "percent", "Operating margin"),
    candidate("d", "Later", 20)];
  const charts = buildDeterministicCharts(input);
  assert.deepEqual(charts.map((chart) => [chart.id, chart.title, chart.unit, chart.kind]), [
    ["chart-1", "Annual savings", "GBP", "bar"],
    ["chart-2", "Operating margin", "percent", "bar"],
  ]);
  assert.deepEqual(charts[0].points.map((point) => [point.label, point.value]),
    [["Current", 12], ["Target", 18], ["Later", 20]]);
  assert.deepEqual(charts[0].points[0].evidence, [reference]);
});

test("units are never converted or case-folded", () => {
  const charts = buildDeterministicCharts([
    candidate("a", "GBP", 1, "GBP"), candidate("b", "gbp", 2, "gbp"),
  ]);
  assert.deepEqual(charts.map((chart) => chart.unit), ["GBP", "gbp"]);
  assert.deepEqual(charts.map((chart) => chart.points[0].value), [1, 2]);
});

test("invalid candidates and groups above eight are omitted deterministically", () => {
  const values = [candidate("bad", "Bad", Number.NaN),
    ...Array.from({ length: 10 }, (_, index) => candidate(`c${index}`, `P${index}`, index,
      `unit-${index}`, `context-${index}`))];
  const charts = buildDeterministicCharts(values);
  assert.equal(charts.length, 8);
  assert.deepEqual(charts.map((chart) => chart.unit), Array.from({ length: 8 }, (_, index) => `unit-${index}`));
  assert.deepEqual(buildDeterministicCharts(Array.from({ length: 25 }, (_, index) =>
    candidate(`c${index}`, `P${index}`, index))), []);
  assert.deepEqual(buildDeterministicCharts("not-candidates"), []);
});

test("transform source has no model, conversion, persistence or network path", async () => {
  const source = await readFile(new URL("../src/report/chart-transform.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fetch|localStorage|sessionStorage|indexedDB|convert|provider|model_id/iu);
});
