export const TURNSTILE_ACTION = "analyze";
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

interface TurnstileRenderOptions {
  readonly action: string;
  readonly callback: (token: string) => void;
  readonly "error-callback": () => boolean;
  readonly "expired-callback": () => void;
  readonly sitekey: string;
}

export interface TurnstileApi {
  render(container: HTMLElement | string, options: TurnstileRenderOptions): string;
  reset(widgetId: string): void;
}

export interface TurnstileController {
  takeToken(): string | undefined;
  resetAfterAttempt(): void;
}

export function mountTurnstile(
  api: TurnstileApi,
  container: HTMLElement | string,
  onTokenState: (ready: boolean) => void,
): TurnstileController {
  if (TURNSTILE_SITE_KEY.length === 0) throw new Error("Turnstile is not configured.");
  let currentToken: string | undefined;
  const clearToken = (): void => {
    currentToken = undefined;
    onTokenState(false);
  };
  const widgetId = api.render(container, {
    sitekey: TURNSTILE_SITE_KEY,
    action: TURNSTILE_ACTION,
    callback: (token) => {
      currentToken = token;
      onTokenState(true);
    },
    "expired-callback": clearToken,
    "error-callback": () => {
      clearToken();
      return true;
    },
  });
  return Object.freeze({
    takeToken: () => {
      const token = currentToken;
      currentToken = undefined;
      return token;
    },
    resetAfterAttempt: () => {
      clearToken();
      api.reset(widgetId);
    },
  });
}
