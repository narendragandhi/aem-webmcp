# Conference demonstration: shared human/agent state

Use fictional data. The standalone backend returns a simulated receipt and stores no ticket.

## Preflight

Run `node test-site/server.mjs`, then open http://127.0.0.1:4178 in a compatible Chrome with WebMCP testing enabled. Run the required native suite before rehearsal:

```sh
WEBMCP_BROWSER_CHANNEL=chrome npm run test:native --prefix playwright-tests
```

Record the browser version and retain the capability attachment. Click **Enable assistant access**, then **Allow Access**. The browser tools panel must show native discovery. This inspector walkthrough demonstrates API behavior; only a separate recorded agent journey demonstrates model planning.

## Discover and inspect

In DevTools, define helpers once. Choose the argument contract before calling; never retry a mutation just because parsing failed.

```js
var mc = document.modelContext || navigator.modelContext;
var tools = await mc.getTools();
console.table(tools.map(t => ({ name: t.name, origin: t.origin })));
// Set true only for the rehearsed Chrome build below 155.
var legacyArguments = false;
var invoke = async (name, args = {}) => {
  var tool = (await mc.getTools()).find(t => t.name === name);
  if (!tool) throw new Error('Native tool missing: ' + name);
  var value = await mc.executeTool(tool, legacyArguments ? JSON.stringify(args) : args);
  return typeof value === 'string' ? JSON.parse(value) : value;
};
var before = await invoke('inspect_submit_support_request');
```

## Demonstrate a stale proposal

Manually edit the message field, then execute:

```js
var proposal = {
  fullName: 'Alex Example', email: 'alex@example.com',
  message: 'Please help restore my account access.',
  expectedRevision: before.revision
};
await invoke('submit_support_request', proposal);
```

Expect `STALE_REVISION`. Show that the human's text is unchanged and no POST occurred. Explain that callers must supply the revision to get this optimistic-concurrency check.

## Cancel, then confirm

Read a fresh revision and start the invocation without awaiting in the console:

```js
proposal.expectedRevision = (await invoke('inspect_submit_support_request')).revision;
var pending = invoke('submit_support_request', proposal);
```

Click **Cancel** in the confirmation dialog. Inspect `await pending` and the Network panel: no `/api/support` request should have been sent.

Read another fresh revision, invoke again, inspect the exact values, and click **Submit request**. Show both the visible receipt and the returned `demo: true` result. Explain that real AEM delivery needs the existing submit action/backend and its receipt.

## Failure and fallback

The reference tests cover backend errors and cancellation. Keep their reports available rather than improvising destructive failures on stage. If the browser lacks native WebMCP, demonstrate the human form and label it as the reference fallback.

For a hosted-agent demonstration, record the client/model/browser versions and independently check the same outcomes. A successful DevTools invocation is not hosted-agent acceptance.
