/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.models.webai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Model(adaptables = SlingHttpServletRequest.class)
public class WebAIChatModel {

    private static final Logger LOG = LoggerFactory.getLogger(WebAIChatModel.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Self
    private SlingHttpServletRequest request;

    private String jsonConfig;
    private boolean enabled = true;
    private String modelId = "Xenova/TinyLlama-1.1B-Chat-v1.0";
    private int maxTokens = 512;
    private float temperature = 0.7f;

    @PostConstruct
    protected void init() {
        try {
            Map<String, Object> config = new HashMap<>();
            config.put("enabled", enabled);
            config.put("modelId", modelId);
            config.put("maxTokens", maxTokens);
            config.put("temperature", temperature);
            config.put("functions", getFunctionsList());
            
            jsonConfig = MAPPER.writeValueAsString(config);
            LOG.debug("WebAI Chat Model initialized with config: {}", jsonConfig);
        } catch (Exception e) {
            LOG.error("Error initializing WebAI Chat Model", e);
        }
    }

    private Map<String, Object>[] getFunctionsList() {
        return new Map[]{
            Map.of("name", "getPageInfo", "description", "Get page information"),
            Map.of("name", "search", "description", "Search the website", "params", new String[]{"query"}),
            Map.of("name", "fillForm", "description", "Fill form field", "params", new String[]{"selector", "value"}),
            Map.of("name", "navigate", "description", "Navigate to URL", "params", new String[]{"url"}),
            Map.of("name", "addToCart", "description", "Add to cart", "params", new String[]{"productSelector", "quantity"})
        };
    }

    public String getJsonConfig() {
        return jsonConfig;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getModelId() {
        return modelId;
    }
}
