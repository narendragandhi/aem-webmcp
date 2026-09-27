package aemwebmcp.core.services;

import aemwebmcp.core.config.WebMCPConfiguration;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WebMCPSettingsTest {
    @Test
    void disabledGlobalSettingDisablesAllDemoEndpoints() {
        WebMCPSettings settings = new WebMCPSettings();
        assertTrue(settings.isEnabled());
        settings.configure(mock(WebMCPConfiguration.class));
        assertFalse(settings.isEnabled());
        assertFalse(settings.isFormEnabled());
        assertFalse(settings.isSearchEnabled());
        assertFalse(settings.isCommerceEnabled());
    }

    @Test
    void configurationControlsLimitsAndNeverSilentlyEnablesMockBackends() {
        WebMCPConfiguration config = mock(WebMCPConfiguration.class);
        when(config.webmcp_enabled()).thenReturn(true);
        when(config.form_enabled()).thenReturn(true);
        when(config.form_rateLimitPerMinute()).thenReturn(3);
        when(config.form_maxFieldLength()).thenReturn(50);
        when(config.search_maxResults()).thenReturn(7);
        when(config.commerce_maxCartItems()).thenReturn(4);
        WebMCPSettings settings = new WebMCPSettings();
        settings.configure(config);
        assertTrue(settings.isFormEnabled());
        assertEquals(3, settings.getFormRateLimit());
        assertEquals(50, settings.getMaxFieldLength());
        assertEquals(7, settings.getMaxResults());
        assertEquals(4, settings.getMaxCartItems());
        assertFalse(settings.isSearchMockData());
        assertFalse(settings.isCommerceMockData());
    }
}
