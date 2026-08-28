// Frozen synthetic Phase -1D PII acceptance corpus.
// Values are test data. Domains use the reserved .test suffix.
// Owner-approved Aethelgard regression baseline: 2026-08-27.
// This corpus is not evidence of universal PII-detection accuracy.

const IDENTITIES = Object.freeze([
  ["Alice Zhang", "Northstar Analytics", "London", "14 Cedar Lane", "alice.zhang@example.test", "+44 20 7946 0958", "CUST-100001", "4111111111111111"],
  ["Priya Nair", "Orange Systems", "Reading", "22 Station Road", "priya.nair@example.test", "+44 118 496 0123", "CUST-100002", "5555555555554444"],
  ["Sofia García", "Meridian Health", "Madrid", "8 Calle del Prado", "sofia.garcia@example.test", "+34 91 555 0142", "CUST-100003", "4000000000000002"],
  ["Li Wei", "Atlas Robotics", "Singapore", "31 Orchard Road", "li.wei@example.test", "+65 6123 4567", "CUST-100004", "4012888888881881"],
  ["Jordan Blake", "Harbor Partners", "Dublin", "6 River Quay", "jordan.blake@example.test", "+353 1 555 0194", "CUST-100005", "4222222222222"],
  ["Amara Okafor", "Cedar Finance", "Lagos", "19 Marina Way", "amara.okafor@example.test", "+234 1 555 0138", "CUST-100006", "5105105105105100"],
  ["Jean-Luc Martin", "Alpine Research", "Paris", "12 Rue des Fleurs", "jean-luc.martin@example.test", "+33 1 55 55 01 29", "CUST-100007", "6011111111111117"],
  ["Maeve O'Connor", "Birch Energy", "Cork", "4 Harbour View", "maeve.oconnor@example.test", "+353 21 555 0166", "CUST-100008", "3530111333300000"],
  ["Ahmed El-Sayed", "Crescent Logistics", "Cairo", "27 Nile Avenue", "ahmed.elsayed@example.test", "+20 2 555 0175", "CUST-100009", "3566002020360505"],
  ["Ana María Silva", "Solstice Foods", "Lisbon", "9 Rua do Mercado", "ana.silva@example.test", "+351 21 555 0182", "CUST-100010", "30569309025904"],
  ["Nia Williams", "Blue Ridge Labs", "Cardiff", "17 Castle Street", "nia.williams@example.test", "+44 29 2055 0191", "CUST-100011", "378282246310005"],
  ["Kenji Tanaka", "Sakura Manufacturing", "Tokyo", "5 Chiyoda Avenue", "kenji.tanaka@example.test", "+81 3 5555 0127", "CUST-100012", "371449635398431"],
]);

const FORMATS = Object.freeze(["PDF", "DOCX", "PPTX", "XLSX", "CSV", "TXT"]);
const SOURCE_REFS = Object.freeze({
  PDF: "page 2",
  DOCX: "paragraph 3",
  PPTX: "slide 2",
  XLSX: "Contacts!A2:H2",
  CSV: "row 2",
  TXT: "line 2",
});

const CONTROL_TEXTS = Object.freeze([
  "Orange is the approved status colour for this dashboard.",
  "Reading is a required skill for the analyst role.",
  "Jordan is the name of a market segment in this sample.",
  "The cedar finish and alpine style are product attributes.",
  "The atlas index maps categories, not people or places.",
  "Harbor capacity increased while river flow stayed stable.",
  "The report compares blue ridge and crescent chart patterns.",
  "A meridian line and a solstice date appear in the diagram.",
  "The birch table has twelve rows and no contact details.",
  "Sakura is used here only as a colour name in a test palette.",
  "The word card means a dashboard tile, not a payment card.",
  "A customer trend is described without a customer identifier.",
]);

function labelled(type, value, deterministic = false) {
  return Object.freeze({ type, value, deterministic });
}

function makeLabels(identity) {
  return Object.freeze([
    labelled("PERSON", identity[0]),
    labelled("ORGANIZATION", identity[1]),
    labelled("LOCATION", identity[2]),
    labelled("ADDRESS", identity[3], true),
    labelled("EMAIL", identity[4], true),
    labelled("PHONE", identity[5], true),
    labelled("CUSTOMER_ID", identity[6], true),
    labelled("PAYMENT_CARD", identity[7], true),
  ]);
}

function prose(identity) {
  return `${identity[0]} works at ${identity[1]} in ${identity[2]}. ` +
    `Address: ${identity[3]}. Email: ${identity[4]}. Phone: ${identity[5]}. ` +
    `Customer ID: ${identity[6]}. Payment card: ${identity[7]}.`;
}

function table(identity) {
  const fields = ["Person", "Organisation", "Location", "Address", "Email", "Phone", "Customer ID", "Payment card"];
  return fields.map((field, index) => `${field} | ${identity[index]}`).join("\n");
}

export function buildFrozenCorpus() {
  const cases = [];
  for (const [identityIndex, identity] of IDENTITIES.entries()) {
    for (const [formatIndex, format] of FORMATS.entries()) {
      const kind = formatIndex % 2 === 0 ? "prose" : "table";
      cases.push(Object.freeze({
        id: `${format.toLowerCase()}-${String(identityIndex + 1).padStart(2, "0")}`,
        format,
        kind,
        sourceRef: SOURCE_REFS[format],
        text: kind === "prose" ? prose(identity) : table(identity),
        labels: makeLabels(identity),
        mustRedact: Object.freeze([identity[4], identity[6], identity[7]]),
      }));
    }
  }
  for (const [index, text] of CONTROL_TEXTS.entries()) {
    const format = FORMATS[index % FORMATS.length];
    cases.push(Object.freeze({
      id: `control-${String(index + 1).padStart(2, "0")}`,
      format,
      kind: index % 2 === 0 ? "prose" : "table",
      sourceRef: SOURCE_REFS[format],
      text,
      labels: Object.freeze([]),
      mustRedact: Object.freeze([]),
    }));
  }
  return Object.freeze(cases);
}
