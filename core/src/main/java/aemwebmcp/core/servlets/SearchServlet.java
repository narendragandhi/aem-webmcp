package aemwebmcp.core.servlets;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.propertytypes.ServiceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Servlet for handling search requests in the WebMCP context.
 */
@Component(service = { Servlet.class })
@SlingServletResourceTypes(
        resourceTypes = "aem-webmcp/components/search",
        methods = "GET")
@ServiceDescription("AEM WebMCP Search Servlet")
public class SearchServlet extends SlingSafeMethodsServlet {

    private static final long serialVersionUID = 1L;

    private static final int MAX_QUERY_LENGTH = 100;
    private static final int MAX_RESULTS = 20;
    private static final int RATE_LIMIT_REQUESTS = 30;
    private static final int RATE_LIMIT_WINDOW_SECONDS = 60;

    private static final Pattern SAFE_QUERY_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s\\-\\.\\,\\!\\?\\'\\\"]{1,100}$");
    private static final Map<String, List<Long>> REQUEST_TIMES = new ConcurrentHashMap<>();
    private static final List<Map<String, String>> MOCK_CONTENT = new ArrayList<>();

    static {
        initializeMockContent();
    }

    private static void initializeMockContent() {
        MOCK_CONTENT.clear();
        addEntry("AEM WebMCP Demo", "Main demo page", "/content/aem-webmcp/us/en", "page");
        addEntry("Shop", "E-commerce demo", "/content/aem-webmcp/us/en/shop", "page");
        addEntry("Contact Us", "Contact form", "/content/aem-webmcp/us/en/contact", "page");
        addEntry("Premium Widget", "Widget", "/content/aem-webmcp/us/en/shop/premium-widget", "product");
    }

    private static void addEntry(String title, String description, String path, String type) {
        Map<String, String> entry = new HashMap<>();
        entry.put("title", title);
        entry.put("description", description);
        entry.put("path", path);
        entry.put("type", type);
        MOCK_CONTENT.add(entry);
    }

    @Override
    protected void doGet(final SlingHttpServletRequest req,
                          final SlingHttpServletResponse resp) throws ServletException, IOException {
        
        if (!isWithinRateLimit(req)) {
            sendError(resp, 429, "Rate limit exceeded");
            return;
        }
        
        String query = req.getParameter("query");
        String fullText = req.getParameter("fullText");
        String searchTerm = (query != null ? query : (fullText != null ? fullText : "")).trim();
        
        if (searchTerm.length() > MAX_QUERY_LENGTH) {
            sendError(resp, 400, "Query too long");
            return;
        }
        
        if (!searchTerm.isEmpty() && !SAFE_QUERY_PATTERN.matcher(searchTerm).matches()) {
            sendError(resp, 400, "Invalid query characters");
            return;
        }
        
        List<Map<String, String>> results = findResults(searchTerm);
        
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("results", results);
        response.put("total", results.size());
        response.put("query", searchTerm);
        
        try {
            resp.getWriter().write(new ObjectMapper().writeValueAsString(response));
        } catch (Exception e) {
            resp.getWriter().write("{\"success\":false}");
        }
    }

    private boolean isWithinRateLimit(SlingHttpServletRequest req) {
        String clientId = req.getRemoteAddr();
        if (clientId == null) clientId = "unknown";
        List<Long> times = REQUEST_TIMES.computeIfAbsent(clientId, k -> new ArrayList<>());
        long now = System.currentTimeMillis();
        long window = now - (RATE_LIMIT_WINDOW_SECONDS * 1000);
        
        synchronized (times) {
            times.removeIf(t -> t < window);
            if (times.size() >= RATE_LIMIT_REQUESTS) return false;
            times.add(now);
            return true;
        }
    }

    private List<Map<String, String>> findResults(String term) {
        List<Map<String, String>> results = new ArrayList<>();
        if (term.isEmpty()) return results;
        String lower = term.toLowerCase();
        for (Map<String, String> item : MOCK_CONTENT) {
            if (results.size() >= MAX_RESULTS) break;
            if (item.get("title").toLowerCase().contains(lower) || 
                item.get("description").toLowerCase().contains(lower)) {
                results.add(new HashMap<>(item));
            }
        }
        return results;
    }

    private void sendError(SlingHttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        try {
            resp.getWriter().write(new ObjectMapper().writeValueAsString(error));
        } catch (Exception e) {
            resp.getWriter().write("{\"success\":false}");
        }
    }
}
