# AEM WebMCP Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            AEM Publish Instance                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        AEM Page                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │  Search     │  │  Form       │  │  Cart       │  ...        │   │
│  │  │  Component  │  │  Components │  │  Component  │            │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │   │
│  │         │                 │                 │                     │   │
│  │         └─────────────────┼─────────────────┘                     │   │
│  │                           ▼                                       │   │
│  │              ┌──────────────────────┐                            │   │
│  │              │  clientlib-webmcp    │                            │   │
│  │              │  (webmcp.js)        │                            │   │
│  │              │  - Component Scanner │                            │   │
│  │              │  - API Exposer      │                            │   │
│  │              │  - DOM Enhancer     │                            │   │
│  │              └──────────┬───────────┘                            │   │
│  │                         │                                         │   │
│  │                         ▼                                         │   │
│  │              ┌──────────────────────┐                            │   │
│  │              │  JSON-LD + Data Attrs│                            │   │
│  │              │  data-webmcp-*       │                            │   │
│  │              └──────────────────────┘                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        OSGi Bundle                              │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │   │
│  │  │ FormServlet  │ │ CartServlet  │ │SearchServlet │           │   │
│  │  │ /bin/form    │ │ /bin/cart    │ │ /bin/search  │           │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘           │   │
│  │         │               │               │                        │   │
│  │         └───────────────┼───────────────┘                        │   │
│  │                         ▼                                        │   │
│  │              ┌──────────────────────┐                            │   │
│  │              │ CartPersistenceService│                           │   │
│  │              │ (JCR: /var/aem-webmcp)│                           │   │
│  │              └──────────────────────┘                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
           ▲                     ▲                      ▲
           │                     │                      │
    ┌──────┴──────┐       ┌──────┴──────┐        ┌──────┴──────┐
    │   AI Agent  │       │  Browser    │        │  AEM Author │
    │ (Claude,    │       │  DevTools   │        │  /publish   │
    │  GPT, etc) │       │  Console    │        │             │
    └─────────────┘       └─────────────┘        └─────────────┘
```

---

## Client-Side Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Page Load                                    │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 1. DOM Ready                                                         │
│    └─▶ AEMWebMCP.init()                                             │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. Component Detection                                               │
│                                                                       │
│    Scan for:                                                         │
│    - data-cq-resource-path                                          │
│    - data-resource-type                                              │
│    - core-wcm-components-* CSS classes                               │
│    - cmp-* data attributes                                           │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. Component Enhancement                                             │
│                                                                       │
│    For each component:                                                │
│    └─▶ Lookup mapping in COMPONENT_MAP                               │
│    └─▶ Add data attributes:                                          │
│        data-webmcp-action="search"                                  │
│        data-webmcp-category="commerce"                              │
│        data-webmcp-interactions="submit,clear"                      │
│        data-webmcp-data="{...}"                                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. WebMCP API Registration                                           │
│                                                                       │
│    if (navigator.modelContext) {                                     │
│      navigator.modelContext.expose({                                  │
│        name: "aem-components",                                       │
│        tools: [...]                                                   │
│      });                                                             │
│    }                                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Server-Side Flow (Form Submission)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   AEM       │────▶│  Form       │────▶│   JCR      │
│   (AJAX)   │     │  Dispatcher │     │  Servlet    │     │   Storage  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                                        │
      │                                        ▼
      │                               ┌─────────────┐
      │                               │  Validate   │
      │                               │  - CSRF     │
      │                               │  - Rate Lim │
      │                               │  - Input    │
      │                               └─────────────┘
      │                                        │
      │                                        ▼
      │                               ┌─────────────┐
      │                               │  Process    │
      │                               │  - Save     │
      │                               │  - Log      │
      │                               └─────────────┘
      │                                        │
      │◀───────────────────────────────────────┘
      │                                        │
      ▼                                        ▼
┌─────────────┐                       ┌─────────────┐
│   Success/  │                       │   Error     │
│   Error JSON│                       │   Response  │
└─────────────┘                       └─────────────┘
```

---

## Component Mapping Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      webmcp.js                                      │
│                                                                     │
│  const COMPONENT_MAP = {                                           │
│    'core/wcm/components/search': {                    ──┐          │
│       category: 'commerce',                        │             │
│       action: 'search',                             │             │
│       interactions: ['submit', 'clear'],            │             │
│       getData: (el) => ({ query: ... })           │             │
│    },                                              │             │
│    'core/wcm/components/form/text': {              │  Component  │
│       category: 'form',                             │  Definitions│
│       action: 'form-field',                        │             │
│       fieldType: 'text',                            │             │
│    },                                              │             │
│    ...70+ more...                                  ──┘             │
│  };                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Detection Strategies                              │
├─────────────────────────────────────────────────────────────────────┤
│  1. data-resource-type attribute                                     │
│  2. data-cq-resource-path attribute                                 │
│  3. CSS class: .core-wcm-components-search-v2                       │
│  4. cmp-* data attributes                                           │
│  5. HTL data-sly-resource/@type                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Security Layers                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. CSRF Protection                                          │   │
│  │    - Validate csrfToken from session                         │   │
│  │    - Reject requests without valid token                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 2. Rate Limiting                                             │   │
│  │    - Per-IP request counters                                  │   │
│  │    - 10-30 requests per 60 seconds                           │   │
│  │    - Return 429 when exceeded                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 3. Input Validation & Sanitization                            │   │
│  │    - Regex patterns for all inputs                            │   │
│  │    - Max length limits                                        │   │
│  │    - Special character escaping                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 4. Error Handling                                            │   │
│  │    - Sanitized error messages                                │   │
│  │    - No stack traces exposed                                 │   │
│  │    - PII not logged                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Configuration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Configuration Layers                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  OSGi Config (org.apache.felix.config)                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  webmcp.enabled=true                                        │   │
│  │  commerce.mockData=true                                     │   │
│  │  form.rateLimitPerMinute=10                                 │   │
│  │  search.maxResults=20                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  JavaScript Config (window.AEM_WEBMC_CONFIG)                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  {                                                          │   │
│  │    enabled: true,                                           │   │
│  │    debug: false,                                             │   │
│  │    consentRequired: true                                     │   │
│  │  }                                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  Per-Component (data-webmcp-disabled="true")                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  <div data-webmcp-disabled="true">...</div>                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Package Structure

```
aem-webmcp/
├── core/                                    # OSGi Bundle
│   ├── src/main/java/aemwebmcp/core/
│   │   ├── servlets/                       # REST Endpoints
│   │   │   ├── FormSubmissionServlet.java
│   │   │   ├── CommerceCartServlet.java
│   │   │   ├── SearchServlet.java
│   │   │   └── HealthCheckServlet.java
│   │   ├── services/                       # Business Logic
│   │   │   └── CartPersistenceService.java
│   │   ├── models/                         # Sling Models
│   │   └── config/                         # Configuration
│   └── src/test/                           # Unit Tests
│
├── ui.apps/                                 # Components & ClientLibs
│   └── src/main/content/jcr_root/
│       └── apps/aem-webmcp/
│           ├── clientlibs/
│           │   ├── clientlib-webmcp/        # Main JS
│           │   └── clientlib-base/
│           └── components/                  # Component Overrides
│
├── ui.config/                              # OSGi Configs
├── ui.content/                             # Demo Content
└── all/                                    # Combined Package
```
