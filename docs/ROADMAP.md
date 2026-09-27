# Roadmap

## Implemented baseline

Shared consent, positional-call compatibility, native results, cancellation propagation, form confirmation/validation, a declarative/imperative playground, human-edit revision checks, expiring form limits, consumed OSGi settings, removal of administrative health sessions, browser/native gates and maintained entry documentation.

## Remaining completion criteria

| Work | Evidence required |
| --- | --- |
| Live AEM form journey | Real submit action through author/publish + Dispatcher, with receipts and authorization failures |
| Health check migration | Tagged platform health check and safe retirement of the custom selector |
| CSRF consolidation | Platform-compatible replacement of legacy session-token coupling, including anonymous behavior |
| All-tool validation | Maintained schema validator across native/bridge/debug with nested, required, bounds and unknown-argument checks |
| Generic tool availability | Page-relevant tools with dynamic lifecycle and duplicate-instance tests |
| AI component cancellation | Signals reach every voice/model/network operation |
| Content Fragments | Named model/persisted-query fixture replacing inferred-model queries and redundant cache |
| Commerce | Real backend, trusted prices, identity, idempotency and ownership |
| AEM compatibility | Separate Cloud SDK, 6.5 service-pack, Core Component and Java verification |
| Hosted-agent acceptance | Recorded client/version and complete human-agent journey |

Implement [cookbook recipes](COOKBOOK.md) individually with deployable fixtures. Authoring starts with one reversible task using shared editor history. Architectural recipes must not be labeled verified integrations.

Require executable quickstarts, working links and recorded browser capabilities in CI. Review upstream changes at release time and keep historical reports visibly archived.
