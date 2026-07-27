# WebMCP Implementations Across CMS Platforms

> Last updated: July 2026
>
> **Disclaimer:** This is a community project. It is not endorsed by, affiliated with, or maintained by Adobe. All comparisons below are based on publicly available code, documentation, and specifications as of the dates noted.

## Background: Two Protocol Families

There are two distinct protocols that both use the abbreviation "MCP" in the CMS space. They solve different problems and are not interchangeable.

**WebMCP** (W3C CG-DRAFT) is a browser-native API under `document.modelContext` that lets client-side JavaScript register structured tools for AI agents. Co-authored by Google and Microsoft, it ships as an origin trial in Chrome 149 (May 2026) with Edge support expected mid-2026. Tools execute in the page's JS context — they can access DOM, user session state, and browser APIs directly.

**MCP** (Anthropic's Model Context Protocol) is a server-side protocol for connecting AI clients (Claude Desktop, Cursor, VS Code) to external data sources via stdio or HTTP. Tools execute on the server, not in the browser. This is shipping now with broad adoption.

This document focuses on **WebMCP** implementations — browser-native, client-side tool registration. Server-side MCP implementations (Sanity, Directus, Contentful, etc.) are included for context but operate on a fundamentally different architecture.

## WebMCP Implementations by Platform

### AEM WebMCP (this project)

- **Repo:** github.com/narendragandhi/aem-webmcp
- **Status:** Production-ready (v2.1.0)
- **Approach:** Clientlib auto-loaded via AEM page component's `customfooterlibs.html`. Detects 50+ AEM Core Components via `data-webmcp-*` attributes and registers tools automatically.
- **Spec alignment:** Tracks W3C CG-DRAFT (July 21, 2026). Uses `document.modelContext.registerTool()` with `AbortSignal` support. `provideContext()` was removed from spec in March 2026; this project adapted accordingly.
- **Tool count:** 25+ (page discovery, navigation, forms, search, commerce, layout, accessibility, vision)
- **Key technical details:**
  - Consent flow via `requestUserInteraction()` for mutation tools (Shadow DOM UI bar)
  - `getAccessibilityTree` tool exposes WAI-ARIA semantics to agents
  - `getPageScreenshot` returns base64 for vision-enabled agents
  - `_health` observability object tracks registration success/failure
  - Debug panel via `WEBMCP_DEBUG=true`
  - Tests: 107 unit tests (Jest), no AEM dependency for unit testing
- **Limitations:**
  - AEM-specific — requires AEM page component with clientlib embedding
  - No server-side MCP endpoint (browser-only)
  - Native `modelContext` requires Chrome 149+ with origin trial flag; falls back to `window.AEMWebMCP` global

### WordPress: WebMCP Bridge

- **Repo:** wordpress.org/plugins/webmcp-bridge/
- **Status:** v1.6, 300+ active installs (as of July 2026)
- **Approach:** PHP plugin that registers tools via REST API endpoints and optional native `navigator.modelContext` registration. Admin settings page to enable/disable feature groups.
- **Tool count:** ~15 core + WooCommerce tools
- **Tools:** `search_posts`, `get_post`, `get_menu`, `get_categories`, `get_site_info`, `submit_contact_form`, plus WooCommerce: `woo_search_products`, `woo_get_product`, `woo_add_to_cart`, `woo_get_cart`, `woo_remove_from_cart`, `woo_apply_coupon`
- **Key technical details:**
  - REST API manifest at `/wp-json/webmcp-bridge/v1/manifest`
  - JavaScript frontend bridge with WebMCP browser API support and fallback
  - Optional Mescio for Agents integration adds `get_markdown_content` and `get_llms_txt`
  - WooCommerce integration is the strongest commerce toolset in any WebMCP implementation
- **What it does not implement:**
  - No consent flow (all tools execute without user confirmation)
  - No accessibility tree
  - No screenshot/vision
  - No debug panel or health observability
  - No declarative HTML tool registration

### TYPO3: brosua/webmcp

- **Repo:** packagist.org/packages/brosua/webmcp
- **Status:** Experimental proof of concept, TYPO3 v14.3+
- **Approach:** Composer package + Site Set. Middleware injects `webmcp.js` as ES module. ViewHelper adds `toolname`/`tooldescription` attributes to EXT:form `<form>` elements for declarative tool registration.
- **Tool count:** 4 (`page-get-summary`, `page-find-text`, `page-get-content`, `page-list-actions`)
- **Key technical details:**
  - Declarative approach: `<form toolname="..." tooldescription="...">` — native WebMCP implementation synthesizes tool definitions from HTML attributes
  - Respects TYPO3 access rights (fe_group, starttime, endtime, hidden)
  - Fires `webmcp:ready` event with `{ modelContext, register }` detail for custom tool registration
  - All tools are read-only (DOM only)
- **What it does not implement:**
  - No mutation/write tools
  - No consent flow
  - No commerce
  - No accessibility tree or vision
  - Requires Chrome 149+ — no polyfill or fallback

### Elementor (WordPress)

- **Repo:** github.com/elementor/elementor (PR #35479, merged April 2026)
- **Approach:** Adapter pattern — `WebMCPAdapter` bridges Elementor's internal MCP tool/resource registry to `navigator.modelContext`. Dual-adapter architecture supports both Angie SDK (Elementor's AI plugin) and native WebMCP.
- **Key technical details:**
  - Tools registered via `addTool()` in the editor are automatically exposed to WebMCP agents
  - Single `editor-resource-getter` meta-tool exposes all MCP resources by URI with partial string search
  - Supports both static URI resources and `ResourceTemplate` (dynamic URI matching)
  - `activateAdapters()` triggers on `DOMContentLoaded`
- **Limitations:**
  - Editor-focused — exposes editing tools, not end-user site functionality
  - `sendResourceUpdated` no-ops for WebMCP (no server-push); agents must poll
  - Error handling swallows adapter errors silently

### Webflow

- **Approach:** Code Embed with dynamic CMS data binding (May 2026 update). A single Code Embed inside a CMS Collection page can register tools whose output reflects the current CMS item.
- **Key technical details:**
  - May 19, 2026 Code Embed update added props and dynamic data support
  - `navigator.modelContext.registerTool()` called directly from Code Embed
  - CMS-bound: tool output can reflect live collection data via props
- **Limitations:**
  - Manual setup per page/collection
  - No component auto-detection
  - No consent flow, debug panel, or accessibility tools
  - Chrome-only progressive enhancement (no cross-browser fallback documented)

## Comparison Matrix

| Capability | AEM WebMCP | WordPress | TYPO3 | Elementor | Webflow |
|------------|-----------|-----------|-------|-----------|---------|
| Browser-native (no server) | Yes | Yes | Yes | Yes | Yes |
| Write/mutate tools | Yes | Yes | No | Yes | Yes |
| Consent flow (`requestUserInteraction`) | Yes | No | No | No | No |
| Declarative HTML tool registration | `data-webmcp-*` attrs | No | `toolname` attr on `<form>` | No | No |
| Content discovery API | `getComponents()` | REST manifest | `page-list-actions` | URI search | No |
| Commerce tools | `addToCart`, `updateCartQuantity` | WooCommerce suite | No | No | No |
| Accessibility tree | `getAccessibilityTree` | No | No | No | No |
| Screenshot/vision | `getPageScreenshot` | No | No | No | No |
| Debug/observability | Debug panel + `_health` | No | No | No | No |
| Component auto-detection | 50+ AEM Core Components | No | No | No | No |
| `AbortSignal` cleanup | Yes | No | No | No | No |
| `untrustedContentHint` annotation | Yes | No | No | No | No |
| `getTools()` for agent discovery | Yes | No | No | No | No |
| Non-browser fallback | `window.AEMWebMCP` global | REST API + JS bridge | None | None | None |
| Unit tests | 107 (Jest) | Not public | Not public | Internal | N/A |

## Server-Side MCP Implementations (reference only)

These use Anthropic's MCP protocol, not browser-native WebMCP. Included for context on what exists in the broader CMS + AI tooling space.

| Platform | Status | Tool count | Notes |
|----------|--------|-----------|-------|
| Sanity | Official, managed | 40+ | GROQ queries, document CRUD, release management, OAuth RBAC. Deepest tool coverage. |
| Directus | Official (local + native) | Varies | SQL-native data model. Comprehensive video documentation. |
| Storyblok | Official (March 2026) | Varies | Component-based content blocks with strong typing. |
| Contentstack | Agent OS (not yet official) | Broad | Enterprise multi-stack management. Explicitly labeled "not yet recommended." |
| Strapi | In development | TBD | Native MCP as HTTP route (no sidecar). Self-hosted. |
| Contentful | Community (mature) | Full CRUD | 271 commits, 24 releases. Smart pagination (3 items/request) for LLM context windows. |
| dotCMS | Official npm package | 4 core | Content type management, workflow actions, content search. |

## Technical Tradeoffs

**Why browser-native over server-side MCP?**
- No server infrastructure required — tools execute in the user's browser session
- Inherits user auth state, cookies, and session automatically
- `requestUserInteraction()` enables browser-mediated consent (no custom auth flow)
- Works with same-origin security model — no CORS, no API keys in client code
- Limitation: requires a browser tab to be open (no headless/background agent support)

**Why this project over WordPress/TYPO3/Webflow WebMCP?**
- Consent flow is a hard requirement for GDPR/CCPA compliance on mutation tools — only this project implements it
- `getAccessibilityTree` provides semantic page understanding that DOM scraping cannot
- AEM Core Component auto-detection eliminates per-component configuration
- `AbortSignal` support enables clean teardown when tools are unregistered
- Debug panel is useful during development — other implementations have no equivalent

**Why this might not be the right choice:**
- AEM-specific — if you're not on AEM, WordPress or TYPO3 plugins are more appropriate
- No server-side MCP endpoint — if you need Claude Desktop/Cursor/VS Code integration, look at Sanity or Contentful's MCP servers
- Chrome-only for native features — falls back to `window.AEMWebMCP` global in other browsers, which agents must explicitly support

## Spec Timeline

| Date | Event |
|------|-------|
| February 10, 2026 | W3C CG-DRAFT published |
| March 2026 | `provideContext()` removed from spec; `registerTool()` becomes sole API |
| March 2026 | Chrome 146 Canary ships `navigator.modelContext` behind flag |
| April 2026 | Elementor merges WebMCP support |
| May 19, 2026 | Chrome 149 origin trial announced (Google I/O) |
| H2 2026 (expected) | Chrome/Edge stable rollout |

## References

- [W3C WebMCP Spec](https://webmachinelearning.github.io/webmcp/) (CG-DRAFT, July 21, 2026)
- [Chrome WebMCP Docs](https://developer.chrome.com/docs/ai/webmcp) (May 18, 2026)
- [WebMCP Explainer](https://github.com/webmachinelearning/webmcp)
- [WordPress WebMCP Bridge](https://wordpress.org/plugins/webmcp-bridge/) (v1.6)
- [TYPO3 brosua/webmcp](https://packagist.org/packages/brosua/webmcp) (v14.3+)
- [Elementor PR #35479](https://github.com/elementor/elementor/pull/35479) (merged April 2026)
- [WebMCP Registry SDK](https://github.com/samuelvinay91/webmcpregistry) (polyfill + framework adapters)
- [@mcp-b/global](https://www.npmjs.com/package/@mcp-b/global) (W3C polyfill)
- [MCP-B](https://mcp-b.ai/) (browser tab/extension transport)
