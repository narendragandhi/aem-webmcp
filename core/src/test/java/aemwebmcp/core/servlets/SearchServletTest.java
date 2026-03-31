package aemwebmcp.core.servlets;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@MockitoSettings(strictness = Strictness.LENIENT)
class SearchServletTest {

    private SearchServlet fixture;

    @Mock
    private SlingHttpServletRequest request;

    @Mock
    private SlingHttpServletResponse response;

    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        fixture = new SearchServlet();
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
    }

    @Test
    void testDoGetWithQuery() throws Exception {
        when(request.getParameter("query")).thenReturn("AEM");

        fixture.doGet(request, response);

        verify(response).setContentType("application/json");
        String output = responseWriter.toString();
        assertTrue(output.contains("\"success\":true"));
        assertTrue(output.contains("\"query\":\"AEM\""));
    }

    @Test
    void testDoGetEmptyQuery() throws Exception {
        fixture.doGet(request, response);

        String output = responseWriter.toString();
        assertTrue(output.contains("\"success\":true"));
        assertTrue(output.contains("\"total\":0"));
    }

    @Test
    void testQueryTooLong() throws Exception {
        StringBuilder longQuery = new StringBuilder();
        for (int i = 0; i < 101; i++) {
            longQuery.append("a");
        }
        when(request.getParameter("query")).thenReturn(longQuery.toString());

        fixture.doGet(request, response);

        verify(response).setStatus(400);
        assertTrue(responseWriter.toString().contains("Query too long"));
    }

    @Test
    void testInvalidCharacters() throws Exception {
        when(request.getParameter("query")).thenReturn("select * from nodes");

        fixture.doGet(request, response);

        verify(response).setStatus(400);
        assertTrue(responseWriter.toString().contains("Invalid query characters"));
    }

    @Test
    void testRateLimiting() throws Exception {
        String testIp = "127.0.0.2";
        when(request.getRemoteAddr()).thenReturn(testIp);
        when(request.getParameter("query")).thenReturn("test");

        // RATE_LIMIT_REQUESTS = 30
        for (int i = 0; i < 30; i++) {
            responseWriter = new StringWriter();
            when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
            fixture.doGet(request, response);
            assertFalse(responseWriter.toString().contains("Rate limit exceeded"), "Request " + i + " failed");
        }

        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
        fixture.doGet(request, response);
        
        verify(response).setStatus(429);
        assertTrue(responseWriter.toString().contains("Rate limit exceeded"));
    }
}
