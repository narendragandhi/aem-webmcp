package aemwebmcp.core.servlets;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Servlet for handling form submissions in the WebMCP context.
 */
@Component(service = { Servlet.class })
@SlingServletResourceTypes(
        resourceTypes = "aem-webmcp/components/form/container",
        methods = HttpConstants.METHOD_POST)
@ServiceDescription("AEM WebMCP Form Submission Servlet")
public class FormSubmissionServlet extends SlingAllMethodsServlet {

    private static final long serialVersionUID = 1L;

    private static final int MAX_FIELD_LENGTH = 5000;
    private static final int MAX_REQUEST_SIZE = 1024 * 1024;
    private static final int RATE_LIMIT_REQUESTS = 10;
    private static final int RATE_LIMIT_WINDOW_SECONDS = 3600;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern SAFE_INPUT_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s\\-\\.\\,\\!\\?\\'\\\"]*$");
    private static final Map<String, Long> RATE_LIMIT_MAP = new ConcurrentHashMap<>();

    @Override
    protected void doPost(final SlingHttpServletRequest req,
                           final SlingHttpServletResponse resp) throws ServletException, IOException {
        
        if (!validateRequest(req, resp)) {
            return;
        }

        Map<String, String> formData = extractFormData(req);
        Map<String, String> errors = validateFormData(formData);

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        ObjectMapper mapper = new ObjectMapper();

        if (!errors.isEmpty()) {
            resp.setStatus(SlingHttpServletResponse.SC_BAD_REQUEST);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("errors", errors);
            try {
                resp.getWriter().write(mapper.writeValueAsString(response));
            } catch (Exception e) {
                resp.getWriter().write("{\"success\":false}");
            }
        } else {
            try {
                String submissionId = UUID.randomUUID().toString();
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("submissionId", submissionId);
                response.put("message", "Form submitted successfully!");
                resp.getWriter().write(mapper.writeValueAsString(response));
            } catch (Exception e) {
                sendError(resp, SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to process submission");
            }
        }
    }

    private boolean validateRequest(SlingHttpServletRequest req, SlingHttpServletResponse resp) throws IOException {
        String clientIp = req.getRemoteAddr();
        if (clientIp == null) clientIp = "unknown";
        long count = RATE_LIMIT_MAP.getOrDefault(clientIp, 0L);
        if (count >= RATE_LIMIT_REQUESTS) {
            sendError(resp, 429, "Rate limit exceeded. Please try again later.");
            return false;
        }
        RATE_LIMIT_MAP.put(clientIp, count + 1);

        if (req.getContentLengthLong() > MAX_REQUEST_SIZE) {
            sendError(resp, 413, "Request too large");
            return false;
        }

        String csrfToken = req.getParameter("csrfToken");
        String sessionToken = (String) req.getSession().getAttribute("csrfToken");
        if (csrfToken == null || !csrfToken.equals(sessionToken)) {
            sendError(resp, 403, "Invalid request");
            return false;
        }

        return true;
    }

    private Map<String, String> extractFormData(SlingHttpServletRequest req) {
        Map<String, String> data = new HashMap<>();
        req.getParameterMap().forEach((k, v) -> {
            if (v != null && v.length > 0 && v[0].length() <= MAX_FIELD_LENGTH) {
                data.put(k, v[0]);
            }
        });
        return data;
    }

    private Map<String, String> validateFormData(Map<String, String> data) {
        Map<String, String> errors = new HashMap<>();
        
        String fullName = data.get("fullName");
        if (fullName == null || fullName.length() < 2) {
            errors.put("fullName", "Name is too short");
        } else if (!SAFE_INPUT_PATTERN.matcher(fullName).matches()) {
            errors.put("fullName", "Name contains invalid characters");
        }

        String email = data.get("email");
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            errors.put("email", "Invalid email address");
        }

        String message = data.get("message");
        if (message == null || message.length() < 10) {
            errors.put("message", "Message is too short");
        }

        String username = data.get("username");
        if (username != null && !SAFE_INPUT_PATTERN.matcher(username).matches()) {
            errors.put("username", "Username contains invalid characters");
        }

        return errors;
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
