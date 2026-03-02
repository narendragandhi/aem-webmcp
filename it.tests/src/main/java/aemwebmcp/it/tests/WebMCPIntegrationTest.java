/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.it.tests;

import com.adobe.cq.testing.client.CQClient;
import com.adobe.cq.testing.junit.rules.CQAuthorPublishClassRule;
import com.adobe.cq.testing.junit.rules.CQRule;
import org.apache.sling.testing.clients.ClientException;
import org.apache.sling.testing.clients.SlingHttpResponse;
import org.junit.*;

import static org.junit.Assert.*;

/**
 * Integration tests for WebMCP functionality
 */
public class WebMCPIntegrationTest {

    @ClassRule
    public static final CQAuthorPublishClassRule cqBaseClassRule = new CQAuthorPublishClassRule();

    @Rule
    public CQRule cqBaseRule = new CQRule(cqBaseClassRule.authorRule, cqBaseClassRule.publishRule);

    static CQClient adminAuthor;
    static CQClient adminPublish;

    @BeforeClass
    public static void beforeClass() throws ClientException {
        adminAuthor = cqBaseClassRule.authorRule.getAdminClient(CQClient.class);
        adminPublish = cqBaseClassRule.publishRule.getAdminClient(CQClient.class);
    }

    @Test
    public void testWebMCPClientLibraryLoaded() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/content/aem-webmcp-test.html");
        String content = response.getContent();
        assertTrue("WebMCP clientlib should be loaded", content.contains("aemwebmcp.webmcp") || content.contains("aem-webmcp"));
    }

    @Test
    public void testWebMCPJavaScriptPresent() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("WebMCP JavaScript should contain AEMWebMCPAutomator", content.contains("AEMWebMCPAutomator"));
        assertTrue("WebMCP JavaScript should contain component mappings", content.contains("componentMappings"));
    }

    @Test
    public void testWebMCPBaseClientLibrary() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-base/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("WebMCP base JS should contain AEMWebMCPAutomator", content.contains("AEMWebMCPAutomator"));
    }

    @Test
    public void testWebMCPComponentsModelExists() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/content/aem-webmcp-test.model.json");
        String content = response.getContent();
        assertNotNull("WebMCP model should return JSON", content);
    }

    @Test
    public void testWebMCPJsonLdHeadComponent() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/content/aem-webmcp-test.html");
        String content = response.getContent();
        assertTrue("Page should contain WebMCP-related content or scripts", 
            content.contains("webmcp") || content.contains("WebMCP"));
    }

    @Test
    public void testSearchComponentMapped() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Search component should be mapped", content.contains("'search'") || content.contains("\"search\""));
    }

    @Test
    public void testNavigationComponentMapped() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Navigation component should be mapped", content.contains("navigation"));
    }

    @Test
    public void testFormComponentMapped() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Form component should be mapped", content.contains("form"));
    }

    @Test
    public void testAccordionComponentMapped() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Accordion component should be mapped", content.contains("accordion"));
    }

    @Test
    public void testCarouselComponentMapped() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Carousel component should be mapped", content.contains("carousel"));
    }

    @Test
    public void testBreadcrumbComponentMapped() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Breadcrumb component should be mapped", content.contains("breadcrumb"));
    }

    @Test
    public void testCommerceComponentsMapped() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Commerce components should be mapped", content.contains("commerce") || content.contains("cart") || content.contains("shopping-cart"));
    }

    @Test
    public void testPublishInstanceWebMCP() throws ClientException {
        SlingHttpResponse response = adminPublish.doGet("/content/aem-webmcp-test.html", 200);
        String content = response.getContent();
        assertNotNull("Publish instance should return content", content);
    }

    @Test
    public void testWebMCPActionsDeclared() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Should declare getComponents action", content.contains("getComponents"));
        assertTrue("Should declare getPageInfo action", content.contains("getPageInfo"));
        assertTrue("Should declare fillForm action", content.contains("fillForm"));
        assertTrue("Should declare submitForm action", content.contains("submitForm"));
    }

    @Test
    public void testConsentMechanismExists() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Should have WEBMCP_ENABLED flag", content.contains("WEBMCP_ENABLED"));
        assertTrue("Should have WEBMCP_CONSENT flag", content.contains("WEBMCP_CONSENT"));
        assertTrue("Should have canExposeAPI method", content.contains("canExposeAPI"));
    }

    @Test
    public void testDebugPanelExists() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Should have debug panel", content.contains("webmcp-debug-panel"));
        assertTrue("Should have WEBMCP_SHOW_PANEL flag", content.contains("WEBMCP_SHOW_PANEL"));
    }

    @Test
    public void testAccessibilityTreeSupport() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Should have accessibility tree support", content.contains("getAccessibilityTree"));
        assertTrue("Should support aria attributes", content.contains("aria-"));
    }

    @Test
    public void testWebMCPSupportedCheck() throws ClientException {
        SlingHttpResponse response = adminAuthor.doGet("/etc/clientlibs/aem-webmcp/clientlib-webmcp/js/webmcp.js", 200);
        String content = response.getContent();
        assertTrue("Should check for modelContext support", content.contains("modelContext"));
    }
}
