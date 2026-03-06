package aemwebmcp.core.servlets;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.jcr.api.SlingRepository;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.propertytypes.ServiceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.ThreadMXBean;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Component(service = { Servlet.class })
@SlingServletResourceTypes(
        resourceTypes = "aem-webmcp/components/page",
        methods = "GET",
        extensions = "json",
        selectors = "health")
@ServiceDescription("AEM WebMCP Health Check Servlet")
public class HealthCheckServlet extends SlingSafeMethodsServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOG = LoggerFactory.getLogger(HealthCheckServlet.class);
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    private static final AtomicInteger FORM_SUBMISSIONS = new AtomicInteger(0);
    private static final AtomicInteger CART_OPERATIONS = new AtomicInteger(0);
    private static final AtomicInteger SEARCH_QUERIES = new AtomicInteger(0);
    private static final AtomicInteger RATE_LIMIT_HITS = new AtomicInteger(0);
    private static final AtomicLong START_TIME = new AtomicLong(System.currentTimeMillis());

    @Reference
    private SlingRepository repository;

    @Override
    protected void doGet(final SlingHttpServletRequest req,
                          final SlingHttpServletResponse resp) throws ServletException, IOException {
        
        LOG.debug("Health check requested");
        
        Map<String, Object> health = new HashMap<>();
        Map<String, Object> status = new HashMap<>();
        
        boolean jcrHealthy = checkJCR();
        
        status.put("jcr", jcrHealthy ? "UP" : "DOWN");
        status.put("overall", jcrHealthy ? "UP" : "DEGRADED");
        
        health.put("status", status);
        health.put("timestamp", System.currentTimeMillis());
        health.put("uptimeSeconds", (System.currentTimeMillis() - START_TIME.get()) / 1000);
        
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("formSubmissions", FORM_SUBMISSIONS.get());
        metrics.put("cartOperations", CART_OPERATIONS.get());
        metrics.put("searchQueries", SEARCH_QUERIES.get());
        metrics.put("rateLimitHits", RATE_LIMIT_HITS.get());
        health.put("metrics", metrics);
        
        Map<String, Object> system = new HashMap<>();
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        system.put("heapUsedMB", memoryBean.getHeapMemoryUsage().getUsed() / (1024 * 1024));
        system.put("heapMaxMB", memoryBean.getHeapMemoryUsage().getMax() / (1024 * 1024));
        
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        system.put("threads", threadBean.getThreadCount());
        
        health.put("system", system);
        
        Map<String, Object> checks = new HashMap<>();
        checks.put("memory", memoryBean.getHeapMemoryUsage().getUsed() < memoryBean.getHeapMemoryUsage().getMax() * 0.9);
        checks.put("threads", threadBean.getThreadCount() < 500);
        health.put("checks", checks);
        
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setStatus(jcrHealthy ? SlingHttpServletResponse.SC_OK : SlingHttpServletResponse.SC_SERVICE_UNAVAILABLE);
        resp.getWriter().write(GSON.toJson(health));
    }

    private boolean checkJCR() {
        try {
            if (repository != null) {
                repository.loginAdministrative(null);
                return true;
            }
        } catch (Exception e) {
            LOG.warn("JCR health check failed: {}", e.getMessage());
        }
        return false;
    }

    public static void incrementFormSubmissions() {
        FORM_SUBMISSIONS.incrementAndGet();
    }

    public static void incrementCartOperations() {
        CART_OPERATIONS.incrementAndGet();
    }

    public static void incrementSearchQueries() {
        SEARCH_QUERIES.incrementAndGet();
    }

    public static void incrementRateLimitHits() {
        RATE_LIMIT_HITS.incrementAndGet();
    }
}
