/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.models.webmcp;

import org.apache.sling.api.SlingHttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import aemwebmcp.core.testcontext.AppAemContext;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(AemContextExtension.class)
class WebMCPStatusModelTest {

    private final AemContext context = AppAemContext.newAemContext();

    @BeforeEach
    public void setup() {
    }

    @Test
    void testStatusModelInitialization() throws Exception {
        SlingHttpServletRequest request = context.request();
        WebMCPStatusModel model = request.adaptTo(WebMCPStatusModel.class);
        
        assertNotNull(model);
        assertTrue(model.isEnabled());
    }

    @Test
    void testAvailableComponents() throws Exception {
        SlingHttpServletRequest request = context.request();
        WebMCPStatusModel model = request.adaptTo(WebMCPStatusModel.class);
        
        assertNotNull(model.getAvailableComponents());
        assertTrue(model.getAvailableComponents().size() > 0);
    }

    @Test
    void testTotalComponents() throws Exception {
        SlingHttpServletRequest request = context.request();
        WebMCPStatusModel model = request.adaptTo(WebMCPStatusModel.class);
        
        assertTrue(model.getTotalComponents() >= 18);
    }

    @Test
    void testComponentsByCategory() throws Exception {
        SlingHttpServletRequest request = context.request();
        WebMCPStatusModel model = request.adaptTo(WebMCPStatusModel.class);
        
        assertNotNull(model.getComponentsByCategory());
        assertTrue(model.getComponentsByCategory().containsKey("commerce"));
        assertTrue(model.getComponentsByCategory().containsKey("navigation"));
        assertTrue(model.getComponentsByCategory().containsKey("form"));
    }

    @Test
    void testComponentInteractionsDisplay() throws Exception {
        SlingHttpServletRequest request = context.request();
        WebMCPStatusModel model = request.adaptTo(WebMCPStatusModel.class);
        
        for (WebMCPStatusModel.ComponentInfo component : model.getAvailableComponents()) {
            assertNotNull(component.getName());
            assertNotNull(component.getCategory());
            assertNotNull(component.getInteractionsDisplay());
        }
    }

    @Test
    void testSearchComponentInfo() throws Exception {
        SlingHttpServletRequest request = context.request();
        WebMCPStatusModel model = request.adaptTo(WebMCPStatusModel.class);
        
        WebMCPStatusModel.ComponentInfo search = model.getAvailableComponents().stream()
            .filter(c -> c.getName().equals("Search"))
            .findFirst()
            .orElse(null);
        
        assertNotNull(search);
        assertEquals("commerce", search.getCategory());
        assertTrue(search.getInteractions().contains("submit"));
        assertTrue(search.getInteractions().contains("clear"));
    }

    @Test
    void testFormComponentInfo() throws Exception {
        SlingHttpServletRequest request = context.request();
        WebMCPStatusModel model = request.adaptTo(WebMCPStatusModel.class);
        
        WebMCPStatusModel.ComponentInfo form = model.getAvailableComponents().stream()
            .filter(c -> c.getName().equals("Form"))
            .findFirst()
            .orElse(null);
        
        assertNotNull(form);
        assertEquals("form", form.getCategory());
        assertTrue(form.getInteractions().contains("submit"));
        assertTrue(form.getInteractions().contains("reset"));
    }
}
