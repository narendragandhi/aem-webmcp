/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.servlets;

import aemwebmcp.core.services.WebAIChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Map;
import java.util.List;

/**
 * Session-isolated demonstration endpoint. Responses are simulated, not LLM output.
 */
@Component(service = { Servlet.class })
@SlingServletResourceTypes(
    resourceTypes = "aem-webmcp/components/page",
    methods = HttpConstants.METHOD_POST,
    selectors = "webai-chat",
    extensions = "json"
)
@ServiceDescription("WebMCP Demo Chat Servlet")
public class WebAIChatServlet extends SlingAllMethodsServlet {

    private static final long serialVersionUID = 1L;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Reference
    private transient WebAIChatService chatService;

    @Override
    protected void doPost(final SlingHttpServletRequest request,
            final SlingHttpServletResponse response) throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");

        String message = request.getParameter("message");
        if (message == null || message.isBlank() || message.length() > 5000) {
            response.setStatus(SlingHttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(MAPPER.writeValueAsString(Map.of("error", "Message must contain 1 to 5000 characters")));
            return;
        }

        // Never select history using caller input. Include the authenticated identity
        // so login/logout in the same HTTP session cannot reuse another user's history.
        String userId = request.getResourceResolver().getUserID();
        String sessionId = MAPPER.writeValueAsString(List.of(
                request.getSession().getId(), userId == null ? "anonymous" : userId));
        String aiResponse = chatService.chat(sessionId, message);
        
        response.getWriter().write(MAPPER.writeValueAsString(Map.of("response", aiResponse, "demo", true)));
    }
}
