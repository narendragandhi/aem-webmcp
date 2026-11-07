# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Bind demo chat history to the HTTP session and authenticated user instead of caller-supplied IDs; bound incoming messages, remove message/session logging, and label simulated responses.
- Execute JavaScript, browser reference and native Chrome checks in CI; enforce lint/JSDoc failures and require browser jobs before release.
- Replace inferred Content Fragment queries and the private cache with an explicitly configured public persisted query. Real-mode listing fails closed; demo results are labeled. Remove reflected CORS headers in favor of platform policy.
- Support URL-encoded AEM form requests and Granite CSRF headers, with a second state check after asynchronous token retrieval. Remove the form servlet's separate session-token scheme in favor of Granite and Sling filters.
- Replace outdated conference claims and demo instructions with the shared-state journey and dated verification evidence.

### Migration
- Content Fragment non-mock mode requires `persisted.query.url`, the `path` variable and `fragment` response alias. Old `graphql.endpoint`, `cache.ttlSeconds` and `max.depth` settings are ignored. The exported services package is version 1.1; cache-clear methods remain deprecated no-ops.
- The legacy `form.csrfEnabled` setting no longer controls request protection. Preserve Granite CSRF and Sling Referrer filters and verify authenticated/anonymous behavior through Dispatcher. See [deployment](docs/DEPLOYMENT.md).
- Chat callers can no longer select a conversation through `sessionId`. Cookie session plus authenticated identity define the demo history; it remains process-local and bounded, not a durable conversation store.

## [2.1.0] - 2026-07-27

### Changed
- Split `webmcp.js` (1393 lines) into three focused modules: `webmcp-config.js`, `webmcp-helpers.js`, `webmcp.js`
- Removed `provideContext()` as primary API (removed from W3C spec March 2026); `registerTool()` is now the sole registration method
- Updated `@mcp-b/webmcp-types` from `^2.0.9` to `^3.0.0`

### Added
- `getTools()` async method delegating to native `mc.getTools()` or falling back to internal registry
- `ontoolchange` event support
- `AbortSignal`/`signal` option for automatic tool unregistration
- Tool name validation (`_isValidToolName()`: 1-128 chars, `/^[a-zA-Z0-9_\-.]+$/`)
- `untrustedContentHint` annotation on `getPageScreenshot`, `getAccessibilityTree`, `getSearchResults`
- `_getModelContext()` accessor: tries `document.modelContext` first, falls back to `navigator.modelContext`
- `_health` observability object: `{ registered, failed, skipped, lastError }`
- `sync-test-site.sh` to prevent clientlib/test-site drift
- Production hardening: consent guards, `Array.isArray()` checks, and try/catch in all agent files (contentagent, auditagent, authoragent, formagent)
- 59 spec-compliance unit tests (total: 107)

### Fixed
- `fallbackProcessInput` in `formagent.js` missing `async` keyword (caused parse-time SyntaxError killing entire concatenated clientlib)
- `contentagent.js` auto-indexing before consent granted
- `authoragent.js` calling non-existent `getSelector()` method

## [2.0.0] - 2026-07-20

### Changed
- Migrated from `navigator.modelContext` to `document.modelContext` (spec §4.1)
- Refactored tool registration to use `registerTool()` per tool with AbortSignal

## [1.2.0] - 2026-07-15

### Added
- Consent-based API exposure via `requestUserInteraction()`
- Debug panel for development
- Accessibility tree support
- Screenshot support for vision-enabled agents

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Core WebMCP integration for AEM Core Components
- Auto-detection of 50+ AEM Core Components
- Zero-configuration clientlib deployment
