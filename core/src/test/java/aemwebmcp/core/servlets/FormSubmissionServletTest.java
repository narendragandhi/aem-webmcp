package aemwebmcp.core.servlets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import javax.servlet.http.HttpSession;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@MockitoSettings(strictness = Strictness.LENIENT)
class FormSubmissionServletTest {

    private FormSubmissionServlet fixture;
    private static final String CSRF_TOKEN = "valid-token";

    @Mock
    private SlingHttpServletRequest request;

    @Mock
    private SlingHttpServletResponse response;

    @Mock
    private HttpSession session;

    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        fixture = new FormSubmissionServlet();
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
        when(request.getSession(anyBoolean())).thenReturn(session);
        when(request.getSession()).thenReturn(session);
        when(session.getAttribute("csrfToken")).thenReturn(CSRF_TOKEN);
    }

    @Test
    void testSuccessfulSubmission() throws Exception {
        Map<String, String[]> params = new HashMap<>();
        params.put("csrfToken", new String[]{CSRF_TOKEN});
        params.put("fullName", new String[]{"John Doe"});
        params.put("email", new String[]{"john@example.com"});
        params.put("message", new String[]{"This is a valid message with enough characters"});
        
        when(request.getParameterMap()).thenReturn(params);
        when(request.getParameter("csrfToken")).thenReturn(CSRF_TOKEN);
        when(request.getContentLengthLong()).thenReturn(100L);

        fixture.doPost(request, response);

        String output = responseWriter.toString();
        assertTrue(output.contains("\"success\":true"), "Output was: " + output);
        assertTrue(output.contains("submissionId"));
    }

    @Test
    void testValidationFailure() throws Exception {
        Map<String, String[]> params = new HashMap<>();
        params.put("csrfToken", new String[]{CSRF_TOKEN});
        params.put("fullName", new String[]{"J"}); // Too short
        params.put("email", new String[]{"invalid-email"});
        params.put("message", new String[]{"Short"}); // Too short
        
        when(request.getParameterMap()).thenReturn(params);
        when(request.getParameter("csrfToken")).thenReturn(CSRF_TOKEN);
        when(request.getContentLengthLong()).thenReturn(100L);

        fixture.doPost(request, response);

        verify(response).setStatus(400);
        String output = responseWriter.toString();
        assertTrue(output.contains("\"success\":false"));
        assertTrue(output.contains("fullName"));
    }

    @Test
    void testCsrfFailure() throws Exception {
        when(request.getParameter("csrfToken")).thenReturn("wrong-token");
        when(request.getContentLengthLong()).thenReturn(100L);

        fixture.doPost(request, response);

        verify(response).setStatus(403);
        assertTrue(responseWriter.toString().contains("Invalid request"));
    }

    @Test
    void testRequestTooLarge() throws Exception {
        when(request.getContentLengthLong()).thenReturn(2000000L); // > 1MB

        fixture.doPost(request, response);

        verify(response).setStatus(413);
        assertTrue(responseWriter.toString().contains("Request too large"));
    }

    @Test
    void testRateLimiting() throws Exception {
        String testIp = "127.0.0.1";
        when(request.getRemoteAddr()).thenReturn(testIp);
        when(request.getParameter("csrfToken")).thenReturn(CSRF_TOKEN);
        when(request.getContentLengthLong()).thenReturn(100L);
        
        Map<String, String[]> params = new HashMap<>();
        params.put("csrfToken", new String[]{CSRF_TOKEN});
        params.put("fullName", new String[]{"John Doe"});
        when(request.getParameterMap()).thenReturn(params);

        // RATE_LIMIT_REQUESTS = 10
        for (int i = 0; i < 10; i++) {
            responseWriter = new StringWriter();
            when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
            fixture.doPost(request, response);
            // Since status might not be set for success (defaults to 200), we check output
            assertFalse(responseWriter.toString().contains("Rate limit exceeded"), "Request " + i + " failed");
        }

        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
        fixture.doPost(request, response);
        
        verify(response).setStatus(429);
        assertTrue(responseWriter.toString().contains("Rate limit exceeded"));
    }
}
