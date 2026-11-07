/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

import java.io.IOException;
import java.util.*;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Demo fixtures and an opt-in adapter to one public, model-specific persisted query.
 * The configured query must return data.fragment.item with _path and selected fields.
 * No caller-supplied query, credentials, inferred model, or private response cache.
 */
@Component(service = ContentFragmentGraphQLService.class, immediate = true)
@Designate(ocd = ContentFragmentGraphQLService.Config.class)
public class ContentFragmentGraphQLService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @ObjectClassDefinition(
        name = "AEM WebMCP Content Fragment GraphQL Configuration",
        description = "Configuration for Content Fragment data extraction via GraphQL"
    )
    public @interface Config {
        @AttributeDefinition(
            name = "GraphQL Endpoint",
            description = "Deprecated: ignored. Configure Public persisted query URL instead.",
            defaultValue = "/content/graphql/global/endpoint.json"
        )
        @Deprecated
        String graphql_endpoint() default "/content/graphql/global/endpoint.json";

        @AttributeDefinition(name = "Public persisted query URL",
            description = "Absolute HTTPS /graphql/execute.json/config/query URL. Public content only; HTTP localhost is allowed for development. Query variable: path. Response alias: fragment.")
        String persisted_query_url() default "";

        @AttributeDefinition(
            name = "Use Persisted Queries",
            description = "Use persisted queries for better caching",
            defaultValue = "true"
        )
        boolean use_persistedQueries() default true;

        @AttributeDefinition(
            name = "Use Mock Data",
            description = "Use mock data for development (when AEM is not available)",
            defaultValue = "true"
        )
        boolean use_mockData() default true;

        @AttributeDefinition(
            name = "Cache TTL (seconds)",
            description = "Deprecated: ignored. Cache persisted queries at Dispatcher/CDN.",
            defaultValue = "300"
        )
        int cache_ttlSeconds() default 300;

        @AttributeDefinition(
            name = "Max Depth",
            description = "Deprecated: depth is defined by the persisted query.",
            defaultValue = "3"
        )
        int max_depth() default 3;
    }

    private boolean useMockData = true;
    private boolean usePersistedQueries = true;
    private String persistedQueryUrl = "";

    @Activate
    protected void activate(Config config) {
        useMockData = config.use_mockData();
        usePersistedQueries = config.use_persistedQueries();
        persistedQueryUrl = config.persisted_query_url();
    }

    public Map<String, Object> fetchContentFragment(String fragmentPath) {
        if (fragmentPath == null || !fragmentPath.startsWith("/content/dam/") ||
                fragmentPath.contains("..") || fragmentPath.length() > 2048) {
            throw new IllegalArgumentException("A bounded Content Fragment path is required");
        }
        if (useMockData) {
            Map<String, Object> data = getMockContentFragment(fragmentPath);
            data.put("demo", true);
            return data;
        }
        URI endpoint = persistedQueryEndpoint();
        String variables = URLEncoder.encode(";path=" + fragmentPath, StandardCharsets.UTF_8)
                .replace("+", "%20");
        HttpGet request = new HttpGet(endpoint.toASCIIString() + variables);
        request.setHeader("Accept", "application/json");
        request.setConfig(RequestConfig.custom().setConnectTimeout(5000)
                .setSocketTimeout(5000).setConnectionRequestTimeout(5000).build());
        // No shared credentials or redirects: this adapter serves public published data.
        try (CloseableHttpClient client = HttpClients.custom().disableRedirectHandling().build();
             CloseableHttpResponse response = client.execute(request)) {
            if (response.getStatusLine().getStatusCode() != 200 || response.getEntity() == null) {
                throw new IOException("Persisted query request failed");
            }
            byte[] body = response.getEntity().getContent().readNBytes(1_048_577);
            if (body.length > 1_048_576) throw new IOException("Persisted query response too large");
            JsonNode json = MAPPER.readTree(body);
            if (json == null || json.has("errors")) throw new IOException("Persisted query returned errors");
            JsonNode item = json.at("/data/fragment/item");
            if (item.isMissingNode()) throw new IOException("Expected the fragment query alias");
            if (item.isNull()) return Collections.emptyMap();
            if (!item.isObject() || !fragmentPath.equals(item.path("_path").asText())) {
                throw new IOException("Persisted query returned an unexpected fragment");
            }
            Map<String, Object> result = MAPPER.convertValue(item,
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            result.put("demo", false);
            return result;
        } catch (IOException e) {
            // Do not turn transport/schema failures into fake content or a false success.
            throw new IllegalStateException("Content Fragment delivery unavailable", e);
        }
    }

    private URI persistedQueryEndpoint() {
        if (!usePersistedQueries || persistedQueryUrl == null || persistedQueryUrl.isBlank()) {
            throw new IllegalStateException("Configure a public persisted query before disabling mock data");
        }
        URI uri;
        try { uri = URI.create(persistedQueryUrl); }
        catch (IllegalArgumentException e) { throw new IllegalStateException("Invalid persisted query configuration", e); }
        boolean localHttp = "http".equals(uri.getScheme()) &&
                ("localhost".equals(uri.getHost()) || "127.0.0.1".equals(uri.getHost()));
        if (!("https".equals(uri.getScheme()) || localHttp) || uri.getHost() == null ||
                uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null ||
                !uri.getRawPath().matches("/graphql/execute\\.json/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+")) {
            throw new IllegalStateException("Expected a public persisted query URL without credentials or variables");
        }
        return uri;
    }

    /**
     * Get mock Content Fragment data for development.
     *
     * @param fragmentPath JCR path to the Content Fragment
     * @return Mock Content Fragment data
     */
    private Map<String, Object> getMockContentFragment(String fragmentPath) {
        Map<String, Object> data = new HashMap<>();
        data.put("_path", fragmentPath);

        // Determine mock data based on path patterns
        if (fragmentPath.contains("article") || fragmentPath.contains("blog")) {
            data.put("title", "Sample Article: Understanding AI in Content Management");
            data.put("author", "Adobe AEM Team");
            data.put("publishDate", "2024-03-15T10:00:00.000Z");
            data.put("category", "Technology");
            data.put("tags", Arrays.asList("AI", "CMS", "WebMCP", "AEM"));
            data.put("summary", "This article explores how AI agents can interact with content management systems using the WebMCP protocol.");
            data.put("body", Map.of(
                "plaintext", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. WebMCP enables AI agents to understand and interact with structured content...",
                "html", "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p><p>WebMCP enables AI agents to understand and interact with structured content...</p>"
            ));
            data.put("featuredImage", Map.of(
                "_path", "/content/dam/sample/article-hero.jpg",
                "width", 1920,
                "height", 1080,
                "mimeType", "image/jpeg"
            ));
            data.put("relatedArticles", Arrays.asList(
                Map.of("_path", "/content/dam/articles/related-1", "title", "Getting Started with WebMCP"),
                Map.of("_path", "/content/dam/articles/related-2", "title", "AI-Powered Content Delivery")
            ));

        } else if (fragmentPath.contains("product")) {
            data.put("name", "Premium Widget Pro");
            data.put("sku", "WIDGET-PRO-001");
            data.put("price", 299.99);
            data.put("currency", "USD");
            data.put("description", "The ultimate widget for professionals. Features advanced AI integration and WebMCP compatibility.");
            data.put("specifications", Map.of(
                "weight", "2.5 kg",
                "dimensions", "30x20x10 cm",
                "material", "Aircraft-grade aluminum",
                "warranty", "5 years"
            ));
            data.put("images", Arrays.asList(
                Map.of("_path", "/content/dam/products/widget-1.jpg", "alt", "Widget front view"),
                Map.of("_path", "/content/dam/products/widget-2.jpg", "alt", "Widget side view")
            ));
            data.put("inStock", true);
            data.put("stockQuantity", 42);

        } else if (fragmentPath.contains("event") || fragmentPath.contains("webinar")) {
            data.put("eventName", "WebMCP Developer Conference 2024");
            data.put("startDate", "2024-06-15T09:00:00.000Z");
            data.put("endDate", "2024-06-17T17:00:00.000Z");
            data.put("location", Map.of(
                "venue", "San Jose Convention Center",
                "address", "150 W San Carlos St, San Jose, CA 95113",
                "virtual", true,
                "virtualUrl", "https://events.adobe.com/webmcp-conf"
            ));
            data.put("speakers", Arrays.asList(
                Map.of("name", "Jane Developer", "title", "Senior Architect, Adobe", "topic", "WebMCP Deep Dive"),
                Map.of("name", "John Engineer", "title", "AI Lead, Google", "topic", "The Future of AI Agents")
            ));
            data.put("registrationOpen", true);
            data.put("maxAttendees", 500);

        } else if (fragmentPath.contains("faq") || fragmentPath.contains("help")) {
            data.put("question", "What is WebMCP and how does it work?");
            data.put("answer", "WebMCP (Web Model Context Protocol) is a browser API that allows websites to expose structured tools to AI agents. It enables AI systems to understand site structure, fill forms, navigate, and perform actions reliably.");
            data.put("category", "General");
            data.put("helpful", 156);
            data.put("notHelpful", 12);
            data.put("lastUpdated", "2024-03-01T14:30:00.000Z");
            data.put("relatedQuestions", Arrays.asList(
                "How do I enable WebMCP on my AEM site?",
                "What components are supported by WebMCP?",
                "Is user consent required for WebMCP?"
            ));

        } else {
            // Generic Content Fragment
            data.put("title", "Sample Content Fragment");
            data.put("description", "This is a sample Content Fragment exposed via WebMCP for AI agent interaction.");
            data.put("createdAt", "2024-01-15T10:00:00.000Z");
            data.put("modifiedAt", "2024-03-15T15:30:00.000Z");
            data.put("status", "published");
        }

        // Add common metadata
        data.put("_metadata", Map.of(
            "model", "demo",
            "variation", "master",
            "locale", "en"
        ));

        return data;
    }

    /**
     * Fetch all Content Fragments of a specific model type.
     *
     * @param modelName Content Fragment Model name
     * @param limit Maximum number of results
     * @param offset Pagination offset
     * @return List of Content Fragment data maps
     */
    public List<Map<String, Object>> fetchContentFragmentsByModel(String modelName, int limit, int offset) {
        if (!useMockData) throw new IllegalStateException("Model listing requires a separate persisted-query integration");
        return getMockContentFragmentList(modelName, Math.max(0, Math.min(limit, 100)));
    }

    /**
     * Get mock list of Content Fragments.
     */
    private List<Map<String, Object>> getMockContentFragmentList(String modelName, int limit) {
        List<Map<String, Object>> results = new ArrayList<>();
        for (int i = 0; i < Math.min(limit, 5); i++) {
            Map<String, Object> item = new HashMap<>();
            item.put("_path", String.format("/content/dam/sample/%s/item-%d", modelName, i + 1));
            item.put("title", String.format("Sample %s #%d", capitalizeFirst(modelName), i + 1));
            item.put("index", i);
            item.put("demo", true);
            results.add(item);
        }
        return results;
    }

    /**
     * Get Content Fragment data formatted for AI agent consumption.
     * This formats the data with clear labels and structure.
     *
     * @param fragmentPath JCR path to the Content Fragment
     * @return AI-friendly formatted data
     */
    public Map<String, Object> getContentFragmentForAI(String fragmentPath) {
        Map<String, Object> raw = fetchContentFragment(fragmentPath);
        if (raw.isEmpty()) {
            return raw;
        }

        Map<String, Object> aiFormatted = new HashMap<>();
        aiFormatted.put("source", "aem-content-fragment");
        aiFormatted.put("demo", raw.get("demo"));
        aiFormatted.put("path", fragmentPath);

        // Flatten complex structures for easier AI consumption
        Map<String, Object> fields = new HashMap<>();
        for (Map.Entry<String, Object> entry : raw.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            // Skip metadata fields
            if (key.startsWith("_")) {
                if (key.equals("_metadata")) {
                    aiFormatted.put("metadata", value);
                }
                continue;
            }

            // Simplify nested structures
            if (value instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> nested = (Map<String, Object>) value;
                if (nested.containsKey("plaintext")) {
                    fields.put(key, nested.get("plaintext"));
                } else if (nested.containsKey("_path")) {
                    // Reference to another asset/CF
                    fields.put(key, Map.of(
                        "type", "reference",
                        "path", nested.get("_path")
                    ));
                } else {
                    fields.put(key, value);
                }
            } else {
                fields.put(key, value);
            }
        }

        aiFormatted.put("fields", fields);

        // Generate a natural language summary
        aiFormatted.put("summary", generateSummary(fields));

        return aiFormatted;
    }

    /**
     * Generate a natural language summary of the Content Fragment.
     */
    private String generateSummary(Map<String, Object> fields) {
        StringBuilder summary = new StringBuilder("This content contains: ");
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        if (fieldNames.isEmpty()) {
            return "No fields available.";
        }

        for (int i = 0; i < Math.min(fieldNames.size(), 5); i++) {
            String field = fieldNames.get(i);
            Object value = fields.get(field);
            summary.append(field);
            if (value instanceof String && ((String) value).length() < 50) {
                summary.append(" (").append(value).append(")");
            }
            if (i < Math.min(fieldNames.size(), 5) - 1) {
                summary.append(", ");
            }
        }
        if (fieldNames.size() > 5) {
            summary.append(", and ").append(fieldNames.size() - 5).append(" more fields");
        }
        return summary.toString();
    }

    /** @deprecated No application cache remains; use Dispatcher/CDN invalidation. */
    @Deprecated
    public void clearCache() { }

    /** @deprecated No application cache remains; use Dispatcher/CDN invalidation. */
    @Deprecated
    public void clearCache(String path) { }

    private String capitalizeFirst(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
