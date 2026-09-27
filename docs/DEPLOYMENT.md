# Deploying with AEM

The standalone playground is not AEM deployment evidence. Validate the chosen SDK/service pack and browser separately.

## Clientlibs and settings

Include `aemwebmcp.webmcp` once; `aem-webmcp.base` already embeds it. Render page settings before JavaScript.

PID `com.aem.webmcp.WebMCPConfiguration` controls demo endpoints through `WebMCPSettings` and page metadata through `WebMCPStatusModel`. Refresh/invalidate cached pages after changing settings; disablement is not live revocation of loaded pages.

`commerce.mockData=false`, `commerce.persistToJCR=true` and `search.mockData=false` fail closed on demo endpoints because a production backend is not connected. Keep `form.csrfEnabled=true`. Its legacy session token is separate from AEM's platform filters.

## Identity and submission

Use current-user permissions; tool annotations and JavaScript consent flags are not server authorization. Preserve existing form handlers and keep writes on POST.

Use [Granite CSRF](https://experienceleague.adobe.com/en/docs/experience-manager-65/content/implementing/developing/introduction/csrf-protection) where applicable and verify anonymous publish behavior separately. The JSON adapter supports Granite tokens but requires a real compatible endpoint; the legacy servlet has a different form-parameter contract.

## Dispatcher and caching

Allow only required paths, methods, selectors and extensions. Do not broadly open `/bin/*` or arbitrary JSON endpoints. Cart and form responses use `no-store`; confirm that Dispatcher/CDN preserve it. Keep authenticated data out of public caches.

The bundled Dispatcher configuration does not certify every demo endpoint. Test through Dispatcher, including denied requests. See [Adobe caching guidance](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/caching).

## Frames

Use secure, origin-isolated documents and restrictive `Permissions-Policy: tools=(self)` unless a specific trusted frame requires more. Cross-origin sharing needs policy delegation plus explicit `exposedTo` and `fromOrigins` configuration.

AEM editor chrome and content frames are different contexts. Verify where the chosen client discovers tools. A host-page adapter may be required by particular clients; this is not a universal WebMCP frame restriction.

## Operations

Record tool names, browser versions, durations, error categories and receipt identifiers. Avoid storing form contents or tokens in diagnostic logs. Verify success, rejection, cancellation, stale-state and retry behavior.

Native browser, live AEM and hosted-agent verification remain separate evidence categories.
