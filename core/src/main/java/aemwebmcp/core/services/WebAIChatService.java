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

/**
 * Service for managing AI chat sessions and message history.
 * It provides methods to add, retrieve, and clear chat messages for different sessions.
 * 
 * @since 1.0.0
 * @author AEM WebMCP Team
 */
@Component(service = WebAIChatService.class)
public class WebAIChatService {

    private static final Logger LOG = LoggerFactory.getLogger(WebAIChatService.class);
    
    /**
     * Maximum number of messages to keep in history per session.
     */
    private static final int MAX_HISTORY = 20;

    /**
     * Maximum number of concurrent sessions to keep in memory.
     */
    private static final int MAX_SESSIONS = 100;
    
    /**
     * Map of chat history keyed by session ID.
     */
    private final Map<String, List<ChatMessage>> sessions = new ConcurrentHashMap<>();

    /**
     * Represents a single message in a chat conversation.
     */
    public static class ChatMessage {
        private final String role;
        private final String content;
        private final long timestamp;

        /**
         * Creates a new chat message.
         * 
         * @param role The role of the sender (e.g., "user", "assistant", "system").
         * @param content The message content.
         */
        public ChatMessage(String role, String content) {
            this.role = role;
            this.content = content;
            this.timestamp = System.currentTimeMillis();
        }

        /**
         * Gets the sender role.
         * @return The role name.
         */
        public String getRole() { return role; }

        /**
         * Gets the message content.
         * @return The message text.
         */
        public String getContent() { return content; }

        /**
         * Gets the message timestamp.
         * @return Milliseconds since epoch.
         */
        public long getTimestamp() { return timestamp; }
        
        /**
         * Converts the message to a map representation.
         * @return Map with "role" and "content" keys.
         */
        public Map<String, Object> toMap() {
            return Map.of("role", role, "content", content);
        }
    }

    /**
     * Processes a chat message by storing it in history and generating a response.
     * 
     * @param sessionId The session identifier.
     * @param message The user's message.
     * @return The AI's response.
     */
    public String chat(String sessionId, String message) {
        // 1. Record user message
        addMessage(sessionId, "user", message);

        // 2. Build context for the LLM
        String context = buildContext(sessionId);

        // 3. Call LLM (In a real production environment, this would call Vertex AI or Gemini API)
        // For this reference implementation, we return a smart stub that simulates an agent response
        String response = simulateAIResponse(message);

        // 4. Record assistant response
        addMessage(sessionId, "assistant", response);

        return response;
    }

    private String simulateAIResponse(String message) {
        String msg = message.toLowerCase();
        if (msg.contains("search")) return "I can help you search the site. What are you looking for?";
        if (msg.contains("cart") || msg.contains("buy")) return "I see you're interested in our products. I can manage your cart for you.";
        if (msg.contains("form") || msg.contains("contact")) return "I can help you fill out the contact form. Please provide your name and email.";
        return "I'm your AEM WebMCP assistant. I can help you interact with this page using AI.";
    }

    /**
     * Retrieves the chat history for a given session.
     * 
     * @param sessionId Unique identifier for the chat session.
     * @return List of ChatMessages for this session. Returns empty list if no history exists.
     */
    public List<ChatMessage> getHistory(String sessionId) {
        return sessions.getOrDefault(sessionId, new ArrayList<>());
    }

    /**
     * Adds a new message to a session's history.
     * Automatically prunes history if MAX_HISTORY is exceeded.
     * 
     * @param sessionId Unique identifier for the session.
     * @param role The role of the message sender.
     * @param content The message text.
     */
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

    /**
     * Clears all message history for a given session.
     * @param sessionId The session to clear.
     */
    public void clearHistory(String sessionId) {
        sessions.remove(sessionId);
        LOG.info("Cleared chat history for session: {}", sessionId);
    }

    /**
     * Builds a concatenated context string from the session's chat history.
     * Includes system instructions and recent conversation.
     * 
     * @param sessionId The session ID to build context for.
     * @return A formatted string of the conversation history.
     */
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

    /**
     * Gets total count of active sessions.
     * @return Number of sessions in memory.
     */
    public int getSessionCount() {
        return sessions.size();
    }

    /**
     * Gets total count of active sessions.
     * @return Number of sessions in memory.
     */
    public int getActiveSessionCount() {
        return sessions.size();
    }

    /**
     * Retrieves the most recent message for a session.
     * 
     * @param sessionId The session ID.
     * @return The last ChatMessage, or null if no history exists.
     */
    public ChatMessage getLastMessage(String sessionId) {
        List<ChatMessage> history = sessions.get(sessionId);
        if (history == null || history.isEmpty()) {
            return null;
        }
        return history.get(history.size() - 1);
    }
}
