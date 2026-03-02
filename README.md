# AEM WebMCP - AI Agent Ready

> Google WebMCP (Web Model Context Protocol) integration for AEM Core Components

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![AEM Version](https://img.shields.io/badge/AEM-6.5%2B+-yellow.svg)]()
[![Core Components](https://img.shields.io/badge/Core%20Components-2.0%2B-green.svg)]()

## Overview

AEM WebMCP automatically enhances Adobe Experience Manager sites with WebMCP capabilities, enabling AI agents to interact with your site in a structured, reliable way - no custom component development required.

## What is WebMCP?

WebMCP (Web Model Context Protocol) is a browser API being developed by Google that allows websites to expose structured tools to AI agents. Instead of AI agents clicking around blindly, they can:

- Understand site structure and components
- Fill forms with proper field validation
- Navigate precisely without guessing
- Perform complex e-commerce actions

## Features

- **50+ AEM Core Components** automatically detected and enhanced
- **Zero configuration** - auto-loads via clientlib
- **Consent-based** API exposure for AI agents
- **Debug panel** for development
- **Accessibility tree** support
- **Production-ready** with OWASP security scanning

## Quick Start

```bash
# Build the project
mvn clean install

# Deploy to AEM Author
mvn install -PautoInstallSinglePackage -Daem.host=localhost -Daem.port=4502
```

## Configuration

```javascript
// Enable debug
window.WEBMCP_DEBUG = true;

// Show debug panel
window.WEBMCP_SHOW_PANEL = true;

// Enable AI agent API (requires consent)
window.WEBMCP_CONSENT = true;
```

## Documentation

- [Getting Started](docs/GETTING-STARTED.md)
- [API Reference](docs/API-REFERENCE.md)
- [Sample AI Agent](docs/sample-agent.js)

## Supported Components

| Category | Components |
|----------|------------|
| Commerce | Search, Cart, Product, Featured Products |
| Navigation | Navigation, Language Nav, Breadcrumb |
| Content | Text, Title, Image, Teaser, Download, Embed |
| Layout | Container, Accordion, Tabs, Carousel |
| Forms | Form, Text, Button, Hidden, Options |
| Media | PDF Viewer |
| Experience | Experience Fragment |

## Requirements

- AEM 6.5+ or AEM as a Cloud Service
- AEM Core Components 2.0+
- Maven 3.6+

## License

Copyright 2024 Adobe Systems Incorporated. Licensed under Apache License 2.0.

## Resources

- [WebMCP Documentation](https://developer.chrome.com/blog/webmcp-epp)
- [AEM Core Components](https://github.com/adobe/aem-core-wcm-components)
- [WebMCP W3C Spec](https://github.com/WICG/web-mcp)
