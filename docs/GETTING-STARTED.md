# Getting started

Begin with the [standalone form journey](FORM-JOURNEY.md). It needs Node.js 22+, runs without AEM, and exposes browser capability diagnostics.

## Build and install on AEM

Use the JDK and Maven versions in `pom.xml` and CI. The current project compiles against the AEM SDK and Core Components 2.28.0. Treat AEM 6.5 and Cloud Service compatibility as separate checks, not interchangeable version claims.

```sh
git clone https://github.com/narendragandhi/aem-webmcp.git
cd aem-webmcp
mvn -B clean install
mvn -B -pl all -PautoInstallSinglePackage install -Daem.host=localhost -Daem.port=4502
```

Only run installation against your development instance. Visit `/content/aem-webmcp/us/en.html`. Live AEM validation is not implied by unit or standalone browser tests.

## Existing Sites pages

Retain your project's Core Component page proxy and include the WebMCP clientlib:

```html
<sly data-sly-use.clientlib="core/wcm/components/commons/v1/templates/clientlib.html">
    <sly data-sly-call="${clientlib.js @ categories='aemwebmcp.webmcp'}"/>
</sly>
```

The bundled base clientlib `aem-webmcp.base` already embeds it; do not load both.

For OSGi-backed frontend settings, also include the project's `aem-webmcp/components/page/webmcp-head` resource or render its three meta settings using `WebMCPStatusModel`. Include them before JavaScript runs. Changing server configuration requires cached pages to be refreshed; it is not a live browser revocation mechanism.

## Configuration and consent

The PID `com.aem.webmcp.WebMCPConfiguration` is consumed by `WebMCPSettings`. Existing page metadata communicates enablement, debug and consent requirements. The same settings control demo endpoint enablement and supported limits.

On non-AEM pages, set these flags **before** scripts load:

```html
<script>
  window.WEBMCP_DEBUG = true;
  window.WEBMCP_SHOW_PANEL = true;
</script>
```

Use `AEMWebMCP._showConsentUI()` to request application access. Approval enables native mutation calls and the public API consistently. It does not replace backend authorization or per-submission confirmation. `WEBMCP_AUTO_CONSENT` is for controlled development only.

`data-webmcp-disabled="true"` excludes a component subtree from enhancement and supported interaction helpers. It is not an ACL or a mechanism to hide data from other page scripts.

## Verify

```js
const mc = document.modelContext || navigator.modelContext;
const tools = mc ? await mc.getTools() : [];
console.table(tools.map(({name, description}) => ({name, description})));
```

A successful call to `window.AEMWebMCP` alone proves only the application API. Follow [native verification](COMPATIBILITY.md) for the browser path.

See [deployment](DEPLOYMENT.md) before publishing and the [cookbook](COOKBOOK.md) for integration choices.
