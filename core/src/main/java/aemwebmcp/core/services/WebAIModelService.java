/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.services;

import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(service = WebAIModelService.class)
@Designate(ocd = WebAIModelService.Config.class)
public class WebAIModelService {

    private static final Logger LOG = LoggerFactory.getLogger(WebAIModelService.class);

    @Reference
    private ResourceResolverFactory resourceResolverFactory;

    private Config config;

    @ObjectClassDefinition(name = "AEM WebAI Model Service")
    public interface Config {
        @AttributeDefinition(name = "Model ID", description = "Hugging Face model ID for transformers.js")
        default String modelId() default "Xenova/TinyLlama-1.1B-Chat-v1.0";

        @AttributeDefinition(name = "Model Type", description = "Type of model (llm, embedding)")
        default String modelType() default "llm";

        @AttributeDefinition(name = "Max Tokens", description = "Maximum tokens to generate")
        default int maxTokens() default 512;

        @AttributeDefinition(name = "Temperature", description = "Generation temperature")
        default float temperature() default 0.7f;

        @AttributeDefinition(name = "Enable GPU", description = "Enable WebGPU acceleration when available")
        default boolean enableGpu() default true;

        @AttributeDefinition(name = "Auto Load", description = "Automatically load model on page load")
        default boolean autoLoad() default false;
    }

    @Activate
    protected void activate(Config config) {
        this.config = config;
        LOG.info("AEM WebAI Model Service activated with model: {}", config.modelId());
    }

    public String getModelId() {
        return config.modelId();
    }

    public String getModelType() {
        return config.modelType();
    }

    public int getMaxTokens() {
        return config.maxTokens();
    }

    public float getTemperature() {
        return config.temperature();
    }

    public boolean isGpuEnabled() {
        return config.enableGpu();
    }

    public boolean isAutoLoadEnabled() {
        return config.autoLoad();
    }

    public ResourceResolver getServiceResourceResolver() throws LoginException {
        return resourceResolverFactory.getServiceResourceResolver(null);
    }
}
