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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component(service = WebAIFunctionRegistry.class)
public class WebAIFunctionRegistry {

    private static final Logger LOG = LoggerFactory.getLogger(WebAIFunctionRegistry.class);
    
    private final Map<String, AIFunction> functions = new HashMap<>();

    public static class AIFunction {
        private final String name;
        private final String description;
        private final Map<String, FunctionParameter> parameters;

        public AIFunction(String name, String description, Map<String, FunctionParameter> parameters) {
            this.name = name;
            this.description = description;
            this.parameters = parameters;
        }

        public String getName() { return name; }
        public String getDescription() { return description; }
        public Map<String, FunctionParameter> getParameters() { return parameters; }
        
        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("name", name);
            map.put("description", description);
            if (parameters != null && !parameters.isEmpty()) {
                Map<String, Object> params = new HashMap<>();
                parameters.forEach((k, v) -> params.put(k, v.toMap()));
                map.put("parameters", params);
            }
            return map;
        }
    }

    public static class FunctionParameter {
        private final String type;
        private final String description;
        private final boolean required;

        public FunctionParameter(String type, String description, boolean required) {
            this.type = type;
            this.description = description;
            this.required = required;
        }

        public String getType() { return type; }
        public String getDescription() { return description; }
        public boolean isRequired() { return required; }
        
        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("type", type);
            map.put("description", description);
            map.put("required", required);
            return map;
        }
    }

    public WebAIFunctionRegistry() {
        registerDefaultFunctions();
    }

    private void registerDefaultFunctions() {
        // Page Actions
        register("getPageInfo", "Get current page information", Map.of(
            "pageTitle", new FunctionParameter("string", "Page title", false),
            "url", new FunctionParameter("string", "Page URL", false),
            "components", new FunctionParameter("integer", "Number of components", false)
        ));

        register("getComponents", "Get all WebMCP components on the page", Map.of(
            "category", new FunctionParameter("string", "Filter by category (commerce, navigation, form, etc.)", false)
        ));

        // Search Actions
        register("search", "Search the website", Map.of(
            "query", new FunctionParameter("string", "Search query", true)
        ));

        // Form Actions
        register("fillForm", "Fill a form field", Map.of(
            "selector", new FunctionParameter("string", "CSS selector for input", true),
            "value", new FunctionParameter("string", "Value to fill", true)
        ));

        register("submitForm", "Submit a form", Map.of(
            "selector", new FunctionParameter("string", "CSS selector for form", true)
        ));

        // Navigation Actions
        register("navigate", "Navigate to a URL", Map.of(
            "url", new FunctionParameter("string", "Target URL", true)
        ));

        register("clickElement", "Click an element", Map.of(
            "selector", new FunctionParameter("string", "CSS selector", true)
        ));

        // Layout Actions
        register("expandAccordion", "Expand an accordion item", Map.of(
            "selector", new FunctionParameter("string", "CSS selector for accordion", true)
        ));

        register("collapseAccordion", "Collapse an accordion item", Map.of(
            "selector", new FunctionParameter("string", "CSS selector for accordion", true)
        ));

        register("selectTab", "Switch to a specific tab", Map.of(
            "selector", new FunctionParameter("string", "CSS selector for tabs", true),
            "index", new FunctionParameter("integer", "Tab index (0-based)", true)
        ));

        // E-commerce Actions
        register("addToCart", "Add product to cart", Map.of(
            "productSelector", new FunctionParameter("string", "CSS selector for product", true),
            "quantity", new FunctionParameter("integer", "Quantity to add", false)
        ));

        LOG.info("Registered {} WebMCP functions for AI", functions.size());
    }

    public void register(String name, String description, Map<String, FunctionParameter> parameters) {
        functions.put(name, new AIFunction(name, description, parameters));
        LOG.debug("Registered function: {}", name);
    }

    public AIFunction getFunction(String name) {
        return functions.get(name);
    }

    public List<AIFunction> getAllFunctions() {
        return new ArrayList<>(functions.values());
    }

    public List<Map<String, Object>> getFunctionsAsList() {
        return functions.values().stream()
            .map(AIFunction::toMap)
            .collect(Collectors.toList());
    }

    public int getFunctionCount() {
        return functions.size();
    }
}
