import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../input/redaction/protection-plan.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { applyProtectionPlan } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

function span(content, value, type, placeholder, from = 0) {
  const start = content.indexOf(value, from);
  assert.notEqual(start, -1);
  return { start, end: start + value.length, type, placeholder };
}

const repeatedCases = [
  { name: "same PERSON twice", content: "Alice met Alice.", value: "Alice",
    type: "PERSON", placeholder: "[PERSON_1]", count: 2 },
  { name: "same LOCATION twice with Unicode", content: "Malmö works with Malmö.", value: "Malmö",
    type: "LOCATION", placeholder: "[LOCATION_1]", count: 2 },
  { name: "same ORGANIZATION three times", content: "Acme, Acme; Acme.", value: "Acme",
    type: "ORGANIZATION", placeholder: "[ORGANIZATION_1]", count: 3 },
];

for (const fixture of repeatedCases) {
  test(fixture.name, () => {
    const occurrences = [];
    let from = 0;
    for (let index = 0; index < fixture.count; index += 1) {
      const occurrence = span(fixture.content, fixture.value, fixture.type, fixture.placeholder, from);
      occurrences.push(occurrence);
      from = occurrence.end;
    }
    const result = applyProtectionPlan(fixture.content, occurrences);
    assert.equal(result.planned_replacements, fixture.count);
    assert.equal(result.completed_replacements, fixture.count);
    assert.equal(result.content.includes(fixture.value), false);
    assert.equal(result.content.split(fixture.placeholder).length - 1, fixture.count);
  });
}

test("different and adjacent protected spans compose from original slices", () => {
  const content = "AliceLondon";
  const result = applyProtectionPlan(content, [
    { start: 0, end: 5, type: "PERSON", placeholder: "[PERSON_1]" },
    { start: 5, end: 11, type: "LOCATION", placeholder: "[LOCATION_1]" },
  ]);
  assert.equal(result.content, "[PERSON_1][LOCATION_1]");
  assert.equal(result.completed_replacements, 2);
});

test("exact duplicate spans collapse and nested spans choose the widest", () => {
  const content = "New York office";
  const widest = { start: 0, end: 8, type: "LOCATION", placeholder: "[LOCATION_1]" };
  const nested = { start: 4, end: 8, type: "LOCATION", placeholder: "[LOCATION_2]" };
  const result = applyProtectionPlan(content, [widest, widest, nested]);
  assert.equal(result.content, "[LOCATION_1] office");
  assert.equal(result.planned_replacements, 1);
});

test("partial overlap and malformed spans fail closed", () => {
  const occurrence = (start, end) => ({ start, end, type: "PERSON", placeholder: "[PERSON_1]" });
  assert.throws(() => applyProtectionPlan("abcdefgh", [occurrence(0, 5), occurrence(3, 7)]),
    /protection_span_overlap/u);
  for (const invalid of [occurrence(-1, 2), occurrence(2, 2), occurrence(0, 99)]) {
    assert.throws(() => applyProtectionPlan("abcdefgh", [invalid]), /protection_span_invalid/u);
  }
});

test("empty plan preserves punctuation and placeholder-like source text", () => {
  const content = "No identity here; literal [LOCATION_9] remains.";
  const result = applyProtectionPlan(content, []);
  assert.deepEqual(result, { content, planned_replacements: 0, completed_replacements: 0 });
});

test("punctuation around a protected value is preserved", () => {
  const content = "(Alice), Alice!";
  const first = span(content, "Alice", "PERSON", "[PERSON_1]");
  const second = span(content, "Alice", "PERSON", "[PERSON_1]", first.end);
  assert.equal(applyProtectionPlan(content, [first, second]).content,
    "([PERSON_1]), [PERSON_1]!");
});
