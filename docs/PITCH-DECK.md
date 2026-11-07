# AEM as an Agent-Accessible Application

A 40-minute technical session for senior AEM developers and architects.
Community reference implementation; experimental WebMCP; no Adobe endorsement.

## 1. The architectural question (3 minutes)

How can people and agents operate the same AEM experience without losing validation, authorization, or visible state?

Show one visible form and its business tool contract. The contribution is a reusable integration pattern, not a new model or autonomous production backend.

## 2. Where WebMCP fits (4 minutes)

| Surface | Responsibility |
| --- | --- |
| Browser WebMCP | Discover and execute page-owned tools in the current document/frame context |
| Remote MCP | Connect agent runtimes to server-side capabilities |
| AEM application/API | Enforce identity, permissions, validation, persistence and receipts |
| JSON-LD | Describe content; it does not register executable browser tools |

WebMCP is a Community Group draft, not a W3C Standard. Chrome offers an origin trial and a testing flag. Date every browser compatibility claim.

Sources: [WebMCP draft](https://webmachinelearning.github.io/webmcp/), [Chrome documentation](https://developer.chrome.com/docs/ai/webmcp/).

## 3. Reuse the AEM application (5 minutes)

Extend existing Core Component proxies and existing submit actions. Bind tools to application operations rather than creating a parallel mutation path. Use model-specific persisted queries for Content Fragment delivery and existing commerce commands for carts.

The standalone form is executable. Adaptive Forms, CIF, authoring and Edge Delivery remain integration recipes until their fixtures and deployment checks pass.

## 4. Tool contracts and shared state (6 minutes)

Show `prepare_support_request`, `inspect_submit_support_request`, and `submit_support_request`.

- Explicit input constraints and bounded outputs.
- An optional expected revision rejects proposals made against older human input.
- Fresh confirmation displays the proposed values.
- The values and action are checked again immediately before sending.
- Cancellation before sending prevents the request; cancellation after sending cannot guarantee rollback.

Explain why registration teardown and execution cancellation have different lifecycles. Annotations describe intent; they are not server authorization.

## 5. Live demonstration (10 minutes)

Follow [DEMO-SCRIPT.md](DEMO-SCRIPT.md). Show native discovery, a human edit, stale proposal rejection, cancellation with zero requests, and a confirmed simulated receipt. Use fictional data.

If native support is absent, explicitly switch to the human/reference demonstration. Do not call a JavaScript registry a native browser result.

## 6. AEM trust boundaries (7 minutes)

- HTTP session and authenticated identity scope chat history; caller-supplied IDs cannot select another conversation.
- Granite CSRF and Sling Referrer filters remain responsible for request protection.
- Dispatcher allows only the required method/path and does not cache CSRF tokens or personalized results.
- Browser consent is not an ACL. Prompt injection remains a concern even for structured tools.
- Persisted queries select published fields; disabling mocks never silently returns fabricated content.
- Production writes require real persistence, ownership, idempotency and verifiable outcomes.

The server chat endpoint is explicitly simulated. It does not call an LLM.

## 7. Evidence and open work (5 minutes)

Show [COMPATIBILITY.md](COMPATIBILITY.md) and the reports from the exact rehearsed browser build. CI executes JavaScript contracts, reference browser journeys and a required native Chrome gate. A local pass does not imply a remote CI run has completed.

Live AEM/Dispatcher, hosted-agent behavior and AEM 6.5/Cloud deployment variants require separate evidence. A demo receipt is not message delivery. No measured ROI, component coverage count or performance gain is claimed.

Close with the concrete design lesson: give agents the same application operations, state checks and outcome evidence that people need.
