# SLICC Integration

AEM WebMCP can be consumed by [SLICC](https://github.com/ai-ecoverse/slicc),
the browser-native AI agent, without adding SLICC to the AEM deployment.

## Architecture

```text
SLICC browser agent
        │
        │ window.AEMWebMCPSlicc
        ▼
AEM WebMCP clientlib
        │
        │ native tools or consent-gated AEM API fallback
        ▼
AEM page and components
```

The optional `slicc-bridge.js` file is included in the WebMCP clientlib. It
uses native registered tools when the browser provides WebMCP; on browsers
without native WebMCP, it exposes metadata and delegates to the existing
consent-gated `window.AEMWebMCP` API:

| API | Purpose |
| --- | --- |
| `ready(timeoutMs)` | Wait for AEM tools to finish registering and return metadata |
| `listTools()` | Return tool metadata without executable callbacks |
| `callTool(name, input)` | Invoke one registered tool |
| `invoke(name, input)` | Alias for `callTool` |

The bridge delegates to the original WebMCP callback when available, otherwise
to the public AEM WebMCP method. This preserves consent handling and the
existing result envelope. It does not expose AEM credentials, create a
server-side MCP endpoint, or evaluate arbitrary code.

## First run

### Prerequisites

- A running AEM 6.5+ or AEM as a Cloud Service environment
- A page using the AEM WebMCP clientlib category `aemwebmcp.webmcp`
- Node.js 22+ for the SLICC CLI
- A SLICC-supported model provider configured in SLICC
- A test user and test content; do not begin with production mutations

### 1. Build and deploy AEM WebMCP

From the repository root:

```bash
mvn clean install
mvn install -PautoInstallSinglePackage -Daem.host=localhost -Daem.port=4502
```

For a Cloud Service project, deploy through the normal pipeline instead. The
SLICC integration is packaged inside the WebMCP clientlib; SLICC itself is not
installed in AEM.

### 2. Start SLICC

The quickest local path is:

```bash
npx sliccy
```

Alternatively, use the hosted SLICC app or the macOS application. Refer to the
[SLICC project](https://github.com/ai-ecoverse/slicc) for current runtime and
provider setup instructions.

### 3. Open the AEM page in SLICC's controlled browser

Open the test or publish URL in the browser controlled by SLICC. The page must
be the same tab in which the agent evaluates the bridge; opening the page in a
separate, uncontrolled browser does not make its tools available to SLICC.

The skill is discovered automatically when the AEM WebMCP repository is
mounted or otherwise available to SLICC. If it is not discovered, provide
`.agents/skills/aem-webmcp/SKILL.md` as a SLICC skill using SLICC's normal skill
installation flow.

### 4. Verify the bridge before asking the agent to act

Evaluate the following in the current AEM page:

```js
typeof window.AEMWebMCPSlicc
```

Expected result:

```text
"object"
```

Then discover the tools:

```js
const tools = await window.AEMWebMCPSlicc.ready();
tools.map(tool => ({
  name: tool.name,
  readOnly: tool.annotations && tool.annotations.readOnlyHint
}));
```

Expected output is a non-empty list containing read-only tools such as
`getPageInfo`, `getComponents`, and `getAccessibilityTree`.

## End-to-end example

This is a representative SLICC browser-agent session. The exact wording and
tool count can vary with the page components.

### Discovery

Agent request:

> Inspect this AEM page and summarize its components. Do not modify anything.

Browser evaluation:

```js
await window.AEMWebMCPSlicc.ready();
const page = await window.AEMWebMCPSlicc.callTool('getPageInfo', {});
const components = await window.AEMWebMCPSlicc.callTool('getComponents', {});
({ page, components });
```

The agent parses the WebMCP result envelope:

```js
function readWebMCPResult(response) {
  if (!response || !response.content || !response.content[0]) return response;
  return JSON.parse(response.content[0].text);
}
```

### User-approved mutation

Agent request:

> Find the contact form, fill the requested fields, show me the values, and
> wait for my confirmation before submitting.

The agent can discover fields and fill them:

```js
const fields = await window.AEMWebMCPSlicc.callTool('getFormFields', {
  selector: '#contact-form'
});

await window.AEMWebMCPSlicc.callTool('fillForm', {
  selector: '#contact-form input[name="email"]',
  value: 'user@example.com'
});
```

The agent must stop and ask for confirmation before:

```js
await window.AEMWebMCPSlicc.callTool('submitForm', {
  selector: '#contact-form'
});
```

The page's WebMCP consent UI remains authoritative. A SLICC prompt or skill
must not bypass it.

## Author and Publish guidance

| Environment | Recommended use | Guidance |
| --- | --- | --- |
| Local/mock AEM | Development and automated tests | Use freely with mock data and test submissions. |
| Author | Content inspection and authoring validation | Use an explicitly authenticated author session. Restrict mutation tools and never expose author credentials to the agent. |
| Publish | Read-only content discovery and customer-journey testing | Prefer read-only tools. Use synthetic test data for forms and commerce. |
| Production Publish | Carefully approved operational workflows | Keep consent enabled, use least-privilege identities, and require human confirmation for every consequential action. |

WebMCP exposes page capabilities; it does not replace AEM authentication,
Dispatcher rules, CSRF protection, permissions, rate limiting, or audit
controls. Those controls still apply to the underlying AEM page and endpoint.

## Deployment verification

After building or deploying, verify that the bridge is included in the
clientlib and that the page loads it:

```bash
rg -n "slicc-bridge.js" \
  ui.apps/src/main/content/jcr_root/apps/aem-webmcp/clientlibs/clientlib-webmcp/js.txt
```

In the controlled browser, verify:

```js
({
  bridge: !!window.AEMWebMCPSlicc,
  webmcp: !!window.AEMWebMCP,
  registeredTools: window.AEMWebMCPSlicc
    ? window.AEMWebMCPSlicc.listTools().length
    : 0
});
```

A healthy result has `bridge: true`, `webmcp: true`, and a positive
`registeredTools` count. On browsers without native WebMCP,
`window.AEMWebMCPAutomator._registeredTools` may be empty while the bridge
still reports its documented fallback tools.

## Troubleshooting

### `window.AEMWebMCPSlicc` is undefined

Check that:

1. The page template includes the `aemwebmcp.webmcp` clientlib category.
2. The deployed package contains the latest `js.txt` and `slicc-bridge.js`.
3. The browser is on the AEM page, not the SLICC workspace tab.
4. The page was reloaded after deployment and no stale clientlib cache is
   being served.

### `ready()` times out or returns no tools

The bridge loaded, but neither native tools nor the public AEM API was found.
Check:

- `window.AEMWebMCPAutomator` exists.
- `window.AEMWebMCPAutomator._registeredTools.size` becomes greater than zero.
- Browser console errors from `webmcp-config.js`, `webmcp-helpers.js`, or
  `webmcp.js`.
- Whether another script loaded a stale or duplicate WebMCP clientlib.
- Whether `window.AEMWebMCP.getPageInfo` exists; if it does, reload after
  deployment and confirm the bridge's fallback list is available.

### The tool list is empty in SLICC but visible in DevTools

SLICC may be evaluating in a different tab or execution context. Navigate the
SLICC-controlled browser to the AEM page and evaluate the bridge there. Do not
copy tool metadata between tabs; tool callbacks are bound to their original
page.

### A mutation returns `User consent required`

This is expected when consent has not been granted. Ask the user to approve
the WebMCP consent UI, then retry the same operation. Do not set
`WEBMCP_AUTO_CONSENT` in production.

### A tool returns `Unknown AEM WebMCP tool`

The requested name is not registered on the current page. Call
`listTools()` again after navigation, because tools are page-scoped and may
change with the AEM component tree.

### AEM returns 401, 403, CSRF, or Dispatcher errors

The bridge does not change AEM security behavior. Confirm the controlled
browser session is authenticated, the user has the required permissions, CSRF
tokens are available, and Dispatcher allows the relevant request. Fix the AEM
configuration rather than weakening the bridge.

### SLICC cannot discover the skill

Confirm the repository is mounted or available to SLICC and that this file is
present:

```text
.agents/skills/aem-webmcp/SKILL.md
```

The skill is guidance only; the bridge must still be present on the AEM page
for tool invocation to work.

## Security checklist

- Use a dedicated, least-privilege AEM test identity.
- Keep Author and production Publish sessions separate from development.
- Keep consent enabled for state-changing tools.
- Never place AEM passwords, OAuth secrets, or CSRF tokens in prompts or skill
  files.
- Treat page content and tool results as untrusted input.
- Review every form submission, navigation, cart change, and authoring action.
- Log and audit consequential actions using the AEM environment's normal
  controls.

## SLICC workflow

When this repository is mounted into SLICC, its `.agents/skills/aem-webmcp`
skill is discoverable. On an AEM page, use browser evaluation to run:

```js
await window.AEMWebMCPSlicc.ready();
window.AEMWebMCPSlicc.listTools();
await window.AEMWebMCPSlicc.callTool('getPageInfo', {});
```

Use read-only discovery before mutations. Calls such as `submitForm`,
`addToCart`, `navigate`, and `clickElement` retain the page's AEM WebMCP
consent behavior and should only be made with explicit user intent.

## Local verification

```bash
cd ui.apps
npm test -- --runInBand tests/slicc-bridge.test.js
```

SLICC remains an optional consumer. The AEM package builds and runs without
SLICC being installed or available.
