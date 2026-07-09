# Code Review — July 2026

Review of aem-webmcp against the current WebMCP specification (W3C Web
Machine Learning CG Draft, published 23 April 2026) and general
quality/security criteria. Findings are listed with their remediation
status; fixes were applied in the accompanying change set.

## Spec landscape (as of July 2026)

- WebMCP is a **W3C Community Group Draft Report** edited jointly by
  Microsoft and Google (not Google-only, and not yet on the Standards
  Track). Spec: <https://webmachinelearning.github.io/webmcp/>
- The API entry point is **`navigator.modelContext`** with:
  - `provideContext({ tools })` — register the page's base tool set
  - `registerTool(tool)` / `unregisterTool()` — dynamic per-tool management
  - `requestUserInteraction()` — browser-mediated user confirmation
  - Tool descriptor: `name`, `description`, `inputSchema` (JSON Schema),
    **`execute` callback**, optional `title` and
    `annotations` (`readOnlyHint`, `untrustedContentHint`)
- Browser support: **Edge 147** ships native support; **Chrome 149** runs
  an open origin trial (Gemini in Chrome consumes the tools).

## Findings and remediation

### Critical

| # | Finding | Status |
|---|---------|--------|
| 1 | Tool registration used non-spec APIs — `modelContext.declareAction()` in `webmcp.js` and `modelContext.register()` in the component agents. No spec-compliant browser/agent could discover any tool. | **Fixed** — registration now goes through `provideContext({tools})` with `registerTool()`/legacy fallbacks; tools carry JSON Schema `inputSchema`, `annotations.readOnlyHint`, and wired `execute` callbacks. |
| 2 | CSRF fail-open in `CommerceCartServlet`: requests with no session token passed validation. | **Fixed** — validation fails closed; `GET` now issues a `SecureRandom` token (returned in the cart JSON) that `POST` must echo. `FormSubmissionServlet` already failed closed and shares the same session attribute. |
| 3 | `getPageScreenshot()` injected html2canvas from cdnjs at runtime (CSP violation, supply-chain risk). | **Fixed** — CDN load removed; the tool only runs if the site bundles html2canvas. |
| 4 | `imagetagger.js`/`voicecommand.js` called `AEMWebMCPAutomator.registerTool()`, which did not exist → `TypeError` at init. | **Fixed** — `registerTool()` implemented on the automator; agents route through it (avoids double registration). |

### High

| # | Finding | Status |
|---|---------|--------|
| 5 | Two diverging copies of `webmcp.js`: `clientlib-base` shipped a stale copy while also embedding `aemwebmcp.webmcp`, so both loaded and fought over `window.AEMWebMCP`. | **Fixed** — stale copy deleted; `clientlib-base/js.txt` no longer lists it. |
| 6 | Dead duplicate agent JS under `components/webmcp/{imagetagger,recipegenerator,voicecommand}/` (unreferenced by any clientlib or HTL). | **Fixed** — deleted. |
| 7 | Rate limiting keyed on client-controlled `X-Forwarded-For` (trivially spoofable; also let attackers grow the tracking map without bound). | **Fixed** — keys on `remoteAddr`; cleanup task now evicts idle rate-limit entries. |
| 8 | In-memory session cart won't survive restarts or horizontal scaling on AEMaaCS publish; a JCR-backed `CartPersistenceService` exists but is unused by the servlet. | **Documented** as demo-only in the servlet javadoc. Production should use `CartPersistenceService` or a commerce backend. |

### Medium / low

| # | Finding | Status |
|---|---------|--------|
| 9 | `enhanceByPatterns()` tagged any element with `[id*="form"]` as a form (false positives such as `#platform-info`). | **Fixed** — only real `form` elements are pattern-tagged. |
| 10 | `getSelector()` produced non-unique `tag.class` selectors — agents could act on the wrong element. | **Fixed** — elements are stamped with a unique `data-webmcp-id`. |
| 11 | Unconditional `console.log` in `_checkConsent()` and `getAllComponents()`. | **Fixed** — gated behind debug flag. |
| 12 | Consent hand-rolled only; spec now provides `requestUserInteraction()`. | **Fixed** — state-changing tools prefer the native mechanism, falling back to page-level consent flags/UI. |
| 13 | README drift: "developed by Google" (it's a joint MS+Google W3C CG effort), stale "1.0 → 2.0 migration" section, outdated browser-support answer. | **Fixed.** |
| 14 | `.DS_Store` files and Playwright reports/test-results committed. | **Fixed** — untracked and gitignored. |

## Not addressed (follow-ups)

- **Wire `CommerceCartServlet` to `CartPersistenceService`** for real
  persistence, or gate the in-memory cart behind `commerce.mockData`.
- **Adopt AEM's Granite CSRF framework** (`granite.csrf.standalone` +
  `CSRF-Token` header) instead of the per-servlet token, so protection is
  uniform across all POST endpoints.
- **`exposedTo` origins option** on tool registration once agent origins
  are known for the deployment.
- **Origin-trial token** for Chrome 149 on demo deployments.
- Consider `unregisterTool()`/AbortSignal cleanup for SPA-style component
  teardown (relevant to the Image Tagger / Recipe Generator demos).

## Verification

- `mvn -pl core test` — 71 tests, 0 failures.
- `node --check` on all edited clientlib JS — clean.
