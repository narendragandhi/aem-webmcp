/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.servlets;

import aemwebmcp.core.services.WebAIFunctionRegistry;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.propertytypes.ServiceDescription;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

/**
 * Servlet that exposes the registered WebMCP tools/functions as JSON.
 * This allows AI agents to discover available server-side capabilities.
 */
@Component(service = { Servlet.class })
@SlingServletResourceTypes(
    resourceTypes = "aem-webmcp/components/page", 
    methods = HttpConstants.METHOD_GET,
    selectors = "webai-tools",
    extensions = "json"
)
@ServiceDescription("WebMCP AI Tools Servlet")
public class WebAIToolsServlet extends SlingSafeMethodsServlet {

    private static final long serialVersionUID = 1L;

    @Reference
    private transient WebAIFunctionRegistry functionRegistry;

    @Override
    protected void doGet(final SlingHttpServletRequest request,
            final SlingHttpServletResponse response) throws ServletException, IOException {
        
        // 1. Permission check - ensure user has access to current resource
        if (request.getResourceResolver().getResource(request.getResource().getPath()) == null) {
            response.setStatus(SlingHttpServletResponse.SC_FORBIDDEN);
            return;
        }

        // 2. Dispatcher/CDN Caching safety
        // Ensure this is not cached globally across users
        response.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        response.setHeader("Vary", "Cookie, Authorization");
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String toolsJson = functionRegistry.getToolsJson();
        response.getWriter().write(toolsJson);
    }
}
