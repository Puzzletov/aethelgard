import { MAX_CHARTS, parseChartCollection, type ChartData } from "../contracts/chart-data.ts";
import { candidateSchema, MAX_QUANTITATIVE_CANDIDATES } from "../contracts/strawman.ts";

interface MutableChart {
  readonly schema_version: "1";
  readonly id: string;
  readonly title: string;
  readonly unit: string;
  readonly kind: "bar";
  readonly points: Array<ChartData["points"][number]>;
}

export function buildDeterministicCharts(value: unknown): readonly ChartData[] {
  if (!Array.isArray(value) || value.length > MAX_QUANTITATIVE_CANDIDATES) return [];
  const charts: MutableChart[] = [];
  const groups = new Map<string, MutableChart>();
  for (const candidateValue of value) {
    const parsed = candidateSchema.safeParse(candidateValue);
    if (!parsed.success) continue;
    const candidate = parsed.data;
    const key = JSON.stringify([candidate.unit, candidate.context]);
    let chart = groups.get(key);
    if (chart === undefined) {
      if (charts.length >= MAX_CHARTS) continue;
      chart = { schema_version: "1", id: `chart-${charts.length + 1}`, title: candidate.context,
        unit: candidate.unit, kind: "bar", points: [] };
      charts.push(chart); groups.set(key, chart);
    }
    chart.points.push({ label: candidate.label, value: candidate.value, evidence: candidate.evidence });
  }
  return parseChartCollection(charts);
}
