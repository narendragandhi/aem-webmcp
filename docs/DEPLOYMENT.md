# Deploying with AEM

The standalone playground is not AEM deployment evidence. Validate the chosen SDK/service pack and browser separately.

## Clientlibs and settings

Include `aemwebmcp.webmcp` once; `aem-webmcp.base` already embeds it. Render page settings before JavaScript.

PID `com.aem.webmcp.WebMCPConfiguration` controls demo endpoints through `WebMCPSettings` and page metadata through `WebMCPStatusModel`. Refresh/invalidate cached pages after changing settings; disablement is not live revocation of loaded pages.

`commerce.mockData=false`, `commerce.persistToJCR=true` and `search.mockData=false` fail closed on demo endpoints because a production backend is not connected. The legacy `form.csrfEnabled` setting is deprecated and cannot disable Granite CSRF or Sling Referrer protection. The form servlet no longer creates a separate session token.

## Identity and submission

Use current-user permissions; tool annotations and JavaScript consent flags are not server authorization. Preserve existing form handlers and keep writes on POST.

Use [Granite CSRF](https://experienceleague.adobe.com/en/docs/experience-manager-65/content/implementing/developing/introduction/csrf-protection) where applicable and verify anonymous publish behavior separately. The adapter supports Granite tokens and `data-webmcp-encoding="form"` for the demo servlet's URL-encoded parameters. Keep the default JSON encoding for JSON endpoints. `data-webmcp-csrf="granite"` requires a token and fails closed if none is returned; use it for authenticated deployments. Anonymous publish follows platform policy and must be verified separately. Neither mode creates a production delivery backend.

## Dispatcher and caching

Allow only required paths, methods, selectors and extensions. Do not broadly open `/bin/*` or arbitrary JSON endpoints. Cart and form responses use `no-store`; confirm that Dispatcher/CDN preserve it. Keep authenticated data out of public caches.

The bundled Dispatcher configuration does not certify every demo endpoint. Test through Dispatcher, including denied requests. See [Adobe caching guidance](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/caching).

## Frames

Use secure, origin-isolated documents and restrictive `Permissions-Policy: tools=(self)` unless a specific trusted frame requires more. Cross-origin sharing needs policy delegation plus explicit `exposedTo` and `fromOrigins` configuration.

AEM editor chrome and content frames are different contexts. Verify where the chosen client discovers tools. A host-page adapter may be required by particular clients; this is not a universal WebMCP frame restriction.

## Operations

Record tool names, browser versions, durations, error categories and receipt identifiers. Avoid storing form contents or tokens in diagnostic logs. Verify success, rejection, cancellation, stale-state and retry behavior.

Native browser, live AEM and hosted-agent verification remain separate evidence categories.

## Form adapter contract

For an explicitly opted-in support form with `fullName`, `email` and `message` fields, use:

```html
<form action="/content/your-site/path/to/form-resource" method="post"
      data-webmcp-json-form data-webmcp-tool="submit_support_request"
      data-webmcp-encoding="form" data-webmcp-csrf="granite">
  <!-- Existing required fields, submit button and [role="status"] output. -->
</form>
```

The action must resolve to the intended submit handler. Do not replace an existing Core Forms or Adaptive Forms action blindly. This repository's form servlet validates input and returns `demo: true`; it does not deliver a message. Permit only your chosen POST resource in Dispatcher after reviewing its handler. The shipped config allows the exact Granite token GET, forwards `CSRF-Token` via the default client headers, and explicitly denies token caching.

Before claiming deployment success, verify authenticated missing/invalid tokens are rejected by Granite, valid tokens reach the handler, anonymous policy behaves as intended, other POST paths are denied, and receipts are visible through Dispatcher. Unit tests bypass the platform filter and cannot certify these checks.

## Public Content Fragment query

Configure `aemwebmcp.core.services.ContentFragmentGraphQLService` with `use.mockData=false`, `use.persistedQueries=true`, and `persisted.query.url=https://your-publish-host/graphql/execute.json/your-config/article-by-path`. Only public published content is supported; no credentials or caller-selected query URL are forwarded. HTTP localhost is allowed for SDK development.

Persist this model-specific query through AEM GraphiQL, adapting the model name and selected fields to your schema:

```graphql
query ArticleByPath($path: String!) {
  fragment: articleByPath(_path: $path) {
    item { _path title }
  }
}
```

The fixed `fragment` alias and `path` variable are the adapter contract. Publish the query/model/content and configure the appropriate AEM endpoint. Upstream HTTP/GraphQL/schema failures return an unavailable response, never mock content. Unconfigured real model listing returns unavailable. Caching belongs to the persisted-query endpoint/Dispatcher/CDN; the adapter has no private cache. Prefer calling the persisted query directly from the application when a Java adapter is unnecessary.
