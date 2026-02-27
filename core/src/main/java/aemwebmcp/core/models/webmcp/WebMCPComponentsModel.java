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
        COMPONENT_DEFINITIONS.put("core/wcm/components/search", new ComponentDefinition("search", "Site search", Arrays.asList("submit"), "commerce"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/cart", new ComponentDefinition("shopping-cart", "Shopping cart", Arrays.asList("checkout"), "commerce"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/navigation", new ComponentDefinition("navigation", "Navigation", Arrays.asList("navigate"), "navigation"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/breadcrumb", new ComponentDefinition("breadcrumb", "Breadcrumb", Arrays.asList("navigate"), "navigation"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/text", new ComponentDefinition("text", "Text", Collections.emptyList(), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/title", new ComponentDefinition("title", "Title", Collections.emptyList(), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/image", new ComponentDefinition("image", "Image", Collections.emptyList(), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/teaser", new ComponentDefinition("teaser", "Teaser", Arrays.asList("click"), "content"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/container", new ComponentDefinition("container", "Container", Collections.emptyList(), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/accordion", new ComponentDefinition("accordion", "Accordion", Arrays.asList("expand"), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/tabs", new ComponentDefinition("tabs", "Tabs", Arrays.asList("select"), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/carousel", new ComponentDefinition("carousel", "Carousel", Arrays.asList("next", "prev"), "layout"));
        COMPONENT_DEFINITIONS.put("core/wcm/components/form/container", new ComponentDefinition("form", "Form", Arrays.asList("submit"), "form"));
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
