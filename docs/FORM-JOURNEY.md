# A visible, cancelable support request

This executable example gives people and agents one visible form and one submission function. It is a local receipt simulator, not a ticket-delivery service.

## Run

From the repository root, run `node test-site/server.mjs` and visit <http://127.0.0.1:4178>. Requires Node.js 22+. Use fictional details.

The server serves current clientlib sources under `/clientlib/`, preventing copied-bundle drift.

## Contracts

| Entry | Behavior |
| --- | --- |
| `prepare_support_request` | Native declarative form; browser fills it, user submits manually. No `toolautosubmit`. |
| `inspect_submit_support_request` | Returns revision, validity and pending state without field values. |
| `submit_support_request` | Validates input, checks optional `expectedRevision`, fills the form, confirms exact values, then sends. |
| Manual Review request button | Uses the same validation, confirmation and JSON submission function. |
| `form.webmcpSubmit(signal)` | Application adapter used by generic `submitForm`; not a browser API. |

Native form attributes and `SubmitEvent.respondWith()` connect declarative submission to its asynchronous outcome. See the [declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api).

Imperative input: `fullName`, `email`, `message` and optional integer `expectedRevision`. A stale revision fails before replacing a human edit. The snapshot is checked again after confirmation.

## Acceptance journey

1. Without native WebMCP, complete the human flow.
2. Submit invalid fields: no confirmation or request.
3. Enter valid fictional data and inspect the confirmation's exact values.
4. Cancel: no submission.
5. Confirm: show the backend response with `demo: true` and its receipt.
6. Simulate an HTTP error: both visible and tool results remain failures.
7. Invoke through native discovery/execution, not just a local function.
8. Cancel during confirmation: close the dialog and send nothing.
9. Inspect a revision, edit manually, then propose the old revision: reject it.
10. Assert actual field and network state independently of tool success claims.

Cancellation after a request is sent cannot guarantee server rollback. Verify delivery before retrying; production needs backend idempotency and receipt lookup.

## Reuse in AEM

Retain installed Core/Adaptive Forms components and their configured submit actions. Add native annotations through a narrowly scoped proxy/template extension or approved enhancement.

The optional `form-journey.js` attaches only to `form[data-webmcp-json-form]` with a unique `data-webmcp-tool`. Use it only with an existing same-origin endpoint accepting these JSON fields and returning JSON with `success: true`. Include a status element inside the form. For authenticated AEM requests, `data-webmcp-csrf="granite"` fetches a token and sends `CSRF-Token`.

The legacy `FormSubmissionServlet` expects form parameters and a custom session token. It is not the JSON adapter's production backend. Its response identifies demo validation.

Call `form.webmcpDestroy()` before removing a form in an SPA/editor. `foundation-contentloaded` initializes new opt-in forms.

## Source

- [HTML](../test-site/form-journey.html)
- [Adapter](../ui.apps/src/main/content/jcr_root/apps/aem-webmcp/clientlibs/clientlib-webmcp/js/form-journey.js)
- [Local server](../test-site/server.mjs)
- [Browser tests](../playwright-tests/reference/forms.spec.ts)
- [Deployment](DEPLOYMENT.md)
