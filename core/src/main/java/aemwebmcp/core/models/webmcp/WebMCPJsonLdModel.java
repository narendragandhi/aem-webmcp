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

@Model(adaptables = SlingHttpServletRequest.class)
public class WebMCPJsonLdModel {

    private static final Logger LOG = LoggerFactory.getLogger(WebMCPJsonLdModel.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Self
    private SlingHttpServletRequest request;

    private String jsonLdScript;
    private boolean hasWebMCPComponents;

    @PostConstruct
    protected void init() {
        try {
            Resource resource = request.getResource();
            Page page = resource.adaptTo(Page.class);
            
            if (page != null) {
                Map<String, Object> schema = new LinkedHashMap<>();
                schema.put("@context", "https://schema.org");
                schema.put("@type", "WebPage");
                schema.put("name", page.getPageTitle() != null ? page.getPageTitle() : page.getTitle());
                schema.put("description", page.getDescription());
                schema.put("url", page.getPath() + ".html");
                
                List<Map<String, Object>> potentialActions = new ArrayList<>();
                
                Map<String, Object> searchAction = new LinkedHashMap<>();
                searchAction.put("@type", "SearchAction");
                searchAction.put("target", page.getPath() + "/search?q={search_term_string}");
                searchAction.put("query-input", "required name=search_term_string");
                potentialActions.add(searchAction);
                
                schema.put("potentialAction", potentialActions);
                
                List<Map<String, Object>> breadcrumbItems = new ArrayList<>();
                buildBreadcrumb(page, breadcrumbItems);
                if (!breadcrumbItems.isEmpty()) {
                    Map<String, Object> breadcrumb = new LinkedHashMap<>();
                    breadcrumb.put("@type", "BreadcrumbList");
                    breadcrumb.put("itemListElement", breadcrumbItems);
                    schema.put("breadcrumb", breadcrumb);
                }
                
                jsonLdScript = "<script type=\"application/ld+json\">" + 
                    MAPPER.writeValueAsString(schema) + "</script>";
                
                hasWebMCPComponents = true;
            }
        } catch (Exception e) {
            LOG.error("Error generating JSON-LD", e);
        }
    }

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
            items.add(item);
        }
    }

    public String getJsonLdScript() { return jsonLdScript; }
    public boolean isHasWebMCPComponents() { return hasWebMCPComponents; }
}
