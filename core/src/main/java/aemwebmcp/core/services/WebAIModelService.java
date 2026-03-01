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

@Component(service = WebAIModelService.class)
public class WebAIModelService {

    private static final Logger LOG = LoggerFactory.getLogger(WebAIModelService.class);

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    private String modelId = "Xenova/TinyLlama-1.1B-Chat-v1.0";
    private String modelType = "llm";
    private int maxTokens = 512;
    private float temperature = 0.7f;
    private boolean enableGpu = true;
    private boolean autoLoad = false;

    public String getModelId() {
        return modelId;
    }

    public String getModelType() {
        return modelType;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public float getTemperature() {
        return temperature;
    }

    public boolean isGpuEnabled() {
        return enableGpu;
    }

    public boolean isAutoLoadEnabled() {
        return autoLoad;
    }

    public Map<String, Object> getConfig() {
        return Map.of(
            "modelId", modelId,
            "modelType", modelType,
            "maxTokens", maxTokens,
            "temperature", temperature,
            "enableGpu", enableGpu,
            "autoLoad", autoLoad
        );
    }

    public ResourceResolver getServiceResourceResolver() throws LoginException {
        return resourceResolverFactory.getServiceResourceResolver(null);
    }
    
    public void setModelId(String modelId) {
        this.modelId = modelId;
    }
    
    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }
    
    public void setTemperature(float temperature) {
        this.temperature = temperature;
    }
}
