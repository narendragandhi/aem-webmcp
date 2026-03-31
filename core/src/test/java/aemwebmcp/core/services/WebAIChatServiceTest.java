package aemwebmcp.core.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class WebAIChatServiceTest {

    private WebAIChatService service;

    @BeforeEach
    void setUp() {
        service = new WebAIChatService();
    }

    @Test
    void testAddAndGetMessage() {
        service.addMessage("session1", "user", "hello");
        List<WebAIChatService.ChatMessage> history = service.getHistory("session1");
        
        assertEquals(1, history.size());
        assertEquals("user", history.get(0).getRole());
        assertEquals("hello", history.get(0).getContent());
    }

    @Test
    void testClearHistory() {
        service.addMessage("session1", "user", "hello");
        service.clearHistory("session1");
        assertTrue(service.getHistory("session1").isEmpty());
    }

    @Test
    void testHistoryPruning() {
        // MAX_HISTORY = 20
        for (int i = 0; i < 25; i++) {
            service.addMessage("session1", "user", "msg " + i);
        }
        
        List<WebAIChatService.ChatMessage> history = service.getHistory("session1");
        assertEquals(20, history.size());
        assertEquals("msg 5", history.get(0).getContent());
        assertEquals("msg 24", history.get(19).getContent());
    }

    @Test
    void testSessionPruning() {
        // MAX_SESSIONS = 100
        for (int i = 0; i < 110; i++) {
            service.addMessage("session" + i, "user", "hello");
        }
        
        assertTrue(service.getSessionCount() <= 100);
    }

    @Test
    void testBuildContext() {
        service.addMessage("session1", "user", "hello");
        service.addMessage("session1", "assistant", "hi there");
        
        String context = service.buildContext("session1");
        assertTrue(context.contains("user: hello"));
        assertTrue(context.contains("assistant: hi there"));
    }

    @Test
    void testGetLastMessage() {
        service.addMessage("session1", "user", "first");
        service.addMessage("session1", "user", "last");
        
        assertEquals("last", service.getLastMessage("session1").getContent());
        assertNull(service.getLastMessage("unknown"));
    }

    @Test
    void testGetSessionCount() {
        service.addMessage("s1", "u", "m");
        service.addMessage("s2", "u", "m");
        assertEquals(2, service.getSessionCount());
        assertEquals(2, service.getActiveSessionCount());
    }
}
