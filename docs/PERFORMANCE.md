# Performance Benchmarking Guide

This document outlines performance benchmarks, monitoring strategies, and optimization guidelines for AEM WebMCP.

## Table of Contents

1. [Performance Targets](#performance-targets)
2. [Benchmarking Tools](#benchmarking-tools)
3. [Running Benchmarks](#running-benchmarks)
4. [Key Metrics](#key-metrics)
5. [Optimization Guidelines](#optimization-guidelines)

---

## Performance Targets

### Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4s | > 4s |
| **FID** (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s - 3s | > 3s |
| **TTFB** (Time to First Byte) | ≤ 800ms | 800ms - 1800ms | > 1800ms |

### WebMCP-Specific Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Component Discovery | < 100ms | 500ms |
| Form Fill (single field) | < 50ms | 200ms |
| Full Form Submission | < 500ms | 2s |
| Cart Operations | < 200ms | 1s |
| Search Results | < 300ms | 1.5s |
| A11y Tree Snapshot | < 200ms | 1s |

---

## Benchmarking Tools

### Built-in Performance Tests

```bash
# Run performance test suite
cd playwright-tests
npm run test:performance

# Run with detailed reporting
npm run test:performance -- --reporter=html
```

### Using Lighthouse

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run Lighthouse audit
lighthouse http://localhost:4502/content/aem-webmcp/demo.html \
  --output=json \
  --output-path=./reports/lighthouse.json
```

### Using WebPageTest

```bash
# Using WebPageTest API
curl -X POST "https://www.webpagetest.org/runtest.php" \
  -d "url=https://your-aem-site.com" \
  -d "f=json" \
  -d "k=YOUR_API_KEY"
```

---

## Running Benchmarks

### Quick Benchmark Script

Create `scripts/benchmark.js`:

```javascript
const { chromium } = require('playwright');

async function runBenchmark() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    pageLoad: [],
    componentDiscovery: [],
    formFill: [],
    cartOperations: []
  };

  // Page Load Benchmark
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await page.goto('http://localhost:4502/content/aem-webmcp/demo.html');
    await page.waitForLoadState('networkidle');
    results.pageLoad.push(Date.now() - start);
  }

  // Component Discovery Benchmark
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    await page.evaluate(() => window.WebMCP?.discoverComponents?.());
    results.componentDiscovery.push(Date.now() - start);
  }

  // Calculate averages
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

  console.log('Benchmark Results:');
  console.log('==================');
  console.log(`Page Load: ${avg(results.pageLoad).toFixed(0)}ms (avg of 5)`);
  console.log(`Component Discovery: ${avg(results.componentDiscovery).toFixed(0)}ms (avg of 10)`);

  await browser.close();
}

runBenchmark().catch(console.error);
```

### Running with Docker

```bash
# Start test environment
docker-compose --profile test up -d mock-aem

# Run benchmark
node scripts/benchmark.js

# Generate report
npm run benchmark:report
```

### Continuous Benchmarking

Add to CI/CD pipeline (`.github/workflows/benchmark.yml`):

```yaml
name: Performance Benchmark

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Start mock server
        run: docker-compose --profile mock up -d

      - name: Run benchmarks
        run: npm run benchmark

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-results
          path: reports/benchmark.json

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('reports/benchmark.json'));
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Performance Results\n\n${formatResults(results)}`
            });
```

---

## Key Metrics

### Memory Usage

Monitor memory consumption during operations:

```javascript
// Get memory snapshot
const memory = await page.evaluate(() => {
  if (performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize / 1048576,
      totalJSHeapSize: performance.memory.totalJSHeapSize / 1048576,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit / 1048576
    };
  }
  return null;
});

console.log('Memory (MB):', memory);
```

### Network Performance

```javascript
// Track network requests
const networkRequests = [];

page.on('request', request => {
  networkRequests.push({
    url: request.url(),
    method: request.method(),
    timestamp: Date.now()
  });
});

page.on('response', response => {
  const request = networkRequests.find(r => r.url === response.url());
  if (request) {
    request.status = response.status();
    request.duration = Date.now() - request.timestamp;
    request.size = response.headers()['content-length'];
  }
});
```

### Resource Timing

```javascript
// Get detailed resource timing
const resources = await page.evaluate(() => {
  return performance.getEntriesByType('resource').map(r => ({
    name: r.name,
    type: r.initiatorType,
    duration: r.duration,
    transferSize: r.transferSize,
    startTime: r.startTime
  }));
});

// Group by type
const byType = resources.reduce((acc, r) => {
  acc[r.type] = acc[r.type] || [];
  acc[r.type].push(r);
  return acc;
}, {});
```

---

## Optimization Guidelines

### Component Discovery Optimization

```javascript
// ❌ Bad: Discover all components repeatedly
for (const action of actions) {
  const components = await webmcp.discoverComponents();
  // process...
}

// ✅ Good: Cache component references
const components = await webmcp.discoverComponents();
for (const action of actions) {
  // Use cached components
}
```

### Lazy Loading

```javascript
// ✅ Good: Only load WebMCP when needed
const loadWebMCP = async () => {
  if (!window.WebMCP) {
    await import('/libs/webmcp/webmcp.min.js');
  }
  return window.WebMCP;
};
```

### Batch Operations

```javascript
// ❌ Bad: Individual API calls
await webmcp.commerce.addToCart('SKU1', 1);
await webmcp.commerce.addToCart('SKU2', 1);
await webmcp.commerce.addToCart('SKU3', 1);

// ✅ Good: Batch API calls
await webmcp.commerce.addToCart([
  { sku: 'SKU1', quantity: 1 },
  { sku: 'SKU2', quantity: 1 },
  { sku: 'SKU3', quantity: 1 }
]);
```

### Minimize DOM Queries

```javascript
// ❌ Bad: Query DOM multiple times
const form = document.querySelector('#myForm');
const inputs = document.querySelectorAll('#myForm input');
const buttons = document.querySelectorAll('#myForm button');

// ✅ Good: Query once, traverse within
const form = document.querySelector('#myForm');
const inputs = form.querySelectorAll('input');
const buttons = form.querySelectorAll('button');
```

### Use RequestIdleCallback

```javascript
// ✅ Good: Defer non-critical operations
requestIdleCallback(() => {
  // Run analytics, prefetch, etc.
  webmcp.prefetchComponents();
}, { timeout: 2000 });
```

---

## Benchmark Report Format

### JSON Output

```json
{
  "timestamp": "2024-03-15T10:30:00Z",
  "environment": {
    "browser": "chromium",
    "viewport": "1920x1080",
    "device": "desktop"
  },
  "results": {
    "coreWebVitals": {
      "LCP": 1850,
      "FID": 45,
      "CLS": 0.05,
      "FCP": 1200,
      "TTFB": 350
    },
    "webmcp": {
      "componentDiscovery": {
        "avg": 85,
        "min": 62,
        "max": 120,
        "p95": 105
      },
      "formOperations": {
        "fill": 42,
        "validate": 15,
        "submit": 380
      },
      "cartOperations": {
        "add": 150,
        "update": 120,
        "remove": 95
      }
    },
    "resources": {
      "totalRequests": 45,
      "totalTransferSize": 1250000,
      "jsSize": 450000,
      "cssSize": 85000,
      "imageSize": 620000
    }
  },
  "status": "pass",
  "recommendations": []
}
```

### Markdown Report

```markdown
# Performance Report - 2024-03-15

## Summary
✅ All metrics within acceptable thresholds

## Core Web Vitals
| Metric | Value | Status |
|--------|-------|--------|
| LCP | 1.85s | ✅ Good |
| FID | 45ms | ✅ Good |
| CLS | 0.05 | ✅ Good |

## WebMCP Operations
| Operation | Avg | P95 | Status |
|-----------|-----|-----|--------|
| Component Discovery | 85ms | 105ms | ✅ |
| Form Fill | 42ms | 58ms | ✅ |
| Cart Add | 150ms | 180ms | ✅ |

## Recommendations
- None at this time
```

---

## Monitoring in Production

### Setup Prometheus Metrics

```javascript
// Expose metrics endpoint
const metrics = {
  componentDiscoveryDuration: new Histogram({
    name: 'webmcp_component_discovery_duration_ms',
    help: 'Time to discover components',
    buckets: [10, 50, 100, 200, 500, 1000]
  }),
  formOperationDuration: new Histogram({
    name: 'webmcp_form_operation_duration_ms',
    help: 'Time for form operations',
    labelNames: ['operation'],
    buckets: [10, 50, 100, 200, 500, 1000]
  })
};
```

### Grafana Dashboard

Import the provided Grafana dashboard from `docker/grafana/provisioning/dashboards/webmcp-performance.json` for real-time monitoring.

---

## Troubleshooting Performance Issues

### High LCP

1. Check image optimization (use WebP, lazy loading)
2. Verify critical CSS is inlined
3. Check server response time
4. Review third-party scripts impact

### High CLS

1. Set explicit dimensions for images/videos
2. Reserve space for dynamic content
3. Avoid inserting content above existing content
4. Use transform for animations

### Slow Component Discovery

1. Reduce DOM complexity
2. Use specific selectors instead of `*`
3. Cache discovered components
4. Limit discovery scope when possible

---

For questions or issues, please open a GitHub issue.
