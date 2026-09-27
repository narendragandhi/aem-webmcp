# AEM WebMCP reference

A community implementation and practical cookbook for browser agents working with Adobe Experience Manager.

**Start with the [form journey](docs/FORM-JOURNEY.md).** It demonstrates native declarative discovery, an imperative business tool, visible confirmation, cancellation, revision checks, and a shared human/agent submission path.

WebMCP remains experimental. This repository is a reference implementation with demo backends, not a production certification. See the [compatibility matrix](docs/COMPATIBILITY.md) for measured results and limitations.

## Try it without AEM

Requires Node.js 22 or newer. From the repository root:

```sh
node test-site/server.mjs
```

Open <http://127.0.0.1:4178>. The manual form works without WebMCP. The local server returns a clearly labeled simulated receipt; it does not store messages or create tickets.

For native tools, use a compatible Chrome build with `chrome://flags/#enable-webmcp-testing` enabled. The playground displays the tools the browser actually reports. Click **Enable assistant access**, approve access, then use the browser tool inspector. A fresh confirmation is required before sending each request.

## Learn and integrate

| Resource | What you get |
| --- | --- |
| [Getting started](docs/GETTING-STARTED.md) | Build, clientlibs, AEM installation and smoke checks |
| [Flagship form journey](docs/FORM-JOURNEY.md) | Complete runnable example, AEM integration boundaries and acceptance steps |
| [API reference](docs/API-REFERENCE.md) | Native tools, public wrappers, cancellation, schemas and results |
| [Compatibility](docs/COMPATIBILITY.md) | Draft versus shipped APIs, tested browser versions, native versus fallback evidence |
| [AEM cookbook](docs/COOKBOOK.md) | Sites, Forms, Content Fragments, CIF, authoring and Edge Delivery integration patterns |
| [Deployment](docs/DEPLOYMENT.md) | Author/publish separation, CSRF, Dispatcher, caching and frame policies |
| [Mini Paint lessons](docs/MINI-PAINT-LESSONS.md) | Shared commands, human edits, undo and transport verification applied to AEM |
| [Roadmap](docs/ROADMAP.md) | Remaining work with explicit completion criteria |
| [SLICC bridge](docs/SLICC-INTEGRATION.md) | Optional application adapter; separate from native WebMCP |

## Verify

```sh
npm ci --prefix ui.apps
npm test --prefix ui.apps -- --runInBand
npm run lint --prefix ui.apps
mvn -B -pl core test

npm ci --prefix playwright-tests
npm exec --prefix playwright-tests -- playwright install chromium
npm run test:reference --prefix playwright-tests

# Installed Chrome; absence of the required native API is a failure.
WEBMCP_BROWSER_CHANNEL=chrome npm run test:native --prefix playwright-tests
```

The reference suite serves the clientlib sources directly. No AEM, LLM key or mocked browser API is required. Native certification is separate from passing ordinary DOM tests. CI runs both reference and native Chrome checks, not just a test inventory.

## What is included?

- An imperative adapter using `document.modelContext` with a legacy `navigator.modelContext` fallback.
- Core Component discovery helpers and the existing 25 generic actions.
- An opt-in JSON form example with native declarative annotations.
- Per-execution cancellation and per-submission confirmation.
- OSGi settings consumed by demo endpoints and rendered into page configuration.
- Optional AI demos and a SLICC bridge, with separate deployment requirements.

The cart and legacy form servlet are demos. Disabling their mock mode does not create a production backend. Content Fragment service limitations and unverified AEM deployment variants are tracked in the roadmap.

## Standards and community

Start with the [WebMCP draft](https://webmachinelearning.github.io/webmcp/) and [Chrome documentation](https://developer.chrome.com/docs/ai/webmcp/). Native WebMCP runs in a page context; it is distinct from a remote MCP server and from JSON-LD metadata.

Community project; not maintained or endorsed by Adobe. Contributions should include a runnable example and independent outcome assertions. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the Apache-2.0 [license](LICENSE).
