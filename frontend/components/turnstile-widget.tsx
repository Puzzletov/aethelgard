"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { mountTurnstile, TURNSTILE_SITE_KEY, type TurnstileApi,
  type TurnstileController } from "../security/turnstile-client";

declare global { interface Window { turnstile?: TurnstileApi } }

interface TurnstileWidgetProps {
  readonly onController: (controller: TurnstileController | null) => void;
  readonly onReady: (ready: boolean) => void;
}

export function TurnstileWidget({ onController, onReady }: TurnstileWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded || container.current === null || window.turnstile === undefined
      || TURNSTILE_SITE_KEY.length === 0) return;
    const controller = mountTurnstile(window.turnstile, container.current, onReady);
    onController(controller);
    return () => { onController(null); onReady(false); };
  }, [loaded, onController, onReady]);
  if (TURNSTILE_SITE_KEY.length === 0) return <p role="alert">Verification is not configured.</p>;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive" onLoad={() => setLoaded(true)} />
    <div ref={container} aria-label="Request verification" />
  </>;
}
