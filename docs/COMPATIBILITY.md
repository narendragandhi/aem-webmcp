# Compatibility and evidence

Reviewed 2026-11-07 against the [Community Group draft](https://webmachinelearning.github.io/webmcp/) and [Chrome documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api). This is experimental, not a W3C Recommendation.

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
| Chrome 156.0.8078.81, macOS | 10/10 reference/native checks passed on 2026-11-07 with testing flags, including native discovery, execution and stale-revision rejection | Not hosted-agent or complete draft certification |
| Chrome 152.0.7977.83, macOS (historical) | Native imperative/declarative discovery and execution passed on 2026-09-11 | Earlier string-input contract |
| Live AEM + Dispatcher | Pending; no author on localhost:4502 during this implementation | No production deployment claim |
| Hosted agent | Manual acceptance pending | Browser API tests do not certify named AI clients |

Run `npm run test:reference --prefix playwright-tests` or `WEBMCP_BROWSER_CHANNEL=chrome npm run test:native --prefix playwright-tests`.

The native gate fails if required APIs are missing, never injects a mock/polyfill, and attaches browser version/capabilities to its report. The CI workflow now executes separate Chromium and Chrome jobs, retains reports/traces, and requires both before release. Remote CI has not been run for these local changes. Transport tests stub a token endpoint only to verify request encoding; they do not certify Granite filtering.

Use HTTPS or trustworthy localhost, origin isolation and the `tools` Permissions Policy. See [Chrome environment requirements](https://developer.chrome.com/docs/ai/webmcp/) and [deployment](DEPLOYMENT.md). JSON-LD and local registries do not prove native discovery. Historical July reports are superseded by this matrix.

## Local verification — 2026-11-07

- `mvn -B -pl core test`: 80 tests passed, including chat identity isolation and a loopback HTTP persisted-query fixture.
- `npm test --prefix ui.apps -- --runInBand`: 119 tests passed.
- `npm run lint --prefix ui.apps` and `npm run docs --prefix ui.apps`: passed.
- `WEBMCP_BROWSER_CHANNEL=chrome npm run test:native --prefix playwright-tests`: 10 passed on Chrome 156.0.8078.81, object-input invocation.
- `npm run test:reference --prefix playwright-tests`: 8 passed, 2 explicitly skipped native-only tests on bundled Chromium.
- `mvn -B package -DskipTests`: all ten reactor modules packaged. Tests were run separately above; this is not live AEM installation evidence.

Live AEM was unavailable at localhost:4502. Granite rejection, real persisted-query model/content, author/publish/Dispatcher behavior and hosted-agent acceptance remain pending. The simulation fixtures do not establish these claims.
