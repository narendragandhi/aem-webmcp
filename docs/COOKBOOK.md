# AEM WebMCP cookbook

Reuse the application's existing operations. Only the standalone form journey currently has executable end-to-end evidence here; the other entries are integration recipes to implement and validate.

| Use case | Existing capability | Tool design | Required evidence |
| --- | --- | --- | --- |
| Sites forms | Core Form proxy/submit action | Declarative preparation and confirmed submission | Fields, handlers, CSRF and receipt |
| Search | Search component and indexed query | Bounded semantic query with locale | Empty results, permissions and published URLs |
| Content Fragments | Model-specific persisted queries | Selected published fields and validated variables | Schema, access and Dispatcher cache |
| Adaptive Forms | Forms runtime and submit action | Prepare, validate and submit through the runtime | Conditional fields, attachments, drafts and outcomes |
| CIF commerce | Existing cart/backend commands | Identifiers, bounds and purchase preview | Server prices, identity, idempotency and receipt |
| Authoring | Editor commands and history | Revision-aware edits and explicit save/publish | Human edits, undo/redo, ACLs and frame ownership |
| Edge Delivery | Block lifecycle and form handlers | Relevant tools when blocks are ready | Mount/teardown, fallback and publish origin |
| Headless React | Application state and data client | Component-owned registrations | Navigation, stale references and cancellation |

## Forms

Use [FORM-JOURNEY.md](FORM-JOURNEY.md). Human and agent entry points reach one submission function. Extend existing AEM components; do not deploy the Node simulator as a production backend.

## Content Fragment delivery

Create a real model, content fixture and named persisted query. Bind a read-only tool to that fixed query with validated variables. Do not infer a model name from an asset path or expose arbitrary author queries on publish.

Adobe documents [persisted queries](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/headless/graphql-api/persisted-queries) for cacheable delivery. The older `ContentFragmentGraphQLService` is experimental: its persisted-query switch is unused and it maintains a separate cache. It is not the recommended integration path.

## Authoring

Demonstrate a human edit, agent inspection, an agent edit through the same editor command system, and human undo. Reject stale revisions. The [Mini Paint lessons](MINI-PAINT-LESSONS.md) motivate this design, but miniPaint's internal history objects are not AEM APIs.

## Contribution template

Include exact versions, native/fallback behavior, reused AEM capability, content fixture, input/output contracts, access scope, confirmation/cancellation/retry semantics, outcome assertions and author/publish/Dispatcher steps. Label unverified integrations explicitly.
