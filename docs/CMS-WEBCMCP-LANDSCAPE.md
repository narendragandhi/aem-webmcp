# WebMCP Implementations Across CMS Platforms

> Last updated: July 2026
>
> **Disclaimer:** This is a community project. It is not endorsed by, affiliated with, or maintained by Adobe. All comparisons below are based on publicly available code, documentation, and specifications as of the dates noted. Feature claims for other platforms should be verified against their current releases.

## Background: Two Protocol Families

There are two distinct protocols that both use the abbreviation "MCP" in the CMS space. They solve different problems and are not interchangeable.

**WebMCP** (W3C CG-DRAFT) is a browser-native API under `document.modelContext` that lets client-side JavaScript register structured tools for AI agents. Co-authored by Google and Microsoft, it ships as an origin trial in Chrome 149 (May 2026) with Edge support expected mid-2026. Tools execute in the page's JS context — they can access DOM, user session state, and browser APIs directly.

**MCP** (Anthropic's Model Context Protocol) is a server-side protocol for connecting AI clients (Claude Desktop, Cursor, VS Code) to external data sources via stdio or HTTP. Tools execute on the server, not in the browser. This is shipping now with broad adoption.

This document focuses on **WebMCP** implementations — browser-native, client-side tool registration. Server-side MCP implementations (Sanity, Directus, Contentful, etc.) are included at the end for context but operate on a fundamentally different architecture.

## WebMCP Implementations by Platform

### AEM WebMCP

- **Repo:** [github.com/narendragandhi/aem-webmcp](https://github.com/narendragandhi/aem-webmcp) (Apache 2.0)
- **Status:** v2.1.0
- **Approach:** Clientlib auto-loaded via AEM page component's `customfooterlibs.html`. Detects AEM Core Components via `data-webmcp-*` attributes and registers tools automatically.
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

- **Repo:** [wordpress.org/plugins/webmcp-bridge](https://wordpress.org/plugins/webmcp-bridge/) (GPL-2.0)
- **Status:** v1.6, 300+ active installs (as of July 2026)
- **Approach:** PHP plugin that registers tools via REST API endpoints and optional native `navigator.modelContext` registration. Admin settings page to enable/disable feature groups.
- **Tool count:** ~15 core + WooCommerce tools
- **Tools:** `search_posts`, `get_post`, `get_menu`, `get_categories`, `get_site_info`, `submit_contact_form`, plus WooCommerce: `woo_search_products`, `woo_get_product`, `woo_add_to_cart`, `woo_get_cart`, `woo_remove_from_cart`, `woo_apply_coupon`
- **Key technical details:**
  - REST API manifest at `/wp-json/webmcp-bridge/v1/manifest`
  - JavaScript frontend bridge with WebMCP browser API support and fallback
  - Optional Mescio for Agents integration adds `get_markdown_content` and `get_llms_txt`
  - WooCommerce integration is the most complete commerce toolset among browser-native WebMCP implementations
  - Non-browser fallback: REST API + `window.webmcpBridgeTools` JS global
- **What it does not implement:**
  - No consent flow — all tools execute without user confirmation
  - No accessibility tree or screenshot/vision
  - No debug panel or health observability
  - No declarative HTML tool registration

### TYPO3: brosua/webmcp

- **Repo:** [packagist.org/packages/brosua/webmcp](https://packagist.org/packages/brosua/webmcp) (License: TBD — composer package, not yet publicly released)
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
  - No consent flow, commerce, accessibility tree, or vision
  - Requires Chrome 149+ — no polyfill or fallback documented

### Elementor (WordPress)

- **Repo:** [github.com/elementor/elementor](https://github.com/elementor/elementor) (GPL-3.0, PR [#35479](https://github.com/elementor/elementor/pull/35479) merged April 2026)
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

- **Status:** Supported via Code Embed (no dedicated plugin or package)
- **Approach:** Code Embed with dynamic CMS data binding (May 2026 update). A single Code Embed inside a CMS Collection page can register tools whose output reflects the current CMS item via props.
- **Key technical details:**
  - May 19, 2026 Code Embed update added props and dynamic data support
  - `navigator.modelContext.registerTool()` called directly from Code Embed
  - CMS-bound: tool output can reflect live collection data via props
- **Limitations:**
  - Manual setup per page/collection — no global tool registration
  - No component auto-detection, consent flow, debug panel, or accessibility tools
  - Chrome-only progressive enhancement (no cross-browser fallback documented)

## Comparison Matrix

The table below compares features that matter for **adoption decisions** — what you'd evaluate when choosing an implementation or deciding whether to build on top of one.

| Feature | AEM WebMCP | WordPress | TYPO3 | Elementor | Webflow |
|---------|-----------|-----------|-------|-----------|---------|
| **License** | Apache 2.0 | GPL-2.0 | TBD | GPL-3.0 | Proprietary (SaaS) |
| **Setup effort** | Zero (clientlib auto-loads) | Plugin activation + settings | Composer + Site Set config | PR merged into core | Code Embed per page |
| **Tool count** | 25+ | ~15 | 4 | Editor tools | Per-page |
| **Write/mutate tools** | Yes | Yes | No | Yes | Yes |
| **Commerce** | `addToCart`, `updateCartQuantity` | WooCommerce (6 tools) | No | No | No |
| **Consent flow** | Yes (`requestUserInteraction`) | No | No | No | No |
| **Accessibility tree** | Yes | No | No | No | No |
| **Screenshot/vision** | Yes | No | No | No | No |
| **Debug/observability** | Panel + `_health` stats | No | No | No | No |
| **Declarative HTML** | `data-webmcp-*` attrs | No | `toolname` attr on `<form>` | No | No |
| **Content discovery** | `getComponents()` | REST manifest + JS bridge | `page-list-actions` | URI search | No |
| **Non-browser fallback** | `window.AEMWebMCP` global | REST API (works everywhere) | None | None | None |
| **Test coverage** | 107 unit tests | Not public | Not public | Internal | N/A |

## Server-Side MCP (for reference)

These use Anthropic's MCP protocol, not browser-native WebMCP. They require a running server and connect to AI clients like Claude Desktop or Cursor. They are architecturally different from browser-native WebMCP but represent the broader CMS + AI tooling landscape.

**Sanity** (official, managed, OAuth) — 40+ tools covering document CRUD, GROQ queries, release management, AI image generation. Deepest tool coverage of any CMS MCP implementation.

**Directus** (official, local + native) — SQL-native data model with relational structures. Comprehensive video documentation.

**Contentful** (community, mature) — Full CRUD with 271 commits and 24 releases. Smart pagination (3 items/request) designed for LLM context windows.

Others (Storyblok, Contentstack, Strapi, dotCMS) have varying levels of MCP support — some official, some in development, some community-maintained. See [llmcms.org](https://www.llmcms.org/guides/best-cms-mcp-server-support-ai-agents-2026) for a broader comparison.

## Technical Tradeoffs

**Why browser-native over server-side MCP?**
- No server infrastructure — tools execute in the user's browser session
- Inherits user auth state, cookies, and session automatically
- `requestUserInteraction()` enables browser-mediated consent (no custom auth flow)
- Same-origin security model — no CORS, no API keys in client code
- Limitation: requires a browser tab to be open (no headless/background agent support)

**Why AEM WebMCP over other browser-native implementations?**
- Consent flow is relevant for GDPR/CCPA compliance on mutation tools — of the implementations reviewed, only AEM WebMCP implements it
- `getAccessibilityTree` provides semantic page understanding that DOM scraping cannot
- AEM Core Component auto-detection eliminates per-component configuration
- Debug panel is useful during development — no equivalent in other implementations

**When another implementation is a better fit:**
- Not on AEM? WordPress or TYPO3 plugins are more appropriate
- Need Claude Desktop / Cursor / VS Code integration? Sanity or Contentful's server-side MCP servers
- Need cross-browser compatibility without fallback? WordPress REST API fallback works everywhere
- Editor tooling? Elementor's adapter pattern is purpose-built for that

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
