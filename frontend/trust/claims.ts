export const trustClaims = [
  {
    id: "mission_no_copy",
    title: "No source copy",
    body: "Aethelgard analyzes a document without retaining a server-side copy of the source.",
  },
  {
    id: "browser_local_source",
    title: "Browser-local source",
    body: "Raw files, unredacted extracted text and PII mappings stay in browser memory.",
  },
  {
    id: "redacted_ai_processing",
    title: "Redacted AI processing",
    body: "The AI provider temporarily processes redacted business text. Raw source files and unredacted extracted text are never sent to the AI provider.",
  },
  {
    id: "provider_metadata_limit",
    title: "Platform metadata",
    body: "Cloudflare and the selected AI provider may process operational or accounting metadata outside Aethelgard application storage.",
  },
  {
    id: "english_only",
    title: "English-only validation",
    body: "The validated release scope is English-language documents; mixed, uncertain or non-English input fails closed.",
  },
  {
    id: "desktop_chrome_edge",
    title: "Supported browsers",
    body: "Document processing is validated for current desktop Chrome and Edge.",
  },
  {
    id: "no_malware_scan",
    title: "No malware scan",
    body: "Aethelgard does not claim to malware-scan source files. It rejects hostile document structures before isolated local parsing.",
  },
  {
    id: "exact_zero",
    title: "Exact-zero operation",
    body: "Aethelgard uses approved free capacity only and fails closed when required free quota is unavailable. It has no paid fallback.",
  },
] as const;

export const externalProcessors = [
  "Cloudflare routes the redacted request, verifies Turnstile and executes the private runtime.",
  "Groq processes one bounded analysis request when its approved privacy controls and free capacity are available.",
] as const;

export const honestLimits = [
  "Aethelgard does not guarantee protection on a compromised client device or browser engine.",
  "External provider and platform metadata is outside Aethelgard application storage.",
  "The free service provides no uptime service-level agreement.",
] as const;
