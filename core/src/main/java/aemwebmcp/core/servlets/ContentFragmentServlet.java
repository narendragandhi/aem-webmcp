/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.servlets;

import aemwebmcp.core.services.ContentFragmentGraphQLService;
import aemwebmcp.core.services.WebMCPMetricsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletPaths;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.propertytypes.ServiceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servlet for exposing Content Fragment data to WebMCP AI agents.
 *
 * <p>Endpoints:
 * <ul>
 *   <li><code>GET /bin/webmcp/content-fragment?path=/content/dam/...</code> - Fetch single CF</li>
 *   <li><code>GET /bin/webmcp/content-fragment?model=article&limit=10</code> - List CFs by model</li>
 *   <li><code>GET /bin/webmcp/content-fragment?path=...&format=ai</code> - AI-optimized format</li>
 * </ul>
 *
 * @since 1.1.0
 * @author AEM WebMCP Team
 */
@Component(service = { Servlet.class })
@SlingServletPaths("/bin/webmcp/content-fragment")
@ServiceDescription("AEM WebMCP Content Fragment Servlet")
public class ContentFragmentServlet extends SlingSafeMethodsServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOG = LoggerFactory.getLogger(ContentFragmentServlet.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Reference
    private ContentFragmentGraphQLService contentFragmentService;

    @Reference
    private WebMCPMetricsService metricsService;

    @Override
    protected void doGet(final SlingHttpServletRequest req,
                         final SlingHttpServletResponse resp) throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        // CORS headers for cross-origin AI agent access
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");

        try {
            String path = req.getParameter("path");
            String model = req.getParameter("model");
            String format = req.getParameter("format");
            String limitParam = req.getParameter("limit");
            String offsetParam = req.getParameter("offset");

            Map<String, Object> response = new HashMap<>();

            if (path != null && !path.isEmpty()) {
                // Fetch single Content Fragment
                WebMCPMetricsService.TraceContext trace = metricsService.startSpan("content_fragment_fetch");
                metricsService.setSpanAttribute("cf.path", path);

                try {
                    Map<String, Object> data;
                    if ("ai".equalsIgnoreCase(format)) {
                        data = contentFragmentService.getContentFragmentForAI(path);
                    } else {
                        data = contentFragmentService.fetchContentFragment(path);
                    }

                    if (data.isEmpty()) {
                        response.put("success", false);
                        response.put("error", "Content Fragment not found");
                        resp.setStatus(SlingHttpServletResponse.SC_NOT_FOUND);
                    } else {
                        response.put("success", true);
                        response.put("data", data);
                    }
                } finally {
                    metricsService.endSpan(trace);
                }

            } else if (model != null && !model.isEmpty()) {
                // List Content Fragments by model
                int limit = parseIntOrDefault(limitParam, 10);
                int offset = parseIntOrDefault(offsetParam, 0);

                // Validate limits
                if (limit > 100) limit = 100;
                if (limit < 1) limit = 1;
                if (offset < 0) offset = 0;

                List<Map<String, Object>> items = contentFragmentService.fetchContentFragmentsByModel(model, limit, offset);

                response.put("success", true);
                response.put("model", model);
                response.put("items", items);
                response.put("count", items.size());
                response.put("limit", limit);
                response.put("offset", offset);

            } else {
                // No path or model specified - return usage info
                response.put("success", false);
                response.put("error", "Missing required parameter: 'path' or 'model'");
                response.put("usage", Map.of(
                    "fetchSingle", "/bin/webmcp/content-fragment?path=/content/dam/...",
                    "fetchAIFormat", "/bin/webmcp/content-fragment?path=/content/dam/...&format=ai",
                    "listByModel", "/bin/webmcp/content-fragment?model=article&limit=10&offset=0"
                ));
                resp.setStatus(SlingHttpServletResponse.SC_BAD_REQUEST);
            }

            resp.getWriter().write(MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(response));

        } catch (Exception e) {
            LOG.error("Error processing Content Fragment request", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Internal server error");
            resp.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write(MAPPER.writeValueAsString(error));
        }
    }

    private int parseIntOrDefault(String value, int defaultValue) {
        if (value == null || value.isEmpty()) return defaultValue;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
