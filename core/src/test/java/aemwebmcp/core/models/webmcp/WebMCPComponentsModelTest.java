/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.models.webmcp;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import com.day.cq.wcm.api.Page;
import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import aemwebmcp.core.testcontext.AppAemContext;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(AemContextExtension.class)
class WebMCPComponentsModelTest {

    private final AemContext context = AppAemContext.newAemContext();
    private Page page;

    @BeforeEach
    public void setup() throws Exception {
        page = context.create().page("/content/we-retail/us/en");
    }

    @Test
    void testSearchComponentDefinition() throws Exception {
        Resource searchResource = context.create().resource(page, "search",
            "sling:resourceType", "core/wcm/components/search");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(searchResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testNavigationComponentDefinition() throws Exception {
        Resource navResource = context.create().resource(page, "navigation",
            "sling:resourceType", "core/wcm/components/navigation");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(navResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testFormComponentDefinition() throws Exception {
        Resource formResource = context.create().resource(page, "form",
            "sling:resourceType", "core/wcm/components/form/container");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(formResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testBreadcrumbComponentWithVersion() throws Exception {
        Resource breadcrumbResource = context.create().resource(page, "breadcrumb",
            "sling:resourceType", "core/wcm/components/breadcrumb/v3/breadcrumb");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(breadcrumbResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testAccordionComponent() throws Exception {
        Resource accordionResource = context.create().resource(page, "accordion",
            "sling:resourceType", "core/wcm/components/accordion/v1/accordion");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(accordionResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testCarouselComponent() throws Exception {
        Resource carouselResource = context.create().resource(page, "carousel",
            "sling:resourceType", "core/wcm/components/carousel/v1/carousel");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(carouselResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testLanguageNavigationComponent() throws Exception {
        Resource langNavResource = context.create().resource(page, "langnav",
            "sling:resourceType", "core/wcm/components/languagenavigation/v1/languagenavigation");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(langNavResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testCartComponent() throws Exception {
        Resource cartResource = context.create().resource(page, "cart",
            "sling:resourceType", "core/wcm/components/commerce/cart");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(cartResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testProductComponent() throws Exception {
        Resource productResource = context.create().resource(page, "product",
            "sling:resourceType", "core/wcm/components/commerce/product");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(productResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testPDFViewerComponent() throws Exception {
        Resource pdfResource = context.create().resource(page, "pdf",
            "sling:resourceType", "core/wcm/components/pdfviewer/v1/pdfviewer");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(pdfResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }

    @Test
    void testExperienceFragmentComponent() throws Exception {
        Resource xfResource = context.create().resource(page, "xf",
            "sling:resourceType", "core/wcm/components/experiencefragment/v2/experiencefragment");
        SlingHttpServletRequest request = context.request();
        context.request().setResource(xfResource);
        WebMCPComponentsModel model = request.adaptTo(WebMCPComponentsModel.class);
        assertNotNull(model);
    }
}
