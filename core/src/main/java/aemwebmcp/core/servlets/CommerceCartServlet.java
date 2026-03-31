package aemwebmcp.core.servlets;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.jcr.resource.api.JcrResourceConstants;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.propertytypes.ServiceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Component(service = { Servlet.class })
@SlingServletResourceTypes(
        resourceTypes = "aem-webmcp/components/cart",
        methods = {HttpConstants.METHOD_GET, HttpConstants.METHOD_POST})
@ServiceDescription("AEM WebMCP Commerce Cart Servlet")
public class CommerceCartServlet extends SlingAllMethodsServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOG = LoggerFactory.getLogger(CommerceCartServlet.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    
    private static final int MAX_CART_AGE_MINUTES = 30;
    private static final int MAX_CARTS = 1000;
    private static final int MAX_ITEMS_PER_CART = 50;
    private static final int MAX_QUANTITY = 99;
    private static final int RATE_LIMIT_REQUESTS = 20;
    private static final int RATE_LIMIT_WINDOW_SECONDS = 60;
    
    private static final Pattern SAFE_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{1,50}$");
    private static final Pattern SAFE_NAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\s\\-\\.]{1,100}$");

    private static final Map<String, Cart> SESSION_CARTS = new ConcurrentHashMap<>();
    private static final Map<String, List<Long>> REQUEST_TIMES = new ConcurrentHashMap<>();
    
    private static final ScheduledExecutorService cleanupScheduler;
    
    static {
        cleanupScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "cart-cleanup");
            t.setDaemon(true);
            return t;
        });
        cleanupScheduler.scheduleAtFixedRate(new CartCleanupTask(), 5, 5, TimeUnit.MINUTES);
    }

    @Override
    protected void doPost(final SlingHttpServletRequest req,
                          final SlingHttpServletResponse resp) throws ServletException, IOException {
        
        if (!checkRateLimit(req, resp)) {
            return;
        }
        
        if (!validateCSRF(req, resp)) {
            return;
        }
        
        String action = req.getParameter("action");
        String sessionId = getSecureSessionId(req);
        
        if (sessionId == null) {
            sendError(resp, SlingHttpServletResponse.SC_BAD_REQUEST, "Invalid session");
            return;
        }
        
        LOG.debug("Processing commerce action: {} for session: {}", action, sessionId);
        
        Cart cart = SESSION_CARTS.computeIfAbsent(sessionId, k -> new Cart());
        cart.setLastAccessTime(Instant.now());
        
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        try {
            switch (action != null ? action : "view") {
                case "add":
                    handleAddToCart(req, cart);
                    break;
                case "remove":
                    handleRemoveFromCart(req, cart);
                    break;
                case "update":
                    handleUpdateQuantity(req, cart);
                    break;
                case "clear":
                    cart.clear();
                    break;
                default:
                    LOG.warn("Unknown cart action: {}", action);
            }
            
            resp.getWriter().write(cartToJson(cart, true));
            
        } catch (IllegalArgumentException e) {
            LOG.warn("Validation error in cart action: {}", e.getMessage());
            sendError(resp, SlingHttpServletResponse.SC_BAD_REQUEST, sanitizeErrorMessage(e.getMessage()));
        } catch (Exception e) {
            LOG.error("Error processing cart action for session {}: {}", sessionId, e.getMessage(), e);
            sendError(resp, SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

    @Override
    protected void doGet(final SlingHttpServletRequest req,
                         final SlingHttpServletResponse resp) throws ServletException, IOException {
        
        if (!checkRateLimit(req, resp)) {
            return;
        }
        
        String sessionId = getSecureSessionId(req);
        
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        if (sessionId == null) {
            resp.getWriter().write(cartToJson(new Cart(), false));
            return;
        }
        
        Cart cart = SESSION_CARTS.get(sessionId);
        if (cart != null) {
            cart.setLastAccessTime(Instant.now());
            resp.getWriter().write(cartToJson(cart, false));
        } else {
            resp.getWriter().write(cartToJson(new Cart(), false));
        }
    }

    @Override
    public void destroy() {
        cleanupScheduler.shutdown();
        try {
            if (!cleanupScheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                cleanupScheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            cleanupScheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        super.destroy();
    }

    private boolean checkRateLimit(SlingHttpServletRequest req, SlingHttpServletResponse resp) throws IOException {
        String clientId = getClientIdentifier(req);
        List<Long> times = REQUEST_TIMES.computeIfAbsent(clientId, k -> new ArrayList<>());
        
        long now = System.currentTimeMillis();
        long windowStart = now - (RATE_LIMIT_WINDOW_SECONDS * 1000);
        
        synchronized (times) {
            times.removeIf(t -> t < windowStart);
            
            if (times.size() >= RATE_LIMIT_REQUESTS) {
                LOG.warn("Rate limit exceeded for client: {}", clientId);
                sendError(resp, 429, "Rate limit exceeded");
                return false;
            }
            
            times.add(now);
        }
        
        return true;
    }

    private boolean validateCSRF(SlingHttpServletRequest req, SlingHttpServletResponse resp) throws IOException {
        String csrfToken = req.getParameter("csrfToken");
        javax.servlet.http.HttpSession session = req.getSession(false);
        String sessionToken = session != null ? (String) session.getAttribute("csrfToken") : null;
        
        if (sessionToken != null && !sessionToken.equals(csrfToken)) {
            LOG.warn("CSRF validation failed for request");
            sendError(resp, SlingHttpServletResponse.SC_FORBIDDEN, "Invalid CSRF token");
            return false;
        }
        
        return true;
    }

    private String getSecureSessionId(SlingHttpServletRequest req) {
        try {
            return req.getSession(true).getId();
        } catch (Exception e) {
            LOG.warn("Could not get session ID: {}", e.getMessage());
            return null;
        }
    }

    private String getClientIdentifier(SlingHttpServletRequest req) {
        String remoteAddr = req.getRemoteAddr();
        String forwarded = req.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded : remoteAddr;
    }

    private void handleAddToCart(SlingHttpServletRequest req, Cart cart) {
        if (cart.getItems().size() >= MAX_ITEMS_PER_CART) {
            throw new IllegalArgumentException("Cart is full");
        }
        
        String productId = sanitizeInput(req.getParameter("productId"), SAFE_ID_PATTERN);
        if (productId == null) {
            throw new IllegalArgumentException("Invalid product ID");
        }
        
        String productName = sanitizeInput(req.getParameter("productName"), SAFE_NAME_PATTERN);
        double price = parsePrice(req.getParameter("price"));
        int quantity = parseQuantity(req.getParameter("quantity"));
        
        CartItem item = new CartItem(productId, productName, price, quantity);
        cart.addItem(item);
        
        LOG.info("Added to cart: {} x{} - {}", productName, quantity, productId);
    }

    private void handleRemoveFromCart(SlingHttpServletRequest req, Cart cart) {
        String productId = sanitizeInput(req.getParameter("productId"), SAFE_ID_PATTERN);
        
        if (productId != null) {
            cart.removeItem(productId);
            LOG.debug("Removed from cart: {}", productId);
        }
    }

    private void handleUpdateQuantity(SlingHttpServletRequest req, Cart cart) {
        String productId = sanitizeInput(req.getParameter("productId"), SAFE_ID_PATTERN);
        String quantityStr = req.getParameter("quantity");
        
        if (productId != null && quantityStr != null) {
            int quantity = parseQuantity(quantityStr);
            cart.updateQuantity(productId, quantity);
            LOG.debug("Updated quantity for {}: {}", productId, quantity);
        }
    }

    private String sanitizeInput(String input, Pattern pattern) {
        if (input == null || input.isEmpty()) {
            return null;
        }
        if (!pattern.matcher(input).matches()) {
            return null;
        }
        return input;
    }

    private double parsePrice(String priceStr) {
        if (priceStr == null || priceStr.isEmpty()) {
            return 0.0;
        }
        try {
            double price = Double.parseDouble(priceStr);
            if (price < 0 || price > 999999.99) {
                return 0.0;
            }
            return Math.round(price * 100.0) / 100.0;
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private int parseQuantity(String quantityStr) {
        if (quantityStr == null || quantityStr.isEmpty()) {
            return 1;
        }
        try {
            int quantity = Integer.parseInt(quantityStr);
            return Math.max(1, Math.min(quantity, MAX_QUANTITY));
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    private String cartToJson(Cart cart, boolean includeDetails) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("itemCount", cart.getItemCount());
        response.put("subtotal", cart.getSubtotal());
        
        if (includeDetails) {
            response.put("items", cart.getItems());
        } else {
            response.put("items", new ArrayList<>());
        }
        
        try {
            return MAPPER.writeValueAsString(response);
        } catch (Exception e) {
            LOG.error("Error serializing cart to JSON", e);
            return "{\"success\":false,\"error\":\"Serialization error\"}";
        }
    }

    private void sendError(SlingHttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        try {
            resp.getWriter().write(MAPPER.writeValueAsString(error));
        } catch (Exception e) {
            resp.getWriter().write("{\"success\":false}");
        }
    }

    private String sanitizeErrorMessage(String message) {
        if (message == null) {
            return "Unknown error";
        }
        return message.replaceAll("[^a-zA-Z0-9\\s\\-\\.]", "");
    }

    static class CartCleanupTask implements Runnable {
        @Override
        public void run() {
            try {
                Instant cutoff = Instant.now().minus(MAX_CART_AGE_MINUTES, ChronoUnit.MINUTES);
                int removed = 0;
                
                for (Map.Entry<String, Cart> entry : SESSION_CARTS.entrySet()) {
                    if (entry.getValue().getLastAccessTime().isBefore(cutoff)) {
                        if (SESSION_CARTS.remove(entry.getKey()) != null) {
                            removed++;
                        }
                    }
                }
                
                if (removed > 0) {
                    LOG.info("Cleaned up {} expired carts", removed);
                }
                
                while (SESSION_CARTS.size() > MAX_CARTS) {
                    String oldestKey = SESSION_CARTS.entrySet().stream()
                        .min(Comparator.comparing(e -> e.getValue().getLastAccessTime()))
                        .map(e -> e.getKey())
                        .orElse(null);
                    
                    if (oldestKey != null) {
                        SESSION_CARTS.remove(oldestKey);
                    } else {
                        break;
                    }
                }
                
            } catch (Exception e) {
                LOG.error("Error during cart cleanup: {}", e.getMessage());
            }
        }
    }

    public static class Cart {
        private final List<CartItem> items = new ArrayList<>();
        private Instant lastAccessTime = Instant.now();

        public synchronized void addItem(CartItem item) {
            for (CartItem existing : items) {
                if (existing.productId.equals(item.productId)) {
                    existing.quantity = Math.min(existing.quantity + item.quantity, MAX_QUANTITY);
                    return;
                }
            }
            items.add(item);
        }

        public synchronized void removeItem(String productId) {
            items.removeIf(item -> item.productId.equals(productId));
        }

        public synchronized void updateQuantity(String productId, int quantity) {
            for (CartItem item : items) {
                if (item.productId.equals(productId)) {
                    item.quantity = Math.max(1, Math.min(quantity, MAX_QUANTITY));
                    return;
                }
            }
        }

        public synchronized void clear() {
            items.clear();
        }

        public synchronized int getItemCount() {
            return items.stream().mapToInt(i -> i.quantity).sum();
        }

        public synchronized double getSubtotal() {
            return items.stream().mapToDouble(i -> i.price * i.quantity).sum();
        }

        public synchronized List<CartItem> getItems() {
            return new ArrayList<>(items);
        }

        public Instant getLastAccessTime() {
            return lastAccessTime;
        }

        public void setLastAccessTime(Instant lastAccessTime) {
            this.lastAccessTime = lastAccessTime;
        }
    }

    public static class CartItem {
        private String productId;
        private String productName;
        private double price;
        private int quantity;

        CartItem(String productId, String productName, double price, int quantity) {
            this.productId = productId;
            this.productName = productName;
            this.price = price;
            this.quantity = Math.max(1, Math.min(quantity, MAX_QUANTITY));
        }

        public String getProductId() { return productId; }
        public String getProductName() { return productName; }
        public double getPrice() { return price; }
        public int getQuantity() { return quantity; }
    }
}
