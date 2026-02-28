package aemwebmcp.core.models.webmcp;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.Default;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Model(adaptables = SlingHttpServletRequest.class)
public class WebMCPComponentsModel {

    private static final Logger LOG = LoggerFactory.getLogger(WebMCPComponentsModel.class);

    private static final Map<String, ComponentDefinition> COMPONENT_DEFINITIONS = new HashMap<>();
    
    static {
        COMPONENT_DEFINITIONS.put("core/wcm/components/search", new ComponentDefinition("search", "Site search", Arrays.asList("submit", "clear"), "commerce"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/cart", new ComponentDefinition("shopping-cart", "Shopping cart", Arrays.asList("update-quantity", "remove-item", "checkout"), "commerce"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/product", new ComponentDefinition("product", "Product display", Arrays.asList("add-to-cart", "add-to-wishlist"), "commerce"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/featuredproducts", new ComponentDefinition("featured-products", "Featured products", Arrays.asList("view-all"), "commerce"));
        
        COMPONENT_DEFINITIONS.put("core/wcm/components/navigation", new ComponentDefinition("navigation", "Navigation", Arrays.asList("navigate", "expand", "collapse"), "navigation"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/languagenavigation", new ComponentDefinition("language-navigation", "Language selector", Arrays.asList("select-language"), "navigation"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/breadcrumb", new ComponentDefinition("breadcrumb", "Breadcrumb", Arrays.asList("navigate"), "navigation"));
        
        COMPONENT_DEFINITIONS.put("core/wcm/components/text", new ComponentDefinition("text", "Text", Collections.emptyList(), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/title", new ComponentDefinition("title", "Title", Collections.emptyList(), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/image", new ComponentDefinition("image", "Image", Collections.emptyList(), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/teaser", new ComponentDefinition("teaser", "Teaser", Arrays.asList("click"), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/download", new ComponentDefinition("download", "Download", Arrays.asList("download"), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/contentfragment", new ComponentDefinition("content-fragment", "Content fragment", Collections.emptyList(), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/contentfragmentlist", new ComponentDefinition("content-fragment-list", "Content fragment list", Collections.emptyList(), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/embed", new ComponentDefinition("embed", "Embedded content", Collections.emptyList(), "content"));
        
        COMPONENT_DEFINITIONS.put("core/wcm/components/container", new ComponentDefinition("container", "Container", Collections.emptyList(), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/accordion", new ComponentDefinition("accordion", "Accordion", Arrays.asList("expand", "collapse", "expand-all"), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/tabs", new ComponentDefinition("tabs", "Tabs", Arrays.asList("select-tab", "next", "prev"), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/carousel", new ComponentDefinition("carousel", "Carousel", Arrays.asList("next", "prev", "go-to-slide", "play", "pause"), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/progressbar", new ComponentDefinition("progress-bar", "Progress bar", Collections.emptyList(), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/separator", new ComponentDefinition("separator", "Separator", Collections.emptyList(), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/tableofcontents", new ComponentDefinition("table-of-contents", "Table of contents", Collections.emptyList(), "layout"));
        
        COMPONENT_DEFINITIONS.put("core/wcm/components/form/container", new ComponentDefinition("form", "Form", Arrays.asList("submit", "reset"), "form"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/form/text", new ComponentDefinition("form-field", "Form text field", Collections.emptyList(), "form"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/form/button", new ComponentDefinition("form-button", "Form button", Collections.emptyList(), "form"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/form/hidden", new ComponentDefinition("form-hidden", "Hidden field", Collections.emptyList(), "form"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/form/options", new ComponentDefinition("form-options", "Form options", Collections.emptyList(), "form"));
        
        COMPONENT_DEFINITIONS.put("core/wcm/components/pdfviewer", new ComponentDefinition("pdf-viewer", "PDF viewer", Arrays.asList("download", "print", "zoom"), "media"));
        
        COMPONENT_DEFINITIONS.put("core/wcm/components/experiencefragment", new ComponentDefinition("experience-fragment", "Experience fragment", Collections.emptyList(), "experience"));
    }

    @Self
    private SlingHttpServletRequest request;

    private boolean includeChildren = false;

    private List<ComponentDescriptor> components = new ArrayList<>();
    private List<String> categories = new ArrayList<>();
    private Map<String, Integer> componentCounts = new HashMap<>();

    @PostConstruct
    protected void init() {
        try {
            Resource resource = request.getResource();
            if (resource != null) {
                collectComponents(resource, 0);
            }
            
            categories = components.stream()
                .map(ComponentDescriptor::getCategory)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
            
            componentCounts = components.stream()
                .collect(Collectors.groupingBy(ComponentDescriptor::getAction, Collectors.counting()))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().intValue()));
                
        } catch (Exception e) {
            LOG.error("Error initializing WebMCP components model", e);
        }
    }

    private void collectComponents(Resource resource, int depth) {
        if (resource == null || depth > 10) return;
        
        String resourceType = resource.getResourceType();
        
        if (resourceType != null) {
            ComponentDefinition definition = findComponentDefinition(resourceType);
            if (definition != null) {
                components.add(new ComponentDescriptor(
                    resource.getPath(),
                    resourceType,
                    definition.getAction(),
                    definition.getDescription(),
                    definition.getInteractions(),
                    definition.getCategory()
                ));
            }
        }
        
        if (includeChildren) {
            resource.getChildren().forEach(child -> collectComponents(child, depth + 1));
        }
    }

    private ComponentDefinition findComponentDefinition(String resourceType) {
        if (COMPONENT_DEFINITIONS.containsKey(resourceType)) {
            return COMPONENT_DEFINITIONS.get(resourceType);
        }
        
        String normalized = resourceType.replaceAll("/v\\d+$", "");
        if (COMPONENT_DEFINITIONS.containsKey(normalized)) {
            return COMPONENT_DEFINITIONS.get(normalized);
        }
        
        for (Map.Entry<String, ComponentDefinition> entry : COMPONENT_DEFINITIONS.entrySet()) {
            if (resourceType.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    public List<ComponentDescriptor> getComponents() { return components; }
    public List<String> getCategories() { return categories; }
    public Map<String, Integer> getComponentCounts() { return componentCounts; }
    public int getTotalCount() { return components.size(); }
    public boolean hasComponents() { return !components.isEmpty(); }

    public static class ComponentDefinition {
        private final String action, description, category;
        private final List<String> interactions;
        public ComponentDefinition(String action, String description, List<String> interactions, String category) {
            this.action = action; this.description = description; this.interactions = interactions; this.category = category;
        }
        public String getAction() { return action; }
        public String getDescription() { return description; }
        public List<String> getInteractions() { return interactions; }
        public String getCategory() { return category; }
    }

    public static class ComponentDescriptor {
        private final String path, resourceType, action, description, category;
        private final List<String> interactions;
        public ComponentDescriptor(String path, String resourceType, String action, String description, List<String> interactions, String category) {
            this.path = path; this.resourceType = resourceType; this.action = action; this.description = description;
            this.interactions = interactions; this.category = category;
        }
        public String getPath() { return path; }
        public String getResourceType() { return resourceType; }
        public String getAction() { return action; }
        public String getDescription() { return description; }
        public List<String> getInteractions() { return interactions; }
        public String getCategory() { return category; }
    }
}
