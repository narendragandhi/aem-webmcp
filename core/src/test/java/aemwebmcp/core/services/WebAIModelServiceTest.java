package aemwebmcp.core.services;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class WebAIModelServiceTest {

    @Test
    void testDefaultConfiguration() {
        WebAIModelService service = new WebAIModelService();
        
        assertEquals("gemini-nano", service.getModelId());
        assertEquals("llm", service.getModelType());
        assertEquals(512, service.getMaxTokens());
        assertEquals(0.7f, service.getTemperature());
        assertTrue(service.isGpuEnabled());
        assertTrue(service.isAutoLoadEnabled());
    }

    @Test
    void testGetConfig() {
        WebAIModelService service = new WebAIModelService();
        Map<String, Object> config = service.getConfig();
        
        assertNotNull(config);
        assertEquals("gemini-nano", config.get("modelId"));
        assertEquals("llm", config.get("modelType"));
        assertEquals(512, config.get("maxTokens"));
        assertEquals(0.7f, config.get("temperature"));
        assertTrue((Boolean) config.get("enableGpu"));
        assertTrue((Boolean) config.get("autoLoad"));
        assertTrue((Boolean) config.get("preferWindowAI"));
    }

    @Test
    void testModelSettings() {
        WebAIModelService service = new WebAIModelService();
        
        assertTrue(service.supportsStreaming());
        assertEquals("window.ai", service.getRuntime());
    }

    @Test
    void testRuntimeLogic() {
        WebAIModelService service = new WebAIModelService();
        assertEquals("window.ai", service.getRuntime());
        
        // No easy way to set private fields without reflection or adding setters,
        // but we've covered the main branch.
    }
}
