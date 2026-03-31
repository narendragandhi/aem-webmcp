/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Registry for WebMCP AI functions.
 * This service manages the registration and retrieval of functions that can be called by AI agents.
 * 
 * @since 1.0.0
 * @author AEM WebMCP Team
 */
@Component(service = WebAIFunctionRegistry.class)
public class WebAIFunctionRegistry {

    private static final Logger LOG = LoggerFactory.getLogger(WebAIFunctionRegistry.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    
    /**
     * Map of registered functions, keyed by function name.
     */
    private final Map<String, AIFunction> functions = new HashMap<>();

    /**
     * Represents a function that can be called by an AI agent.
     */
    public static class AIFunction {
        private final String name;
        private final String description;
        private final Map<String, FunctionParameter> parameters;

        /**
         * Creates a new AI function.
         * 
         * @param name The name of the function.
         * @param description A description of what the function does.
         * @param parameters The parameters accepted by the function.
         */
        public AIFunction(String name, String description, Map<String, FunctionParameter> parameters) {
            this.name = name;
            this.description = description;
            this.parameters = parameters;
        }

        /**
         * Gets the function name.
         * @return The function name.
         */
        public String getName() { return name; }

        /**
         * Gets the function description.
         * @return The function description.
         */
        public String getDescription() { return description; }

        /**
         * Gets the function parameters.
         * @return Map of parameter names to their definitions.
         */
        public Map<String, FunctionParameter> getParameters() { return parameters; }
        
        /**
         * Converts the function to a map representation.
         * @return Map containing function details.
         */
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

    /**
     * Represents a parameter for an AI function.
     */
    public static class FunctionParameter {
        private final String type;
        private final String description;
        private final boolean required;

        /**
         * Creates a new function parameter.
         * 
         * @param type The data type of the parameter.
         * @param description Description of the parameter.
         * @param required Whether the parameter is mandatory.
         */
        public FunctionParameter(String type, String description, boolean required) {
            this.type = type;
            this.description = description;
            this.required = required;
        }

        /**
         * Gets the parameter type.
         * @return The parameter type.
         */
        public String getType() { return type; }

        /**
         * Gets the parameter description.
         * @return The parameter description.
         */
        public String getDescription() { return description; }

        /**
         * Checks if the parameter is required.
         * @return true if required, false otherwise.
         */
        public boolean isRequired() { return required; }
        
        /**
         * Converts the parameter to a map representation.
         * @return Map containing parameter details.
         */
        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("type", type);
            map.put("description", description);
            map.put("required", required);
            return map;
        }
    }

    /**
     * Default constructor. Registers default system functions.
     */
    public WebAIFunctionRegistry() {
        registerDefaultFunctions();
    }

    /**
     * Registers default WebMCP functions for page interaction, search, forms, and navigation.
     */
    private void registerDefaultFunctions() {
        // ... (existing code)
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

    /**
     * Registers a new AI function.
     * 
     * @param name The unique name of the function.
     * @param description A clear description of the function's purpose.
     * @param parameters Map of parameters accepted by this function.
     */
    public void register(String name, String description, Map<String, FunctionParameter> parameters) {
        functions.put(name, new AIFunction(name, description, parameters));
        LOG.debug("Registered function: {}", name);
    }

    /**
     * Retrieves a registered function by name.
     * 
     * @param name The name of the function to retrieve.
     * @return The AIFunction if found, null otherwise.
     */
    public AIFunction getFunction(String name) {
        return functions.get(name);
    }

    /**
     * Gets all registered AI functions.
     * 
     * @return A list of all registered AIFunctions.
     */
    public List<AIFunction> getAllFunctions() {
        return new ArrayList<>(functions.values());
    }

    /**
     * Gets all registered functions as a list of maps.
     * This format is often useful for JSON serialization.
     * 
     * @return List of map representations of functions.
     */
    public List<Map<String, Object>> getFunctionsAsList() {
        return functions.values().stream()
            .map(AIFunction::toMap)
            .collect(Collectors.toList());
    }

    /**
     * Gets the total count of registered functions.
     * @return The number of registered functions.
     */
    public int getFunctionCount() {
        return functions.size();
    }

    /**
     * Removes a function from the registry.
     * @param name The name of the function to unregister.
     */
    public void unregisterFunction(String name) {
        functions.remove(name);
        LOG.debug("Unregistered function: {}", name);
    }

    /**
     * Filters functions based on a category keyword in their description.
     * 
     * @param category The category keyword to search for.
     * @return List of matching AIFunctions.
     */
    public List<AIFunction> getFunctionsByCategory(String category) {
        return functions.values().stream()
            .filter(fn -> fn.getDescription().toLowerCase().contains(category.toLowerCase()))
            .collect(Collectors.toList());
    }

    /**
     * Generates a JSON string representing the tools (functions) in OpenAI/Anthropic format.
     * 
     * @return JSON string of tools.
     */
    public String getToolsJson() {
        try {
            Map<String, Object> result = new HashMap<>();
            List<Map<String, Object>> tools = new ArrayList<>();
            
            for (Map<String, Object> func : getFunctionsAsList()) {
                Map<String, Object> tool = new HashMap<>();
                tool.put("type", "function");
                tool.put("function", func);
                tools.add(tool);
            }
            
            result.put("tools", tools);
            return MAPPER.writeValueAsString(result);
        } catch (Exception e) {
            LOG.error("Error generating tools JSON", e);
            return "{\"tools\":[]}";
        }
    }
}
