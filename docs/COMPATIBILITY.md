# Compatibility and evidence

Reviewed 2026-09-11 against the [Community Group draft](https://webmachinelearning.github.io/webmcp/) and [Chrome documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api). This is experimental, not a W3C Recommendation.

| Surface | Project contract |
| --- | --- |
| Registration | Prefer `document.modelContext`, then legacy `navigator.modelContext`; tolerate synchronous or Promise results. |
| Teardown | Abort registration controller; distinct from execution cancellation. |
| Execution | Forward callback `options.signal` into application work. |
| Results | Native callbacks return plain serializable values; SLICC adds MCP envelopes at its boundary. |
| Schema metadata | Accommodate serialized schemas in older browsers and objects in newer builds. |
| Tool invocation | Verified Chrome 152 requires JSON-string input; current docs describe object input and deprecate strings from Chrome 155. Select the contract before executing; do not retry a mutation after a result-parsing failure. |
| Consent | Application consent and confirmation; no obsolete `requestUserInteraction()` dependency. |
| Forms | Native attributes expose declarative tools; `data-webmcp-*` are project metadata. |

Annotations are hints, not authorization. Caller annotations, including `consequentialHint`, are preserved.

## Evidence

| Layer | Evidence | Limit |
| --- | --- | --- |
| Jest/jsdom | Contract and regression checks | Not native conformance |
| Bundled Playwright Chromium | DOM/HTTP form journey | Native checks skip explicitly when unsupported |
| Chrome 152.0.7977.83, macOS | Native imperative discovery/execution and declarative discovery passed on 2026-09-11 with testing flags | Not hosted-agent or complete draft certification |
| Live AEM + Dispatcher | Pending; no author on localhost:4502 during this implementation | No production deployment claim |
| Hosted agent | Manual acceptance pending | Browser API tests do not certify named AI clients |

Run `npm run test:reference --prefix playwright-tests` or `WEBMCP_BROWSER_CHANNEL=chrome npm run test:native --prefix playwright-tests`.

The native gate fails if required APIs are missing, never injects a mock/polyfill, and attaches browser version/capabilities to its report. CI retains reports and traces.

Use HTTPS or trustworthy localhost, origin isolation and the `tools` Permissions Policy. See [Chrome environment requirements](https://developer.chrome.com/docs/ai/webmcp/) and [deployment](DEPLOYMENT.md). JSON-LD and local registries do not prove native discovery. Historical July reports are superseded by this matrix.
