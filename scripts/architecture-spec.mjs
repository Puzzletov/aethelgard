const TASK_FIELDS = Object.freeze([
  "Purpose", "Preconditions", "Allowed scope", "Inputs", "Outputs",
  "Required behavior", "Bounds", "Schemas", "Failures", "Forbidden", "PASS",
]);
const TASK_COUNTS = Object.freeze({ 0: 11, 1: 22, 2: 14, 3: 26, 4: 12 });
const REGISTRY_SECTIONS = Object.freeze({ B: 53, S: 54, F: 55 });

function idsFromMatches(text, pattern, group = 1) {
  return [...text.matchAll(pattern)].map((match) => match[group]);
}

function duplicates(ids) {
  const seen = new Set();
  return [...new Set(ids.filter((id) => seen.has(id) || !seen.add(id)))];
}

function numericSequence(ids, first, last, label, errors) {
  const numbers = ids.map(Number);
  const expected = Array.from({ length: last - first + 1 }, (_, index) => first + index);
  if (numbers.join(",") !== expected.join(",")) errors.push(`${label} must be ${first}..${last} in order.`);
  for (const id of duplicates(ids)) errors.push(`${label} ${id} is duplicated.`);
}

export function taskBlocks(text) {
  const pattern = /^## Task (\d+)\.(\d+) — ([^\r\n]+)\r?\n([\s\S]*?)(?=^## Task |^## PHASE |^# \d+\.|$(?![\s\S]))/gm;
  return [...text.matchAll(pattern)].map((match) => Object.freeze({
    id: `${match[1]}.${match[2]}`, phase: Number(match[1]), number: Number(match[2]),
    title: match[3], body: match[4].trim(), full: match[0].trim(),
  }));
}

export function registryEntries(text, prefix) {
  if (prefix === "B" || prefix === "F") {
    return idsFromMatches(text, new RegExp(`^\\| (${prefix}-[A-Z0-9-]+) \\|`, "gm"));
  }
  return idsFromMatches(text, new RegExp(`^### (${prefix}-[A-Z0-9-]+)$`, "gm"));
}

function checkSections(text, errors) {
  const ids = idsFromMatches(text, /^# (\d+)\. /gm);
  numericSequence(ids, 0, 55, "Section", errors);
}

function checkEdrs(text, errors) {
  const section = text.match(/^# 35\.[\s\S]*?(?=^# 36\.)/m)?.[0] ?? "";
  const ids = idsFromMatches(section, /^\| (\d+) \|/gm);
  numericSequence(ids, 1, 37, "EDR", errors);
}

function checkTaskSequence(blocks, errors) {
  for (const [phaseText, count] of Object.entries(TASK_COUNTS)) {
    const phase = Number(phaseText);
    const ids = blocks.filter((task) => task.phase === phase).map((task) => task.number);
    const expected = Array.from({ length: count }, (_, index) => index + 1);
    if (ids.join(",") !== expected.join(",")) errors.push(`Phase ${phase} tasks must be 1..${count} in order.`);
  }
  for (const id of duplicates(blocks.map((task) => task.id))) errors.push(`Task ${id} is duplicated.`);
}

function checkTaskFields(blocks, errors) {
  for (const task of blocks.filter((item) => item.phase >= 1)) {
    for (const field of TASK_FIELDS) {
      if (!new RegExp(`^${field}:\\s+\\S`, "m").test(task.body)) errors.push(`Task ${task.id} lacks ${field}.`);
    }
  }
}

function checkReferences(text, blocks, errors) {
  for (const [prefix, section] of Object.entries(REGISTRY_SECTIONS)) {
    const entries = registryEntries(text, prefix);
    for (const id of duplicates(entries)) errors.push(`${id} is duplicated in Section ${section}.`);
    const known = new Set(entries);
    const pattern = new RegExp(`\\b${prefix}-[A-Z0-9-]+\\b`, "g");
    for (const id of text.match(pattern) ?? []) if (!known.has(id)) errors.push(`Architecture references unknown ${id}.`);
  }
}

function checkExitGates(text, errors) {
  for (let phase = 0; phase <= 3; phase += 1) {
    const count = (text.match(new RegExp(`PHASE ${phase} EXIT GATE`, "g")) ?? []).length;
    if (count !== 1) errors.push(`Phase ${phase} must have exactly one exit gate.`);
  }
  const phase4 = (text.match(/PHASE 4 EXIT GATE — PROJECT COMPLETE/g) ?? []).length;
  if (phase4 !== 1) errors.push("Phase 4 must have exactly one PROJECT COMPLETE exit gate.");
  if (!/^## Task 4\.12 — Final production release and live verification$/m.test(text)) errors.push("Task 4.12 final production release is absent.");
}

function checkForbiddenWording(text, errors) {
  if (/Suggested task sequence|Suggested sequence/i.test(text)) errors.push("Suggested phase sequencing is forbidden.");
  if (/Phase [1-4].{0,24}(?:not authorized|unauthorized)|not authorized yet/i.test(text)) errors.push("Architecture contains stale live authorization wording.");
  const normative = text.match(/^# (?:10|11|53|54|55)\.[\s\S]*?(?=^# \d+\.|$(?![\s\S]))/gm)?.join("\n") ?? "";
  if (/\b(?:TBD|TO BE DETERMINED)\b|<placeholder>/i.test(normative)) errors.push("Normative contract contains an unresolved placeholder.");
}

export function lintArchitecture(text) {
  const errors = [];
  const blocks = taskBlocks(text);
  checkSections(text, errors);
  checkEdrs(text, errors);
  checkTaskSequence(blocks, errors);
  checkTaskFields(blocks, errors);
  checkReferences(text, blocks, errors);
  checkExitGates(text, errors);
  checkForbiddenWording(text, errors);
  return Object.freeze([...new Set(errors)]);
}

function entryBlock(text, id) {
  if (id.startsWith("B-") || id.startsWith("F-")) {
    const line = text.split(/\r?\n/).find((value) => value.startsWith(`| ${id} |`));
    return line === undefined ? undefined : `### ${id}\n${line}`;
  }
  const pattern = new RegExp(`^### ${id}$[\\s\\S]*?(?=^### |^---$|^# \\d+\\.|$(?![\\s\\S]))`, "m");
  return text.match(pattern)?.[0].trim();
}

export function taskContext(text, requestedId) {
  const task = taskBlocks(text).find((item) => item.id === requestedId);
  if (task === undefined) throw new Error(`Unknown task ${requestedId}.`);
  const ids = [...new Set(task.body.match(/\b[BSF]-[A-Z0-9-]+\b/g) ?? [])];
  const entries = ids.map((id) => entryBlock(text, id));
  if (entries.some((entry) => entry === undefined)) throw new Error(`Task ${requestedId} has an unknown registry reference.`);
  return [`# Task ${requestedId} context`, task.full, ...entries].join("\n\n");
}
