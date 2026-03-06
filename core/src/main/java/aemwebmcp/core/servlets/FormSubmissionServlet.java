package aemwebmcp.core.servlets;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.propertytypes.ServiceDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Component(service = { Servlet.class })
@SlingServletResourceTypes(
        resourceTypes = "aem-webmcp/components/form/container",
        methods = HttpConstants.METHOD_POST)
@ServiceDescription("AEM WebMCP Form Submission Servlet")
public class FormSubmissionServlet extends SlingAllMethodsServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOG = LoggerFactory.getLogger(FormSubmissionServlet.class);
    private static final Gson GSON = new GsonBuilder().create();

    private static final int MAX_FIELD_LENGTH = 5000;
    private static final int MAX_REQUEST_SIZE = 1024 * 1024;
    private static final int RATE_LIMIT_REQUESTS = 10;
    private static final int RATE_LIMIT_WINDOW_SECONDS = 60;

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );
    private static final Pattern SAFE_NAME_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s\\-\\.\']{1,100}$");
    private static final Pattern SAFE_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{1,50}$");

    private static final Map<String, List<Long>> REQUEST_TIMES = new ConcurrentHashMap<>();
    private static final Map<String, Integer> SUBMISSION_COUNTS = new ConcurrentHashMap<>();

    @Override
    protected void doPost(final SlingHttpServletRequest req,
                          final SlingHttpServletResponse resp) throws ServletException, IOException {
        
        if (!checkRequestSize(req, resp)) {
            return;
        }
        
        if (!checkRateLimit(req, resp)) {
            return;
        }
        
        if (!validateCSRF(req, resp)) {
            return;
        }
        
        LOG.debug("Processing WebMCP form submission");
        
        Map<String, String> formData = new HashMap<>();
        List<String> validationErrors = new ArrayList<>();
        
        req.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                String value = values[0];
                if (value != null && value.length() > MAX_FIELD_LENGTH) {
                    value = value.substring(0, MAX_FIELD_LENGTH);
                }
                formData.put(sanitizeKey(key), value);
            }
        });

        Map<String, String> errors = validateFormData(formData);

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        if (!errors.isEmpty()) {
            resp.setStatus(SlingHttpServletResponse.SC_BAD_REQUEST);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("errors", errors);
            resp.getWriter().write(GSON.toJson(response));
            LOG.info("Form validation failed - {} error(s)", errors.size());
        } else {
            try {
                String submissionId = saveFormSubmission(req, formData);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("submissionId", submissionId);
                response.put("message", "Form submitted successfully!");
                resp.getWriter().write(GSON.toJson(response));
                LOG.info("Form submitted successfully with ID: {}", maskId(submissionId));
            } catch (Exception e) {
                LOG.error("Error saving form submission: {}", e.getMessage(), e);
                sendError(resp, SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to process submission");
            }
        }
    }

    private boolean checkRequestSize(SlingHttpServletRequest req, SlingHttpServletResponse resp) throws IOException {
        long contentLength = req.getContentLength();
        if (contentLength > MAX_REQUEST_SIZE) {
            LOG.warn("Request too large: {} bytes", contentLength);
            sendError(resp, SlingHttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE, "Request too large");
            return false;
        }
        return true;
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
            LOG.warn("CSRF validation failed");
            sendError(resp, SlingHttpServletResponse.SC_FORBIDDEN, "Invalid request");
            return false;
        }
        
        return true;
    }

    private String getClientIdentifier(SlingHttpServletRequest req) {
        String remoteAddr = req.getRemoteAddr();
        String forwarded = req.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded : remoteAddr;
    }

    private String sanitizeKey(String key) {
        if (key == null) {
            return "unknown";
        }
        return key.replaceAll("[^a-zA-Z0-9_]", "_");
    }

    private Map<String, String> validateFormData(Map<String, String> formData) {
        Map<String, String> errors = new HashMap<>();

        if (formData.containsKey("fullName")) {
            String name = formData.get("fullName");
            if (name == null || name.trim().isEmpty()) {
                errors.put("fullName", "Name is required");
            } else if (name.length() < 2) {
                errors.put("fullName", "Name must be at least 2 characters");
            } else if (!SAFE_NAME_PATTERN.matcher(name).matches()) {
                errors.put("fullName", "Name contains invalid characters");
            }
        }

        if (formData.containsKey("email")) {
            String email = formData.get("email");
            if (email == null || email.trim().isEmpty()) {
                errors.put("email", "Email is required");
            } else if (!EMAIL_PATTERN.matcher(email).matches()) {
                errors.put("email", "Invalid email format");
            }
        }

        if (formData.containsKey("message")) {
            String message = formData.get("message");
            if (message == null || message.trim().isEmpty()) {
                errors.put("message", "Message is required");
            } else if (message.length() < 10) {
                errors.put("message", "Message must be at least 10 characters");
            }
        }

        if (formData.containsKey("username")) {
            String username = formData.get("username");
            if (username == null || username.trim().isEmpty()) {
                errors.put("username", "Username is required");
            } else if (!SAFE_ID_PATTERN.matcher(username).matches()) {
                errors.put("username", "Username contains invalid characters");
            }
        }

        if (formData.containsKey("password")) {
            String password = formData.get("password");
            if (password == null || password.isEmpty()) {
                errors.put("password", "Password is required");
            } else if (password.length() < 6) {
                errors.put("password", "Password must be at least 6 characters");
            }
        }

        return errors;
    }

    private String saveFormSubmission(SlingHttpServletRequest req, Map<String, String> formData) {
        String submissionId = generateSecureId();
        
        try {
            String formType = formData.getOrDefault("formSource", "unknown");
            LOG.info("Processing {} form submission: {}", formType, maskId(submissionId));
            
            int count = SUBMISSION_COUNTS.merge(formType, 1, Integer::sum);
            LOG.debug("Total submissions for {}: {}", formType, count);
            
        } catch (Exception e) {
            LOG.error("Error saving form submission: {}", e.getMessage(), e);
        }
        
        return submissionId;
    }

    private String generateSecureId() {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest((System.nanoTime() + "").getBytes());
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash).substring(0, 16);
        } catch (Exception e) {
            return "fallback-" + System.nanoTime();
        }
    }

    private String maskId(String id) {
        if (id == null || id.length() < 8) {
            return "****";
        }
        return id.substring(0, 4) + "****" + id.substring(id.length() - 4);
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
