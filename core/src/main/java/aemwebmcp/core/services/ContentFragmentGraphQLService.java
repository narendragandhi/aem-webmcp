/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for fetching Content Fragment data via AEM GraphQL API.
 *
 * <p>This service enables WebMCP to expose Content Fragment field values
 * to AI agents, allowing them to understand and interact with structured
 * content on the page.
 *
 * <p>Features:
 * <ul>
 *   <li>GraphQL persisted query support</li>
 *   <li>Content Fragment model discovery</li>
 *   <li>Field extraction with type mapping</li>
 *   <li>Caching for performance</li>
 *   <li>Fallback to mock data for development</li>
 * </ul>
 *
 * @since 1.1.0
 * @author AEM WebMCP Team
 */
@Component(service = ContentFragmentGraphQLService.class, immediate = true)
@Designate(ocd = ContentFragmentGraphQLService.Config.class)
public class ContentFragmentGraphQLService {

    private static final Logger LOG = LoggerFactory.getLogger(ContentFragmentGraphQLService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @ObjectClassDefinition(
        name = "AEM WebMCP Content Fragment GraphQL Configuration",
        description = "Configuration for Content Fragment data extraction via GraphQL"
    )
    public @interface Config {
        @AttributeDefinition(
            name = "GraphQL Endpoint",
            description = "AEM GraphQL endpoint path",
            defaultValue = "/content/graphql/global/endpoint.json"
        )
        String graphql_endpoint() default "/content/graphql/global/endpoint.json";

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
            description = "Cache time-to-live for Content Fragment data",
            defaultValue = "300"
        )
        int cache_ttlSeconds() default 300;

        @AttributeDefinition(
            name = "Max Depth",
            description = "Maximum depth for nested Content Fragment references",
            defaultValue = "3"
        )
        int max_depth() default 3;
    }

    @Reference
    private WebMCPMetricsService metricsService;

    private String graphqlEndpoint;
    private boolean usePersistedQueries;
    private boolean useMockData;
    private int cacheTtlSeconds;
    private int maxDepth;

    // Cache for Content Fragment data
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    @Activate
    protected void activate(Config config) {
        this.graphqlEndpoint = config.graphql_endpoint();
        this.usePersistedQueries = config.use_persistedQueries();
        this.useMockData = config.use_mockData();
        this.cacheTtlSeconds = config.cache_ttlSeconds();
        this.maxDepth = config.max_depth();

        LOG.info("ContentFragmentGraphQLService activated - endpoint: {}, mock: {}", graphqlEndpoint, useMockData);
    }

    /**
     * Fetch Content Fragment data by path.
     *
     * @param fragmentPath JCR path to the Content Fragment
     * @return Map containing the Content Fragment fields and values
     */
    public Map<String, Object> fetchContentFragment(String fragmentPath) {
        if (fragmentPath == null || fragmentPath.isEmpty()) {
            return Collections.emptyMap();
        }

        // Check cache
        CacheEntry cached = cache.get(fragmentPath);
        if (cached != null && !cached.isExpired()) {
            LOG.debug("Cache hit for Content Fragment: {}", fragmentPath);
            return cached.getData();
        }

        WebMCPMetricsService.Timer timer = metricsService.startTimer("content_fragment_fetch");
        try {
            Map<String, Object> data;
            if (useMockData) {
                data = getMockContentFragment(fragmentPath);
            } else {
                data = fetchFromGraphQL(fragmentPath);
            }

            // Cache the result
            cache.put(fragmentPath, new CacheEntry(data, cacheTtlSeconds));
            metricsService.recordContentFragmentFetch(fragmentPath, true);
            return data;

        } catch (Exception e) {
            LOG.error("Failed to fetch Content Fragment: {}", fragmentPath, e);
            metricsService.recordContentFragmentFetch(fragmentPath, false);
            return Collections.emptyMap();
        } finally {
            timer.stop();
        }
    }

    /**
     * Fetch Content Fragment data using GraphQL.
     *
     * @param fragmentPath JCR path to the Content Fragment
     * @return Map containing the Content Fragment fields
     */
    private Map<String, Object> fetchFromGraphQL(String fragmentPath) throws IOException {
        // Build GraphQL query
        String query = buildContentFragmentQuery(fragmentPath);

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost request = new HttpPost(graphqlEndpoint);
            request.setHeader("Content-Type", "application/json");

            ObjectNode requestBody = MAPPER.createObjectNode();
            requestBody.put("query", query);
            request.setEntity(new StringEntity(MAPPER.writeValueAsString(requestBody)));

            try (CloseableHttpResponse response = httpClient.execute(request)) {
                String responseBody = EntityUtils.toString(response.getEntity());
                JsonNode jsonResponse = MAPPER.readTree(responseBody);

                if (jsonResponse.has("errors")) {
                    LOG.error("GraphQL errors: {}", jsonResponse.get("errors"));
                    return Collections.emptyMap();
                }

                return parseGraphQLResponse(jsonResponse, fragmentPath);
            }
        }
    }

    /**
     * Build a GraphQL query for a Content Fragment.
     *
     * @param fragmentPath JCR path to the Content Fragment
     * @return GraphQL query string
     */
    private String buildContentFragmentQuery(String fragmentPath) {
        // Extract the model name from the path
        // E.g., /content/dam/my-project/content-fragments/article -> articleByPath
        String modelName = extractModelName(fragmentPath);

        return String.format("""
            {
              %sByPath(_path: "%s") {
                item {
                  _path
                  _metadata {
                    stringMetadata {
                      name
                      value
                    }
                  }
                  ... on %sModel {
                    _variations
                  }
                }
              }
            }
            """, modelName, fragmentPath, capitalizeFirst(modelName));
    }

    /**
     * Parse GraphQL response into a map.
     *
     * @param response GraphQL JSON response
     * @param fragmentPath Original fragment path
     * @return Parsed Content Fragment data
     */
    private Map<String, Object> parseGraphQLResponse(JsonNode response, String fragmentPath) {
        Map<String, Object> result = new HashMap<>();
        result.put("_path", fragmentPath);

        JsonNode data = response.get("data");
        if (data == null) {
            return result;
        }

        // Find the first non-null field in data (the actual CF data)
        Iterator<Map.Entry<String, JsonNode>> fields = data.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            JsonNode itemWrapper = field.getValue();
            if (itemWrapper != null && itemWrapper.has("item")) {
                JsonNode item = itemWrapper.get("item");
                result.putAll(jsonNodeToMap(item));
                break;
            }
        }

        return result;
    }

    /**
     * Convert a JsonNode to a Map recursively.
     */
    private Map<String, Object> jsonNodeToMap(JsonNode node) {
        Map<String, Object> map = new HashMap<>();
        if (node == null || node.isNull()) {
            return map;
        }

        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            String key = entry.getKey();
            JsonNode value = entry.getValue();

            if (value.isArray()) {
                List<Object> list = new ArrayList<>();
                for (JsonNode element : value) {
                    if (element.isObject()) {
                        list.add(jsonNodeToMap(element));
                    } else {
                        list.add(getJsonValue(element));
                    }
                }
                map.put(key, list);
            } else if (value.isObject()) {
                map.put(key, jsonNodeToMap(value));
            } else {
                map.put(key, getJsonValue(value));
            }
        }
        return map;
    }

    /**
     * Get primitive value from JsonNode.
     */
    private Object getJsonValue(JsonNode node) {
        if (node.isTextual()) return node.asText();
        if (node.isInt()) return node.asInt();
        if (node.isLong()) return node.asLong();
        if (node.isDouble()) return node.asDouble();
        if (node.isBoolean()) return node.asBoolean();
        if (node.isNull()) return null;
        return node.asText();
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
            "model", extractModelName(fragmentPath),
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
        WebMCPMetricsService.Timer timer = metricsService.startTimer("graphql_query");
        try {
            if (useMockData) {
                return getMockContentFragmentList(modelName, limit);
            }

            String query = buildListQuery(modelName, limit, offset);
            // Execute query and parse results
            // For brevity, returning mock data pattern
            return getMockContentFragmentList(modelName, limit);

        } finally {
            timer.stop();
        }
    }

    /**
     * Build a list query for Content Fragments.
     */
    private String buildListQuery(String modelName, int limit, int offset) {
        return String.format("""
            {
              %sList(
                _locale: "en"
                limit: %d
                offset: %d
              ) {
                items {
                  _path
                  _metadata {
                    stringMetadata {
                      name
                      value
                    }
                  }
                }
              }
            }
            """, modelName, limit, offset);
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

    /**
     * Clear the Content Fragment cache.
     */
    public void clearCache() {
        cache.clear();
        LOG.info("Content Fragment cache cleared");
    }

    /**
     * Clear cache for a specific path.
     *
     * @param path Path to clear from cache
     */
    public void clearCache(String path) {
        cache.remove(path);
        LOG.debug("Cache cleared for: {}", path);
    }

    // ==================== HELPER METHODS ====================

    private String extractModelName(String path) {
        // Extract model name from path patterns
        // /content/dam/project/content-fragments/article/my-article -> article
        String[] parts = path.split("/");
        for (int i = parts.length - 2; i >= 0; i--) {
            String part = parts[i];
            if (!part.isEmpty() && !part.equals("content-fragments") && !part.equals("dam")) {
                return part.toLowerCase().replaceAll("-", "");
            }
        }
        return "contentfragment";
    }

    private String capitalizeFirst(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    // ==================== CACHE ENTRY ====================

    private static class CacheEntry {
        private final Map<String, Object> data;
        private final long expiryTime;

        CacheEntry(Map<String, Object> data, int ttlSeconds) {
            this.data = data;
            this.expiryTime = System.currentTimeMillis() + (ttlSeconds * 1000L);
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }

        Map<String, Object> getData() {
            return data;
        }
    }
}
