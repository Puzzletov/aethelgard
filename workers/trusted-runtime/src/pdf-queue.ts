export const MAX_FINAL_PDF_QUEUE_DEPTH = 2;
export const MIN_QUICK_ACTION_INTERVAL_MS = 10_000;

type Wait = (milliseconds: number) => Promise<void>;
type Clock = () => number;

export type QueueResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: "full" }>;

export class FinalPdfQueue {
  private activeOrWaiting = 0;
  private readonly clock: Clock;
  private lastStartedAt = Number.NEGATIVE_INFINITY;
  private tail: Promise<void> = Promise.resolve();
  private readonly wait: Wait;

  constructor(
    wait: Wait = (milliseconds) => scheduler.wait(milliseconds),
    clock: Clock = () => Date.now(),
  ) {
    this.wait = wait;
    this.clock = clock;
  }

  run<T>(task: () => Promise<T>): Promise<QueueResult<T>> {
    if (this.activeOrWaiting >= MAX_FINAL_PDF_QUEUE_DEPTH) {
      return Promise.resolve({ ok: false, reason: "full" });
    }
    this.activeOrWaiting += 1;
    const predecessor = this.tail;
    let release = (): void => undefined;
    this.tail = new Promise<void>((resolve) => { release = resolve; });

    return (async () => {
      await predecessor;
      try {
        const remaining = MIN_QUICK_ACTION_INTERVAL_MS - (this.clock() - this.lastStartedAt);
        if (remaining > 0) await this.wait(remaining);
        this.lastStartedAt = this.clock();
        return { ok: true, value: await task() } as const;
      } finally {
        this.activeOrWaiting -= 1;
        release();
      }
    })();
  }
}
