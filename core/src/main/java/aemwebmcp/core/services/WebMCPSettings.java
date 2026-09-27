package aemwebmcp.core.services;

import aemwebmcp.core.config.WebMCPConfiguration;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.Designate;

/** Shared configuration snapshot for the existing servlets and page model. */
@Component(service = WebMCPSettings.class, configurationPid = "com.aem.webmcp.WebMCPConfiguration")
@Designate(ocd = WebMCPConfiguration.class)
public class WebMCPSettings {
    private volatile WebMCPConfiguration config;
    @Activate @Modified
    public void configure(WebMCPConfiguration value) { config = value; }
    public boolean isEnabled() { return config == null || config.webmcp_enabled(); }
    public boolean isDebug() { return config != null && config.webmcp_debug(); }
    public boolean isConsentRequired() { return config == null || config.webmcp_consentRequired(); }
    public boolean isFormEnabled() { return isEnabled() && (config == null || config.form_enabled()); }
    public int getFormRateLimit() { return config == null ? 10 : Math.max(1, config.form_rateLimitPerMinute()); }
    public int getMaxFieldLength() { return config == null ? 5000 : Math.max(1, config.form_maxFieldLength()); }
    public int getMaxRequestSize() { return config == null ? 1048576 : Math.max(1, config.form_maxRequestSize()); }
    public boolean isCsrfEnabled() { return config == null || config.form_csrfEnabled(); }
    public boolean isSearchEnabled() { return isEnabled() && (config == null || config.search_enabled()); }
    public boolean isSearchMockData() { return config == null || config.search_mockData(); }
    public int getMaxResults() { return config == null ? 20 : Math.max(1, Math.min(100, config.search_maxResults())); }
    public int getMinQueryLength() { return config == null ? 2 : Math.max(1, config.search_minQueryLength()); }
    public boolean isCommerceEnabled() { return isEnabled() && (config == null || config.commerce_enabled()); }
    public boolean isCommerceMockData() { return config == null || config.commerce_mockData(); }
    public boolean isPersistToJCR() { return config != null && config.commerce_persistToJCR(); }
    public int getMaxCartItems() { return config == null ? 50 : Math.max(1, Math.min(1000, config.commerce_maxCartItems())); }
    public int getCartTimeoutMinutes() { return config == null ? 30 : Math.max(1, config.commerce_cartTimeoutMinutes()); }
}
