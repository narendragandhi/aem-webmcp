/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.servlets;

import aemwebmcp.core.services.WebAIFunctionRegistry;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.servlet.ServletException;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebAIToolsServletTest {

    @Mock
    private WebAIFunctionRegistry functionRegistry;

    @Mock
    private SlingHttpServletRequest request;

    @Mock
    private SlingHttpServletResponse response;

    @InjectMocks
    private WebAIToolsServlet fixture;

    @Test
    void doGet() throws ServletException, IOException {
        String expectedJson = "{\"tools\":[]}";
        when(functionRegistry.getToolsJson()).thenReturn(expectedJson);

        // Set up the permission-check chain: request.getResource().getPath()
        Resource resource = mock(Resource.class);
        ResourceResolver resourceResolver = mock(ResourceResolver.class);
        when(request.getResource()).thenReturn(resource);
        when(resource.getPath()).thenReturn("/content/test");
        when(request.getResourceResolver()).thenReturn(resourceResolver);
        when(resourceResolver.getResource("/content/test")).thenReturn(resource);

        StringWriter stringWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(writer);

        fixture.doGet(request, response);

        verify(response).setContentType("application/json");
        verify(response).setCharacterEncoding("UTF-8");
        writer.flush();
        assertEquals(expectedJson, stringWriter.toString());
    }
}
