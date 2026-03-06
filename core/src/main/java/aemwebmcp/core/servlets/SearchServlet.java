package aemwebmcp.core.servlets;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
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

@Component(service = { Servlet.class })
@SlingServletResourceTypes(
        resourceTypes = "aem-webmcp/components/search",
        methods = "GET")
@ServiceDescription("AEM WebMCP Search Servlet")
public class SearchServlet extends SlingSafeMethodsServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOG = LoggerFactory.getLogger(SearchServlet.class);
    private static final Gson GSON = new GsonBuilder().create();

    private static final int MAX_QUERY_LENGTH = 100;
    private static final int MAX_RESULTS = 20;
    private static final int RATE_LIMIT_REQUESTS = 30;
    private static final int RATE_LIMIT_WINDOW_SECONDS = 60;

    private static final Pattern SAFE_QUERY_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s\\-\\.\\,\\!\\?\\'\\\"]{1,100}$");
    private static final Map<String, List<Long>> REQUEST_TIMES = new ConcurrentHashMap<>();

    private static final List<Map<String, String>> MOCK_CONTENT = new ArrayList<>();

    static {
        addMockContent();
    }

    private static void addMockContent() {
        addPage("AEM WebMCP Demo", "Main demo page showcasing WebMCP AI agent capabilities with AEM Core Components", 
                "/content/aem-webmcp/us/en");
        addPage("Shop - E-commerce Demo", "E-commerce demo page with shopping cart and product components", 
                "/content/aem-webmcp/us/en/shop");
        addPage("Contact Us", "Contact form with all field types for WebMCP AI agent testing", 
                "/content/aem-webmcp/us/en/contact");
        addPage("FAQ", "Frequently Asked Questions with accordion and tabs", 
                "/content/aem-webmcp/us/en/faq");
        addPage("WebMCP Documentation", "Learn how WebMCP works with AEM and AI agents", 
                "/content/aem-webmcp/us/en/documentation");
        addProduct("Premium Widget", "High-quality widget for all your needs", 
                "/content/aem-webmcp/us/en/shop/premium-widget", "49.99");
        addProduct("Super Gadget", "Advanced gadget with many features", 
                "/content/aem-webmcp/us/en/shop/super-gadget", "99.99");
        addProduct("Basic Tool", "Simple and reliable tool for everyday use", 
                "/content/aem-webmcp/us/en/shop/basic-tool", "19.99");
    }

    private static void addPage(String title, String description, String path) {
        Map<String, String> page = new HashMap<>();
        page.put("title", title);
        page.put("description", description);
        page.put("path", path);
        page.put("type", "page");
        MOCK_CONTENT.add(page);
    }

    private static void addProduct(String title, String description, String path, String price) {
        Map<String, String> product = new HashMap<>();
        product.put("title", title);
        product.put("description", description);
        product.put("path", path);
        product.put("type", "product");
        product.put("price", price);
        MOCK_CONTENT.add(product);
    }

    @Override
    protected void doGet(final SlingHttpServletRequest req,
                          final SlingHttpServletResponse resp) throws ServletException, IOException {
        
        if (!checkRateLimit(req, resp)) {
            return;
        }
        
        String query = req.getParameter("query");
        String fullText = req.getParameter("fullText");
        String searchTerm = (query != null ? query : (fullText != null ? fullText : "")).trim();
        
        LOG.debug("Processing search request for: {}", maskQuery(searchTerm));
        
        if (searchTerm.length() > MAX_QUERY_LENGTH) {
            sendError(resp, SlingHttpServletResponse.SC_BAD_REQUEST, "Query too long");
            return;
        }
        
        if (!SAFE_QUERY_PATTERN.matcher(searchTerm).matches() && !searchTerm.isEmpty()) {
            sendError(resp, SlingHttpServletResponse.SC_BAD_REQUEST, "Invalid query characters");
            return;
        }
        
        List<Map<String, String>> results = performSearch(searchTerm);
        
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("results", results);
        response.put("total", results.size());
        response.put("query", searchTerm);
        
        resp.getWriter().write(GSON.toJson(response));
    }

    private boolean checkRateLimit(SlingHttpServletRequest req, SlingHttpServletResponse resp) throws IOException {
        String clientId = getClientIdentifier(req);
        List<Long> times = REQUEST_TIMES.computeIfAbsent(clientId, k -> new ArrayList<>());
        
        long now = System.currentTimeMillis();
        long windowStart = now - (RATE_LIMIT_WINDOW_SECONDS * 1000);
        
        synchronized (times) {
            times.removeIf(t -> t < windowStart);
            
            if (times.size() >= RATE_LIMIT_REQUESTS) {
                LOG.warn("Rate limit exceeded for search client: {}", clientId);
                sendError(resp, 429, "Rate limit exceeded");
                return false;
            }
            
            times.add(now);
        }
        
        return true;
    }

    private String getClientIdentifier(SlingHttpServletRequest req) {
        String remoteAddr = req.getRemoteAddr();
        String forwarded = req.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded : remoteAddr;
    }

    private List<Map<String, String>> performSearch(String searchTerm) {
        List<Map<String, String>> results = new ArrayList<>();
        
        if (searchTerm.isEmpty()) {
            return results;
        }
        
        String lowerTerm = searchTerm.toLowerCase();
        
        for (Map<String, String> item : MOCK_CONTENT) {
            if (results.size() >= MAX_RESULTS) {
                break;
            }
            
            String title = item.get("title").toLowerCase();
            String description = item.get("description").toLowerCase();
            
            if (title.contains(lowerTerm) || description.contains(lowerTerm)) {
                results.add(safeCopy(item));
            }
        }
        
        LOG.debug("Search for '{}' returned {} results", maskQuery(searchTerm), results.size());
        return results;
    }

    private Map<String, String> safeCopy(Map<String, String> original) {
        Map<String, String> copy = new HashMap<>();
        for (Map.Entry<String, String> entry : original.entrySet()) {
            copy.put(entry.getKey(), entry.getValue());
        }
        return copy;
    }

    private String maskQuery(String query) {
        if (query == null || query.length() <= 4) {
            return "****";
        }
        return query.substring(0, 2) + "****" + query.substring(query.length() - 2);
    }

    private void sendError(SlingHttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        resp.getWriter().write(GSON.toJson(error));
    }
}
