package aemwebmcp.core.services;

import org.junit.jupiter.api.Test;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class WebAIFunctionRegistryTest {

    @Test
    void testDefaultFunctionsRegistered() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        assertTrue(registry.getFunctionCount() >= 10);
        assertNotNull(registry.getFunction("getPageInfo"));
        assertNotNull(registry.getFunction("search"));
        assertNotNull(registry.getFunction("addToCart"));
    }

    @Test
    void testRegisterCustomFunction() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        Map<String, WebAIFunctionRegistry.FunctionParameter> params = new HashMap<>();
        params.put("param1", new WebAIFunctionRegistry.FunctionParameter("string", "desc", true));
        
        registry.register("custom", "custom desc", params);
        
        WebAIFunctionRegistry.AIFunction func = registry.getFunction("custom");
        assertNotNull(func);
        assertEquals("custom", func.getName());
        assertEquals("custom desc", func.getDescription());
        assertEquals(1, func.getParameters().size());
    }

    @Test
    void testUnregisterFunction() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        int initialCount = registry.getFunctionCount();
        
        registry.unregisterFunction("search");
        assertEquals(initialCount - 1, registry.getFunctionCount());
        assertNull(registry.getFunction("search"));
    }

    @Test
    void testGetFunctionsByCategory() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        List<WebAIFunctionRegistry.AIFunction> commerceFuncs = registry.getFunctionsByCategory("cart");
        assertFalse(commerceFuncs.isEmpty());
        assertTrue(commerceFuncs.stream().anyMatch(f -> f.getName().equals("addToCart")));
    }

    @Test
    void testGetToolsJson() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        String json = registry.getToolsJson();
        assertNotNull(json);
        assertTrue(json.contains("\"tools\""));
        assertTrue(json.contains("\"function\""));
        assertTrue(json.contains("getPageInfo"));
    }

    @Test
    void testFunctionParameterToMap() {
        WebAIFunctionRegistry.FunctionParameter param = new WebAIFunctionRegistry.FunctionParameter("string", "desc", true);
        Map<String, Object> map = param.toMap();
        assertEquals("string", map.get("type"));
        assertEquals("desc", map.get("description"));
        assertEquals(true, map.get("required"));
    }

    @Test
    void testGetAllFunctions() {
        WebAIFunctionRegistry registry = new WebAIFunctionRegistry();
        List<WebAIFunctionRegistry.AIFunction> all = registry.getAllFunctions();
        assertEquals(registry.getFunctionCount(), all.size());
    }
}
