# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
