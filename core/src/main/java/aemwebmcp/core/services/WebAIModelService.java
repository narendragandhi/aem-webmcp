/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.services;

import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * Service for managing AI model configurations and resource access.
 * This service provides settings for the LLM used in the WebMCP agent,
 * such as model ID, max tokens, and temperature.
 * 
 * @since 1.0.0
 * @author AEM WebMCP Team
 */
@Component(service = WebAIModelService.class)
public class WebAIModelService {

    private static final Logger LOG = LoggerFactory.getLogger(WebAIModelService.class);

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    /** The identifier of the AI model (e.g., from HuggingFace). */
    private String modelId = "gemini-nano";
    
    /** The type of model (e.g., "llm", "embedding"). */
    private String modelType = "llm";
    
    /** Maximum number of tokens for generated responses. */
    private int maxTokens = 512;
    
    /** Sampling temperature for response generation. */
    private float temperature = 0.7f;
    
    /** Whether to attempt GPU acceleration if available. */
    private boolean enableGpu = true;
    
    /** Whether to automatically load the model on startup. */
    private boolean autoLoad = true;

    /** Whether to prefer window.ai if available. */
    private boolean preferWindowAI = true;

    /**
     * Gets the current model ID.
     * @return The model identifier.
     */
    public String getModelId() {
        return modelId;
    }

    /**
     * Gets the model type.
     * @return The model type (e.g., "llm").
     */
    public String getModelType() {
        return modelType;
    }

    /**
     * Gets the maximum tokens for generation.
     * @return The max tokens count.
     */
    public int getMaxTokens() {
        return maxTokens;
    }

    /**
     * Gets the sampling temperature.
     * @return The temperature value.
     */
    public float getTemperature() {
        return temperature;
    }

    /**
     * Checks if GPU acceleration is enabled.
     * @return true if GPU is enabled, false otherwise.
     */
    public boolean isGpuEnabled() {
        return enableGpu;
    }

    /**
     * Checks if auto-loading is enabled.
     * @return true if auto-load is enabled, false otherwise.
     */
    public boolean isAutoLoadEnabled() {
        return autoLoad;
    }

    /**
     * Gets a map representation of the model configuration.
     * @return Map containing all model settings.
     */
    public Map<String, Object> getConfig() {
        return Map.of(
            "modelId", modelId,
            "modelType", modelType,
            "maxTokens", maxTokens,
            "temperature", temperature,
            "enableGpu", enableGpu,
            "autoLoad", autoLoad,
            "preferWindowAI", preferWindowAI
        );
    }

    /**
     * Obtains a service resource resolver for JCR access.
     * 
     * @return A ResourceResolver authorized for service tasks.
     * @throws LoginException If authentication fails.
     */
    public ResourceResolver getServiceResourceResolver() throws LoginException {
        return resourceResolverFactory.getServiceResourceResolver(null);
    }
    
    /**
     * Sets a new model ID.
     * @param modelId The model identifier to set.
     */
    public void setModelId(String modelId) {
        this.modelId = modelId;
    }
    
    /**
     * Sets the maximum tokens for generation.
     * @param maxTokens The max tokens limit.
     */
    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }
    
    /**
     * Sets the sampling temperature.
     * @param temperature The temperature value (typically 0.0 to 1.0).
     */
    public void setTemperature(float temperature) {
        this.temperature = temperature;
    }

    /**
     * Checks if the model supports token streaming.
     * @return Always true for current implementation.
     */
    public boolean supportsStreaming() {
        return true;
    }

    /**
     * Gets the runtime environment for the model.
     * @return The runtime identifier (e.g., "transformers.js").
     */
    public String getRuntime() {
        return (modelId.equals("gemini-nano") || preferWindowAI) ? "window.ai" : "transformers.js";
    }
}
