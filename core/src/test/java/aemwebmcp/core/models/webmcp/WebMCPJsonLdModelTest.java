package aemwebmcp.core.models.webmcp;

import com.day.cq.wcm.api.Page;
import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import org.apache.sling.api.resource.Resource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(AemContextExtension.class)
class WebMCPJsonLdModelTest {

    private WebMCPJsonLdModel fixture;
    private Page page;

    @BeforeEach
    void setUp(AemContext context) {
        page = context.create().page("/content/test", "content-page", "Test Page Title");
        context.create().page("/content/test/child", "child-page", "Child Page Title");
        
        // Set current resource to the page itself (adaptable to Page)
        context.currentResource(page.adaptTo(Resource.class));
    }

    @Test
    void testJsonLdGeneration(AemContext context) {
        fixture = context.request().adaptTo(WebMCPJsonLdModel.class);
        
        assertNotNull(fixture, "Model should be adaptable from request");
        String jsonLd = fixture.getJsonLdScript();
        assertNotNull(jsonLd, "JSON-LD script should not be null");
        assertTrue(jsonLd.startsWith("<script type=\"application/ld+json\">"));
        assertTrue(jsonLd.endsWith("</script>"));
        assertTrue(jsonLd.contains("WebSite"));
        assertTrue(jsonLd.contains("WebPage"));
        assertTrue(fixture.isHasWebMCPComponents());
    }

    @Test
    void testBreadcrumb(AemContext context) {
        Page childPage = context.pageManager().getPage("/content/test/child");
        context.currentResource(childPage.adaptTo(Resource.class));
        
        fixture = context.request().adaptTo(WebMCPJsonLdModel.class);
        
        String jsonLd = fixture.getJsonLdScript();
        assertNotNull(jsonLd);
        assertTrue(jsonLd.contains("BreadcrumbList"));
        assertTrue(jsonLd.contains("Test Page Title"));
        assertTrue(jsonLd.contains("Child Page Title"));
    }

    @Test
    void testAiCapabilities(AemContext context) {
        fixture = context.request().adaptTo(WebMCPJsonLdModel.class);
        
        String jsonLd = fixture.getJsonLdScript();
        assertNotNull(jsonLd);
        assertTrue(jsonLd.contains("AEM WebMCP Agent"));
        assertTrue(jsonLd.contains("ProgramAction"));
        assertTrue(jsonLd.contains("search"));
        assertTrue(jsonLd.contains("form"));
    }

    @Test
    void testEmptyPage(AemContext context) {
        // Test with a resource that is not a page
        Resource nonPage = context.create().resource("/content/not-a-page");
        context.currentResource(nonPage);
        
        fixture = context.request().adaptTo(WebMCPJsonLdModel.class);
        
        assertNotNull(fixture);
        assertNull(fixture.getJsonLdScript());
        assertFalse(fixture.isHasWebMCPComponents());
    }
}
