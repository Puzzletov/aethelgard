export const BROWSER_DAILY_CEILING_MS = 8 * 60 * 1_000;
export const BROWSER_RUN_RESERVATION_MS = 60_000;
export const BROWSER_QUOTA_DATE_KEY = "utc_date";
export const BROWSER_QUOTA_TOTAL_KEY = "aggregate_browser_run_ms";

export interface BrowserRunReservation {
  readonly chargedMs: number;
  readonly utcDate: string;
}

export type BrowserQuotaResult =
  | Readonly<{ ok: true; reservation: BrowserRunReservation }>
  | Readonly<{ ok: false; reason: "exhausted" | "storage" }>;

function utcDate(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

function validAggregate(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= BROWSER_DAILY_CEILING_MS;
}

export async function reserveBrowserRun(
  storage: DurableObjectStorage,
  nowMs = Date.now(),
): Promise<BrowserQuotaResult> {
  const today = utcDate(nowMs);
  try {
    const stored = await storage.get([BROWSER_QUOTA_DATE_KEY, BROWSER_QUOTA_TOTAL_KEY]);
    const storedDate = stored.get(BROWSER_QUOTA_DATE_KEY);
    const storedTotal = stored.get(BROWSER_QUOTA_TOTAL_KEY);
    let aggregate = 0;
    if (storedDate === today) {
      if (!validAggregate(storedTotal)) return { ok: false, reason: "storage" };
      aggregate = storedTotal;
    } else if (storedDate !== undefined || storedTotal !== undefined) {
      if (typeof storedDate !== "string") return { ok: false, reason: "storage" };
    }
    if (aggregate + BROWSER_RUN_RESERVATION_MS > BROWSER_DAILY_CEILING_MS) {
      return { ok: false, reason: "exhausted" };
    }
    await storage.put({
      [BROWSER_QUOTA_DATE_KEY]: today,
      [BROWSER_QUOTA_TOTAL_KEY]: aggregate + BROWSER_RUN_RESERVATION_MS,
    });
    return {
      ok: true,
      reservation: { utcDate: today, chargedMs: BROWSER_RUN_RESERVATION_MS },
    };
  } catch {
    return { ok: false, reason: "storage" };
  }
}

export async function settleBrowserRun(
  storage: DurableObjectStorage,
  reservation: BrowserRunReservation,
  actualMs: number,
): Promise<boolean> {
  if (!validAggregate(actualMs) || actualMs > reservation.chargedMs) return false;
  try {
    const stored = await storage.get([BROWSER_QUOTA_DATE_KEY, BROWSER_QUOTA_TOTAL_KEY]);
    const storedDate = stored.get(BROWSER_QUOTA_DATE_KEY);
    const storedTotal = stored.get(BROWSER_QUOTA_TOTAL_KEY);
    if (storedDate !== reservation.utcDate || !validAggregate(storedTotal) || storedTotal < reservation.chargedMs) {
      return false;
    }
    await storage.put({
      [BROWSER_QUOTA_DATE_KEY]: reservation.utcDate,
      [BROWSER_QUOTA_TOTAL_KEY]: storedTotal - reservation.chargedMs + actualMs,
    });
    return true;
  } catch {
    return false;
  }
}
