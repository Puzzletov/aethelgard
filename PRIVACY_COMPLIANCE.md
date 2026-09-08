# Aethelgard privacy readiness evidence

Status: pre-release accountability checklist, not certification. Reviewed
2026-09-08. Production promotion remains paused.

## Processing inventory

| Activity | Data | Location / recipient | Persistence | Current role / basis |
|---|---|---|---|---|
| Select, validate, parse and redact | Source bytes, unredacted text, PII mapping | Browser-local disposable Workers | None | Role and Article 6 basis require owner/legal approval |
| Verify request | Turnstile token, IP/browser/security signals | Cloudflare | Cloudflare operational handling | Operator controller for website protection is proposed; basis requires approval |
| Analyze | Redacted or pseudonymised source records | Cloudflare, then Groq; OpenRouter only on bounded fallback | No Aethelgard history; provider metadata separately retained | Customer/controller relationship requires owner approval |
| Render report | Escaped service-owned report HTML | Cloudflare Browser Rendering | Request memory only; anonymous quota aggregate persists | Same service relationship as analysis |
| Verify/download | Final output bytes and public keys | Browser-local | None unless the user saves a download | User-directed local operation |

Redaction reduces disclosed identifiers. It does not necessarily anonymise the
remaining content, which can still be personal data.

## Vendor and transfer evidence

| Vendor/path | Verified official evidence | Account/configuration evidence | Release state |
|---|---|---|---|
| Cloudflare | [Customer DPA](https://www.cloudflare.com/en-gb/cloudflare-customer-dpa/) defines Cloudflare as processor/subprocessor and includes EU SCCs, the UK Addendum and DPF terms | Account belongs to release operator and DPA applicability: OWNER INPUT | OWNER INPUT |
| Turnstile | [Privacy Addendum](https://www.cloudflare.com/turnstile-privacy-policy/) covers IP, TLS fingerprint, user agent, sitekey/origin and Cloudflare's processor/controller roles | Mode, hostnames and pre-clearance: OWNER INPUT. Code loads Turnstile only after local preflight and sends no document fields | OWNER INPUT |
| Groq | [Customer DPA](https://console.groq.com/docs/legal/customer-data-processing-addendum) is incorporated into the Services Agreement and includes SCC/UK transfer terms. [Data controls](https://console.groq.com/docs/your-data) state usage metadata always persists and inference content may be retained up to 30 days unless ZDR is enabled | Account/DPA party and ZDR setting: OWNER INPUT | OWNER INPUT |
| OpenRouter | Current [Terms](https://openrouter.ai/terms), [enterprise agreement/DPA](https://openrouter.ai/terms-of-service-enterprise), [data collection documentation](https://openrouter.ai/docs/guides/privacy/data-collection) and [ZDR documentation](https://openrouter.ai/docs/guides/features/zdr) describe processor terms, SCC/UK safeguards and operational metadata retention | Code enforces `data_collection: deny`, `zdr: true`, no provider fallback and zero price. Account logging/input-use settings and DPA party: OWNER INPUT | BLOCKED |
| OpenRouter downstream model | ZDR routing filters endpoints, but `openrouter/free` can select changing model providers. OpenRouter Terms require the customer to review each selected Model Terms and processing suitability | No fixed downstream allow-list, model terms set, processing country or account evidence exists | GDPR RELEASE BLOCKER |

The approved OpenRouter request is not EU-region routing. No EU-only claim is
permitted. The public notice must explain that processing can occur outside the
EEA/UK and identify applicable safeguards only after the account parties and
agreements are confirmed.

## Public-notice gate

| Requirement | State |
|---|---|
| Controller identity and postal/contact details | OWNER INPUT |
| Purposes | PASS |
| Article 6 basis by purpose | OWNER INPUT |
| Data categories and pseudonymisation wording | PASS |
| Processor categories and fallback condition | PASS |
| International transfers | BLOCKED pending account contracts and downstream path |
| Aethelgard/application retention | PASS |
| External metadata/content retention | OWNER INPUT for account controls |
| Data-subject rights and retrieval limitation | PASS; contact route OWNER INPUT |
| Complaint authority | OWNER INPUT |
| Automated-decision disclosure | PASS: output is informational; no Article 22 decision is made by Aethelgard |
| Children/special-category scope | OWNER INPUT; pre-release notice excludes both until approved |
| Security description and honest limits | PASS |
| Cookies/ePrivacy | Code PASS; Turnstile pre-clearance OWNER INPUT |

## Roles and agreements

The operator likely acts as controller for platform operations, abuse prevention
and security metadata. For document content, the role depends on the launch
relationship: the operator may be controller for a direct individual service or
processor/subprocessor for a business customer's content. The repository cannot
choose that commercial/legal relationship.

A public business processor service requires an Article 28 customer processing
agreement and documented subprocessors. A direct service requires approved
controller purposes and lawful bases. Neither is inferred here.

## Cookies, browser storage and logging

- No analytics, advertising, marketing tags or consent-requiring storage exist.
- Aethelgard writes no user-derived localStorage, sessionStorage, IndexedDB,
  Cache Storage or application cookie state.
- Turnstile normally returns a one-use token. It creates `cf_clearance` only
  when dashboard pre-clearance is enabled; that setting is not repository data.
- Public and private Worker observability is disabled and application-content
  logging is forbidden and tested. Provider operational metadata remains outside
  Aethelgard application storage.

## Operational accountability

- Data-subject requests: use the runbook procedure and contact processors for
  any metadata Aethelgard cannot inspect or delete directly.
- Breach: use the runbook incident procedure; preserve no document content as
  evidence and meet the applicable assessment/notification deadline.
- Provider changes: re-run this register before accepting a new processor,
  subprocessor, model provider, retention rule or transfer location.
- The public Privacy page maps this inventory and must not be promoted while an
  `OWNER INPUT` or `GDPR RELEASE BLOCKER` item remains.

## Minimum unresolved owner/legal decisions

1. Operator/controller legal identity, establishment, postal address, privacy
   contact, DPO status and competent supervisory authority.
2. Direct-service, business-processor or mixed launch relationship; approved
   Article 6 bases and any Article 9/children restriction.
3. Account ownership/DPA acceptance for Cloudflare, Groq and OpenRouter, plus
   any completed transfer assessment and customer Article 28 agreement.
4. Groq ZDR; OpenRouter logging/input-use; Turnstile mode, hostnames and
   pre-clearance dashboard settings.
5. A compliant fixed contractual basis for every model provider reachable via
   `openrouter/free`, or owner approval for an Architecture 2.1 correction.
6. Legally reviewed Terms covering submission authority, unlawful use,
   informational output, supported scope and no uptime SLA.
