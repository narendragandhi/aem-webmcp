package aemwebmcp.core.services;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class WebAIChatServiceTest {

    @Test
    void testAddMessage() {
        WebAIChatService service = new WebAIChatService();
        String sessionId = "test-session-1";
        
        service.addMessage(sessionId, "user", "Hello AI");
        
        assertEquals(1, service.getHistory(sessionId).size());
    }

    @Test
    void testMultipleMessages() {
        WebAIChatService service = new WebAIChatService();
        String sessionId = "test-session-2";
        
        service.addMessage(sessionId, "user", "Hello");
        service.addMessage(sessionId, "assistant", "Hi there!");
        service.addMessage(sessionId, "user", "How are you?");
        
        assertEquals(3, service.getHistory(sessionId).size());
    }

    @Test
    void testHistoryLimit() {
        WebAIChatService service = new WebAIChatService();
        String sessionId = "test-session-limit";
        
        for (int i = 0; i < 25; i++) {
            service.addMessage(sessionId, "user", "Message " + i);
        }
        
        assertEquals(20, service.getHistory(sessionId).size());
    }

    @Test
    void testClearHistory() {
        WebAIChatService service = new WebAIChatService();
        String sessionId = "test-session-clear";
        
        service.addMessage(sessionId, "user", "Hello");
        assertEquals(1, service.getHistory(sessionId).size());
        
        service.clearHistory(sessionId);
        assertEquals(0, service.getHistory(sessionId).size());
    }

    @Test
    void testBuildContext() {
        WebAIChatService service = new WebAIChatService();
        String sessionId = "test-session-context";
        
        service.addMessage(sessionId, "user", "Hello");
        service.addMessage(sessionId, "assistant", "Hi there!");
        
        String context = service.buildContext(sessionId);
        assertNotNull(context);
        assertFalse(context.isEmpty());
    }

    @Test
    void testBuildContextEmpty() {
        WebAIChatService service = new WebAIChatService();
        
        String context = service.buildContext("non-existent-session");
        assertEquals("", context);
    }

    @Test
    void testChatMessageToMap() {
        WebAIChatService.ChatMessage msg = new WebAIChatService.ChatMessage("user", "Test message");
        
        assertEquals("user", msg.getRole());
        assertEquals("Test message", msg.getContent());
        assertTrue(msg.getTimestamp() > 0);
        
        Map<String, Object> map = msg.toMap();
        assertEquals("user", map.get("role"));
        assertEquals("Test message", map.get("content"));
    }

    @Test
    void testGetActiveSessions() {
        WebAIChatService service = new WebAIChatService();
        
        service.addMessage("session-1", "user", "Hello");
        service.addMessage("session-2", "user", "World");
        
        assertEquals(2, service.getActiveSessionCount());
    }

    @Test
    void testGetLastMessage() {
        WebAIChatService service = new WebAIChatService();
        String sessionId = "test-session-last";
        
        service.addMessage(sessionId, "user", "First");
        service.addMessage(sessionId, "user", "Last message");
        
        WebAIChatService.ChatMessage last = service.getLastMessage(sessionId);
        assertEquals("Last message", last.getContent());
    }
}
