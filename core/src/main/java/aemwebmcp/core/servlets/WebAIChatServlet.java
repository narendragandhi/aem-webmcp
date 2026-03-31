/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.servlets;

import aemwebmcp.core.services.WebAIChatService;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.propertytypes.ServiceDescription;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

/**
 * Servlet that provides server-side LLM processing fallback.
 * Used when local browser-native window.ai is not available.
 */
@Component(service = { Servlet.class })
@SlingServletResourceTypes(
    resourceTypes = "aem-webmcp/components/page",
    methods = HttpConstants.METHOD_POST,
    selectors = "webai-chat",
    extensions = "json"
)
@ServiceDescription("WebMCP AI Chat Proxy Servlet")
public class WebAIChatServlet extends SlingAllMethodsServlet {

    private static final long serialVersionUID = 1L;

    @Reference
    private transient WebAIChatService chatService;

    @Override
    protected void doPost(final SlingHttpServletRequest request,
            final SlingHttpServletResponse response) throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String message = request.getParameter("message");
        String sessionId = request.getParameter("sessionId");

        if (message == null || message.isEmpty()) {
            response.setStatus(SlingHttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"Message is required\"}");
            return;
        }

        // Delegate to server-side AI service (e.g., Vertex AI / OpenAI / Gemini Pro)
        String aiResponse = chatService.chat(sessionId != null ? sessionId : "default", message);
        
        response.getWriter().write("{\"response\":\"" + aiResponse.replace("\"", "\\\"") + "\"}");
    }
}
