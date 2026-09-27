# Lessons from Mini Paint WebMCP

Reviewed 2026-09-11 at [commit 8f2979a](https://github.com/frappierer/mini-paint-webmcp/tree/8f2979a5bb5e50c6285436a0109419c1d1dacf7b). Architectural inspiration, not an imported dependency; no source code was copied.

| Observed pattern | AEM application | Status here |
| --- | --- | --- |
| Shared registry/commands | Tools and human UI use the same operation | Shared form submission; broader legacy consolidation remains |
| Revision checks | Protect intervening human edits | Inspection tool, optional expected revision and confirmation snapshot |
| Shared undo history | Use supported AEM editor history | Authoring acceptance criterion; no invented JCR undo |
| Browser versus local registry comparison | Catch tools invisible to a browser | Native discovery/execution tests |
| Assertions against editor state | Verify actual fields, requests and receipts | Browser outcome checks |
| Environment diagnostics | Separate native, fallback and deployed evidence | Playground and compatibility matrix |

The [registry](https://github.com/frappierer/mini-paint-webmcp/blob/8f2979a5bb5e50c6285436a0109419c1d1dacf7b/web-src/src/webmcp/toolRegistry.js) centralizes dispatch/validation. It logs arguments/results; an AEM form adaptation should avoid retaining personal data.

The [revision implementation](https://github.com/frappierer/mini-paint-webmcp/blob/8f2979a5bb5e50c6285436a0109419c1d1dacf7b/web-src/src/editor/revision.js) tracks editor changes as well as tool changes. Our form uses its own value snapshot.

The [adapter](https://github.com/frappierer/mini-paint-webmcp/blob/8f2979a5bb5e50c6285436a0109419c1d1dacf7b/web-src/src/webmcp/adapter.js) separates browser-version differences. We select the tested input contract before invoking a mutation rather than retrying a write after a transport error.

The [transport tests](https://github.com/frappierer/mini-paint-webmcp/blob/8f2979a5bb5e50c6285436a0109419c1d1dacf7b/e2e-webmcp/00-webmcp-core.spec.js) permit native or polyfilled transport. Our native certification must not inject a mock/polyfill.

Its reported iframe-discovery limitation is client-specific evidence, not a browser-standard prohibition. App Builder hosting does not establish AEM author/publish, Dispatcher or permission compatibility. Upstream test counts remain upstream claims; we did not run its suite.
