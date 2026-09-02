import assert from "node:assert/strict";
import test from "node:test";

import { MAX_CHART_POINTS, parseChartCollection, parseChartData } from "../src/contracts/chart-data.ts";

const reference = Object.freeze({ kind: "pdf_page", page: 1 });
const point = Object.freeze({ label: "Base", value: 12.5, evidence: [reference] });
const valid = Object.freeze({ schema_version: "1", id: "savings", title: "Savings", unit: "percent",
  kind: "bar", points: [point] });

test("strict chart data accepts finite source-linked bar and line values", () => {
  assert.deepEqual(parseChartData(valid), valid);
  assert.equal(parseChartData({ ...valid, kind: "line" })?.kind, "line");
  assert.equal(parseChartData({ ...valid, kind: "pie" }), undefined);
  assert.equal(parseChartData({ ...valid, extra: true }), undefined);
  assert.equal(parseChartData({ ...valid, points: [{ ...point, value: Number.NaN }] }), undefined);
  assert.equal(parseChartData({ ...valid, points: [{ ...point, evidence: [] }] }), undefined);
});

test("chart and point bounds omit the complete invalid collection", () => {
  const bound = { ...valid, points: Array.from({ length: MAX_CHART_POINTS }, (_, index) => ({
    ...point, label: `Point ${index + 1}`,
  })) };
  assert.equal(parseChartData(bound)?.points.length, MAX_CHART_POINTS);
  assert.equal(parseChartData({ ...bound, points: [...bound.points, point] }), undefined);
  assert.deepEqual(parseChartCollection(Array.from({ length: 8 }, (_, index) => ({
    ...valid, id: `chart-${index}`,
  }))).length, 8);
  assert.deepEqual(parseChartCollection(Array.from({ length: 9 }, () => valid)), []);
  assert.deepEqual(parseChartCollection([{ ...valid, points: [] }]), []);
});
