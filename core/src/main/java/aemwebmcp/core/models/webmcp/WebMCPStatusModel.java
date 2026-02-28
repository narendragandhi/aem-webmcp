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

    @PostConstruct
    protected void init() {
        availableComponents = COMPONENTS.values().stream()
            .sorted(Comparator.comparing(ComponentInfo::getCategory).thenComparing(ComponentInfo::getName))
            .collect(Collectors.toList());
        
        totalComponents = COMPONENTS.size();
        
        componentsByCategory = COMPONENTS.values().stream()
            .collect(Collectors.groupingBy(ComponentInfo::getCategory, Collectors.summingInt(c -> 1)));
    }

    public List<ComponentInfo> getAvailableComponents() {
        return availableComponents;
    }
    
    public int getTotalComponents() {
        return totalComponents;
    }
    
    public Map<String, Integer> getComponentsByCategory() {
        return componentsByCategory;
    }
    
    public boolean isEnabled() {
        return true;
    }
    
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
