/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.services;

import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component(service = WebAIChatService.class)
public class WebAIChatService {

    private static final Logger LOG = LoggerFactory.getLogger(WebAIChatService.class);
    
    private static final int MAX_HISTORY = 20;
    private static final int MAX_SESSIONS = 100;
    
    private final Map<String, List<ChatMessage>> sessions = new ConcurrentHashMap<>();

    public static class ChatMessage {
        private final String role;
        private final String content;
        private final long timestamp;

        public ChatMessage(String role, String content) {
            this.role = role;
            this.content = content;
            this.timestamp = System.currentTimeMillis();
        }

        public String getRole() { return role; }
        public String getContent() { return content; }
        public long getTimestamp() { return timestamp; }
        
        public Map<String, Object> toMap() {
            return Map.of("role", role, "content", content);
        }
    }

    public List<ChatMessage> getHistory(String sessionId) {
        return sessions.getOrDefault(sessionId, new ArrayList<>());
    }

    public void addMessage(String sessionId, String role, String content) {
        sessions.computeIfAbsent(sessionId, k -> new ArrayList<>());
        List<ChatMessage> history = sessions.get(sessionId);
        
        history.add(new ChatMessage(role, content));
        
        if (history.size() > MAX_HISTORY) {
            history.remove(0);
        }
        
        if (sessions.size() > MAX_SESSIONS) {
            String oldestKey = sessions.keySet().iterator().next();
            sessions.remove(oldestKey);
        }
        
        LOG.debug("Added message to session {}: {} - {}", sessionId, role, content.substring(0, Math.min(50, content.length())));
    }

    public void clearHistory(String sessionId) {
        sessions.remove(sessionId);
        LOG.info("Cleared chat history for session: {}", sessionId);
    }

    public String buildContext(String sessionId) {
        List<ChatMessage> history = getHistory(sessionId);
        if (history.isEmpty()) {
            return "";
        }
        
        StringBuilder context = new StringBuilder();
        context.append("You are a helpful AI assistant for this website. ");
        context.append("You can help users navigate, search, fill forms, and more. ");
        context.append("You have access to WebMCP functions to interact with the page. ");
        context.append("Recent conversation:\n");
        
        for (ChatMessage msg : history) {
            context.append(msg.getRole()).append(": ").append(msg.getContent()).append("\n");
        }
        
        return context.toString();
    }

    public int getSessionCount() {
        return sessions.size();
    }
}
