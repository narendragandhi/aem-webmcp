package aemwebmcp.core.services;

import org.junit.jupiter.api.Test;
import java.util.HashMap;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class WebAIFunctionRegistryTest {

    @Test
    void testDefaultFunctionsRegistered() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        
        assertTrue(registry.getFunctionCount() > 0);
        assertNotNull(registry.getAllFunctions());
    }

    @Test
    void testGetFunction() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        
        WebAIFunctionRegistry.AIFunction searchFn = registry.getFunction("search");
        assertNotNull(searchFn);
        assertEquals("search", searchFn.getName());
    }

    @Test
    void testGetFunctionNotFound() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        
        assertNull(registry.getFunction("nonExistent"));
    }

    @Test
    void testRegisterFunction() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        int initialCount = registry.getFunctionCount();
        
        Map<String, WebAIFunctionRegistry.FunctionParameter> params = new HashMap<>();
        params.put("query", new WebAIFunctionRegistry.FunctionParameter("string", "Search query", true));
        registry.register("customSearch", "Custom search function", params);
        
        assertEquals(initialCount + 1, registry.getFunctionCount());
        assertNotNull(registry.getFunction("customSearch"));
    }

    @Test
    void testUnregisterFunction() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        assertNotNull(registry.getFunction("search"));
        
        registry.unregisterFunction("search");
        
        assertNull(registry.getFunction("search"));
    }

    @Test
    void testGetFunctionsByCategory() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        
        // The default function descriptions don't contain category keywords
        // This test verifies the method works when no matches found
        assertNotNull(registry.getFunctionsByCategory("xyz123"));
    }

    @Test
    void testAIFunctionToMap() {
        Map<String, WebAIFunctionRegistry.FunctionParameter> params = new HashMap<>();
        params.put("q", new WebAIFunctionRegistry.FunctionParameter("string", "Query", true));
        
        WebAIFunctionRegistry.AIFunction fn = new WebAIFunctionRegistry.AIFunction("test", "Test function", params);
        Map<String, Object> map = fn.toMap();
        
        assertEquals("test", map.get("name"));
        assertEquals("Test function", map.get("description"));
        assertNotNull(map.get("parameters"));
    }

    @Test
    void testFunctionParameterToMap() {
        WebAIFunctionRegistry.FunctionParameter param = 
            new WebAIFunctionRegistry.FunctionParameter("string", "Test param", true);
        
        Map<String, Object> map = param.toMap();
        
        assertEquals("string", map.get("type"));
        assertEquals("Test param", map.get("description"));
        assertTrue((Boolean) map.get("required"));
    }

    @Test
    void testGetToolsJson() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        
        String toolsJson = registry.getToolsJson();
        assertNotNull(toolsJson);
        assertTrue(toolsJson.contains("function"));
    }
}
