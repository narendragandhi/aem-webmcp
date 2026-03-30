/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.servlets;

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
import java.util.Map;

/**
 * Servlet for exposing WebMCP metrics to monitoring systems.
 *
 * <p>Supports two output formats:
 * <ul>
 *   <li><code>/bin/webmcp/metrics</code> - JSON format for dashboards</li>
 *   <li><code>/bin/webmcp/metrics?format=prometheus</code> - Prometheus exposition format</li>
 * </ul>
 *
 * @since 1.1.0
 * @author AEM WebMCP Team
 */
@Component(service = { Servlet.class })
@SlingServletPaths("/bin/webmcp/metrics")
@ServiceDescription("AEM WebMCP Metrics Servlet")
public class MetricsServlet extends SlingSafeMethodsServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOG = LoggerFactory.getLogger(MetricsServlet.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Reference
    private WebMCPMetricsService metricsService;

    @Override
    protected void doGet(final SlingHttpServletRequest req,
                         final SlingHttpServletResponse resp) throws ServletException, IOException {

        String format = req.getParameter("format");

        if ("prometheus".equalsIgnoreCase(format)) {
            // Prometheus exposition format
            resp.setContentType("text/plain; version=0.0.4; charset=utf-8");
            resp.setCharacterEncoding("UTF-8");
            resp.getWriter().write(metricsService.getPrometheusMetrics());
        } else {
            // JSON format (default)
            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "ok");
            response.put("timestamp", System.currentTimeMillis());
            response.put("metrics", metricsService.getMetricsSummary());

            // Add system info
            Map<String, Object> system = new HashMap<>();
            Runtime runtime = Runtime.getRuntime();
            system.put("freeMemoryMB", runtime.freeMemory() / (1024 * 1024));
            system.put("totalMemoryMB", runtime.totalMemory() / (1024 * 1024));
            system.put("maxMemoryMB", runtime.maxMemory() / (1024 * 1024));
            system.put("availableProcessors", runtime.availableProcessors());
            response.put("system", system);

            resp.getWriter().write(MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(response));
        }

        // Set cache headers - don't cache metrics
        resp.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        resp.setHeader("Pragma", "no-cache");
        resp.setHeader("Expires", "0");
    }
}
