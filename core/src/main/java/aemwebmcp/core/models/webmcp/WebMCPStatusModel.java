/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.models.webmcp;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.apache.sling.models.annotations.injectorspecific.RequestAttribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Sling Model that provides WebMCP status information for AEM pages.
 * 
 * <p>This model is used by the WebMCP status component to display
 * information about available AI agent-compatible components on the page.</p>
 * 
 * <p>Supported component categories include:</p>
 * <ul>
 *   <li>Commerce - search, cart, product components</li>
 *   <li>Navigation - navigation, breadcrumb, language navigation</li>
 *   <li>Content - text, title, image, teaser, download, embed</li>
 *   <li>Layout - container, accordion, tabs, carousel</li>
 *   <li>Form - form containers and fields</li>
 *   <li>Media - PDF viewer</li>
 *   <li>Experience - experience fragments</li>
 * </ul>
 *
 * @since 1.0.0
 * @see <a href="https://developer.chrome.com/blog/webmcp-epp">WebMCP Documentation</a>
 */
@Model(adaptables = SlingHttpServletRequest.class)
public class WebMCPStatusModel {

    private static final Logger LOG = LoggerFactory.getLogger(WebMCPStatusModel.class);
    
    private static final Map<String, ComponentInfo> COMPONENTS = new HashMap<>();
    
    static {
        COMPONENTS.put("core/wcm/components/search", new ComponentInfo("Search", "commerce", Arrays.asList("submit", "clear")));
        COMPONENTS.put("core/wcm/components/cart", new ComponentInfo("Shopping Cart", "commerce", Arrays.asList("checkout", "update-quantity")));
        COMPONENTS.put("core/wcm/components/navigation", new ComponentInfo("Navigation", "navigation", Arrays.asList("navigate")));
        COMPONENTS.put("core/wcm/components/breadcrumb", new ComponentInfo("Breadcrumb", "navigation", Arrays.asList("navigate")));
        COMPONENTS.put("core/wcm/components/languagenavigation", new ComponentInfo("Language Nav", "navigation", Arrays.asList("select-language")));
        COMPONENTS.put("core/wcm/components/text", new ComponentInfo("Text", "content", Collections.emptyList()));
        COMPONENTS.put("core/wcm/components/title", new ComponentInfo("Title", "content", Collections.emptyList()));
        COMPONENTS.put("core/wcm/components/image", new ComponentInfo("Image", "content", Collections.emptyList()));
        COMPONENTS.put("core/wcm/components/teaser", new ComponentInfo("Teaser", "content", Arrays.asList("click")));
        COMPONENTS.put("core/wcm/components/download", new ComponentInfo("Download", "content", Arrays.asList("download")));
        COMPONENTS.put("core/wcm/components/embed", new ComponentInfo("Embed", "content", Collections.emptyList()));
        COMPONENTS.put("core/wcm/components/container", new ComponentInfo("Container", "layout", Collections.emptyList()));
        COMPONENTS.put("core/wcm/components/accordion", new ComponentInfo("Accordion", "layout", Arrays.asList("expand", "collapse")));
        COMPONENTS.put("core/wcm/components/tabs", new ComponentInfo("Tabs", "layout", Arrays.asList("select-tab")));
        COMPONENTS.put("core/wcm/components/carousel", new ComponentInfo("Carousel", "layout", Arrays.asList("next", "prev")));
        COMPONENTS.put("core/wcm/components/form/container", new ComponentInfo("Form", "form", Arrays.asList("submit", "reset")));
        COMPONENTS.put("core/wcm/components/pdfviewer", new ComponentInfo("PDF Viewer", "media", Arrays.asList("download", "print")));
        COMPONENTS.put("core/wcm/components/experiencefragment", new ComponentInfo("Experience Fragment", "experience", Collections.emptyList()));
    }

    @Self
    private SlingHttpServletRequest request;
    
    @RequestAttribute(name = "webmcpEditMode", optional = true)
    private boolean webmcpEditMode;

    private List<ComponentInfo> availableComponents;
    private int totalComponents;
    private Map<String, Integer> componentsByCategory;

    /**
     * Initializes the model by populating the available components list
     * and computing category statistics.
     */
    @PostConstruct
    protected void init() {
        availableComponents = COMPONENTS.values().stream()
            .sorted(Comparator.comparing(ComponentInfo::getCategory).thenComparing(ComponentInfo::getName))
            .collect(Collectors.toList());
        
        totalComponents = COMPONENTS.size();
        
        componentsByCategory = COMPONENTS.values().stream()
            .collect(Collectors.groupingBy(ComponentInfo::getCategory, Collectors.summingInt(c -> 1)));
    }

    /**
     * Gets the list of all available WebMCP-compatible components.
     *
     * @return list of component info objects sorted by category and name
     */
    public List<ComponentInfo> getAvailableComponents() {
        return availableComponents;
    }
    
    /**
     * Gets the total count of supported components.
     *
     * @return total number of supported AEM Core Components
     */
    public int getTotalComponents() {
        return totalComponents;
    }
    
    /**
     * Gets a map of component counts grouped by category.
     *
     * @return map with category names as keys and component counts as values
     */
    public Map<String, Integer> getComponentsByCategory() {
        return componentsByCategory;
    }
    
    /**
     * Indicates whether WebMCP is enabled on the current page.
     *
     * @return always returns true as WebMCP is enabled by default
     */
    public boolean isEnabled() {
        return true;
    }
    
    /**
     * Inner class representing information about a single WebMCP-compatible component.
     * Contains the component name, category, and supported interactions.
     */
    public static class ComponentInfo {
        private final String name;
        private final String category;
        private final List<String> interactions;
        
        public ComponentInfo(String name, String category, List<String> interactions) {
            this.name = name;
            this.category = category;
            this.interactions = interactions;
        }
        
        public String getName() { return name; }
        public String getCategory() { return category; }
        public List<String> getInteractions() { return interactions; }
        public String getInteractionsDisplay() { 
            return interactions.isEmpty() ? "None" : String.join(", ", interactions); 
        }
    }
}
