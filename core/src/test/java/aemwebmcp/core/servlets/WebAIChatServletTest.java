package aemwebmcp.core.servlets;

import aemwebmcp.core.services.WebAIChatService;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.testing.mock.osgi.MockOsgi;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import javax.servlet.http.HttpSession;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WebAIChatServletTest {
    private final WebAIChatService service = mock(WebAIChatService.class);
    private final WebAIChatServlet servlet = new WebAIChatServlet();

    private SlingHttpServletRequest request(String cookieSession, String user) {
        SlingHttpServletRequest request = mock(SlingHttpServletRequest.class);
        HttpSession session = mock(HttpSession.class);
        ResourceResolver resolver = mock(ResourceResolver.class);
        when(request.getSession()).thenReturn(session);
        when(session.getId()).thenReturn(cookieSession);
        when(request.getResourceResolver()).thenReturn(resolver);
        when(resolver.getUserID()).thenReturn(user);
        when(request.getParameter("message")).thenReturn("A private message");
        // An attacker choosing another client's conversation ID must have no effect.
        when(request.getParameter("sessionId")).thenReturn("victim");
        return request;
    }

    private String call(SlingHttpServletRequest request) throws Exception {
        var context = MockOsgi.newBundleContext();
        context.registerService(WebAIChatService.class, service, null);
        MockOsgi.injectServices(servlet, context);
        when(service.chat(anyString(), anyString())).thenReturn("Simulated reply");
        SlingHttpServletResponse response = mock(SlingHttpServletResponse.class);
        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));
        servlet.doPost(request, response);
        verify(response).setHeader("Cache-Control", "no-store");
        return body.toString();
    }

    @Test
    void sessionsAndAuthenticatedUsersHaveSeparateHistories() throws Exception {
        assertTrue(call(request("session-a", "alice")).contains("\"demo\":true"));
        call(request("session-b", "alice"));
        call(request("session-a", "bob"));
        call(request("session-a", "alice"));
        ArgumentCaptor<String> keys = ArgumentCaptor.forClass(String.class);
        verify(service, times(4)).chat(keys.capture(), eq("A private message"));
        assertEquals(3, keys.getAllValues().stream().distinct().count());
        assertEquals(keys.getAllValues().get(0), keys.getAllValues().get(3));
    }

    @Test
    void invalidMessagesDoNotCreateHistoryOrSession() throws Exception {
        for (String message : new String[] { " ", "x".repeat(5001) }) {
            SlingHttpServletRequest request = request("session", "alice");
            when(request.getParameter("message")).thenReturn(message);
            assertTrue(call(request).contains("\"error\""));
            verify(request, never()).getSession();
        }
        verify(service, never()).chat(anyString(), anyString());
    }
}
