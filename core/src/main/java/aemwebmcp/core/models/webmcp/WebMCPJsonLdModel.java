package aemwebmcp.core.models.webmcp;

import com.day.cq.wcm.api.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.util.*;

/**
 * Sling Model for generating JSON-LD structured data for WebMCP.
 * This model provides Schema.org metadata to help AI agents understand the page structure and capabilities.
 * 
 * @since 1.0.0
 * @author AEM WebMCP Team
 */
@Model(adaptables = SlingHttpServletRequest.class)
public class WebMCPJsonLdModel {

    private static final Logger LOG = LoggerFactory.getLogger(WebMCPJsonLdModel.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Self
    private SlingHttpServletRequest request;

    /** The generated JSON-LD script tag. */
    private String jsonLdScript;
    
    /** Flag indicating if WebMCP components are present on the page. */
    private boolean hasWebMCPComponents;

    /**
     * Initializes the model by generating the JSON-LD structure based on the current page.
     */
    @PostConstruct
    protected void init() {
        try {
            Resource resource = request.getResource();
            Page page = resource.adaptTo(Page.class);
            
            if (page != null) {
                List<Map<String, Object>> schemas = new ArrayList<>();
                
                // 1. WebSite schema with search action
                Map<String, Object> website = new LinkedHashMap<>();
                website.put("@context", "https://schema.org");
                website.put("@type", "WebSite");
                website.put("name", page.getTitle() != null ? page.getTitle() : "AEM Site");
                website.put("url", getBaseUrl() + page.getPath());
                
                Map<String, Object> searchAction = new LinkedHashMap<>();
                searchAction.put("@type", "SearchAction");
                searchAction.put("target", getBaseUrl() + "/search?q={search_term_string}");
                searchAction.put("query-input", "required name=search_term_string");
                website.put("potentialAction", searchAction);
                schemas.add(website);
                
                // 2. WebPage schema
                Map<String, Object> webpage = new LinkedHashMap<>();
                webpage.put("@context", "https://schema.org");
                webpage.put("@type", "WebPage");
                webpage.put("name", page.getPageTitle() != null ? page.getPageTitle() : page.getTitle());
                webpage.put("description", page.getDescription());
                webpage.put("url", getBaseUrl() + page.getPath() + ".html");
                webpage.put("datePublished", page.getProperties().get("jcr:created", String.class));
                webpage.put("dateModified", page.getProperties().get("cq:lastModified", page.getProperties().get("jcr:lastModified", String.class)));
                
                // Breadcrumb
                List<Map<String, Object>> breadcrumbItems = new ArrayList<>();
                buildBreadcrumb(page, breadcrumbItems);
                if (!breadcrumbItems.isEmpty()) {
                    Map<String, Object> breadcrumb = new LinkedHashMap<>();
                    breadcrumb.put("@type", "BreadcrumbList");
                    breadcrumb.put("itemListElement", breadcrumbItems);
                    webpage.put("breadcrumb", breadcrumb);
                }
                schemas.add(webpage);
                
                // 3. Organization schema
                Map<String, Object> org = new LinkedHashMap<>();
                org.put("@context", "https://schema.org");
                org.put("@type", "Organization");
                org.put("name", "AEM WebMCP");
                org.put("url", getBaseUrl());
                schemas.add(org);
                
                // 4. AI Agent Capabilities (custom schema)
                Map<String, Object> aiCapabilities = new LinkedHashMap<>();
                aiCapabilities.put("@context", "https://schema.org");
                aiCapabilities.put("@type", "SoftwareApplication");
                aiCapabilities.put("name", "AEM WebMCP Agent");
                aiCapabilities.put("applicationCategory", "DeveloperTools");
                aiCapabilities.put("operatingSystem", "Web Browser");
                aiCapabilities.put("description", "AI agent can interact with this page using WebMCP protocol");
                
                List<Map<String, Object>> supportedActions = new ArrayList<>();
                supportedActions.add(createAction("search", "Search the site", "query", "string"));
                supportedActions.add(createAction("form", "Fill and submit forms", "selector, value", "string"));
                supportedActions.add(createAction("navigate", "Navigate to pages", "url", "url"));
                supportedActions.add(createAction("accordion", "Expand/collapse accordion sections", "selector, action", "string"));
                supportedActions.add(createAction("tabs", "Switch between tabs", "selector, index", "integer"));
                supportedActions.add(createAction("carousel", "Navigate carousel slides", "selector, action", "string"));
                supportedActions.add(createAction("breadcrumb", "Navigate via breadcrumb", "selector", "string"));
                aiCapabilities.put("potentialAction", supportedActions);
                schemas.add(aiCapabilities);
                
                // Output as @graph for multiple schemas
                Map<String, Object> graph = new LinkedHashMap<>();
                graph.put("@context", "https://schema.org");
                graph.put("@graph", schemas);
                
                jsonLdScript = "<script type=\"application/ld+json\">" + 
                    MAPPER.writeValueAsString(graph) + "</script>";
                
                hasWebMCPComponents = true;
            }
        } catch (Exception e) {
            LOG.error("Error generating JSON-LD", e);
        }
    }
    
    /**
     * Creates a ProgramAction schema entry for a specific capability.
     * 
     * @param name Action name.
     * @param description Action description.
     * @param params Parameter names.
     * @param paramType Parameter data type.
     * @return Map representing the action.
     */
    private Map<String, Object> createAction(String name, String description, String params, String paramType) {
        Map<String, Object> action = new LinkedHashMap<>();
        action.put("@type", "ProgramAction");
        action.put("name", name);
        action.put("description", description);
        
        Map<String, Object> target = new LinkedHashMap<>();
        target.put("@type", "EntryPoint");
        target.put("urlTemplate", "javascript:AEMWebMCP." + name + "()");
        action.put("target", target);
        
        return action;
    }

    /**
     * Determines the base URL of the application.
     * @return The base URL string.
     */
    private String getBaseUrl() {
        StringBuffer url = request.getRequestURL();
        if (url != null) {
            int idx = url.indexOf("/", 8);
            if (idx > 0) {
                return url.substring(0, idx);
            }
        }
        return "https://localhost:4502";
    }
    
    /**
     * Recursively builds breadcrumb items from the page hierarchy.
     * 
     * @param page The current page.
     * @param items List to append breadcrumb items to.
     */
    private void buildBreadcrumb(Page page, List<Map<String, Object>> items) {
        if (page == null) return;
        
        LinkedList<Page> trail = new LinkedList<>();
        Page current = page;
        while (current != null) {
            trail.addFirst(current);
            current = current.getParent();
        }
        
        int position = 1;
        for (Page p : trail) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("@type", "ListItem");
            item.put("position", String.valueOf(position++));
            item.put("name", p.getTitle() != null ? p.getTitle() : p.getName());
            item.put("url", getBaseUrl() + p.getPath() + ".html");
            items.add(item);
        }
    }

    /**
     * Gets the generated JSON-LD script.
     * @return HTML script tag with JSON-LD content.
     */
    public String getJsonLdScript() { return jsonLdScript; }

    /**
     * Checks if WebMCP components are present.
     * @return true if components are present, false otherwise.
     */
    public boolean isHasWebMCPComponents() { return hasWebMCPComponents; }
}
