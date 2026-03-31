package aemwebmcp.core.config;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

/**
 * OSGi Configuration for AEM WebMCP (Web Model Context Protocol).
 * This configuration controls global settings for AI integration, commerce features, 
 * form submission handling, and site search.
 * 
 * @since 1.0.0
 * @author AEM WebMCP Team
 */
@ObjectClassDefinition(
    name = "AEM WebMCP Configuration",
    description = "Configuration for WebMCP (Web Model Context Protocol) integration"
)
public @interface WebMCPConfiguration {

    /**
     * Globally enables or disables WebMCP functionality.
     * @return true if enabled, false otherwise.
     */
    @AttributeDefinition(
        name = "Enable WebMCP",
        description = "Enable or disable WebMCP functionality globally",
        defaultValue = "true"
    )
    boolean webmcp_enabled() default true;

    /**
     * Enables debug logging for WebMCP components.
     * @return true if debug mode is active.
     */
    @AttributeDefinition(
        name = "Debug Mode",
        description = "Enable debug logging for WebMCP",
        defaultValue = "false"
    )
    boolean webmcp_debug() default false;

    /**
     * Requires explicit user consent before activating AI features.
     * @return true if consent is required.
     */
    @AttributeDefinition(
        name = "Require User Consent",
        description = "Require user consent before enabling WebMCP features",
        defaultValue = "true"
    )
    boolean webmcp_consentRequired() default true;

    /**
     * Enables or disables AI-driven commerce features.
     * @return true if commerce is enabled.
     */
    @AttributeDefinition(
        name = "Commerce Enabled",
        description = "Enable commerce features (cart, search)",
        defaultValue = "true"
    )
    boolean commerce_enabled() default true;

    /**
     * Uses mock commerce data instead of a real backend.
     * @return true to use mock data.
     */
    @AttributeDefinition(
        name = "Use Mock Commerce Data",
        description = "Use mock data instead of connecting to CIF/Commerce",
        defaultValue = "true"
    )
    boolean commerce_mockData() default true;

    /**
     * Limits the number of items that can be added to the cart.
     * @return Max items count.
     */
    @AttributeDefinition(
        name = "Max Cart Items",
        description = "Maximum number of items in cart",
        defaultValue = "50"
    )
    int commerce_maxCartItems() default 50;

    /**
     * Duration after which an inactive cart expires.
     * @return Timeout in minutes.
     */
    @AttributeDefinition(
        name = "Cart Timeout (minutes)",
        description = "Cart expiration timeout in minutes",
        defaultValue = "30"
    )
    int commerce_cartTimeoutMinutes() default 30;

    /**
     * Persists cart data to the JCR for persistence across server restarts.
     * @return true if persistence is enabled.
     */
    @AttributeDefinition(
        name = "Persist Cart to JCR",
        description = "Persist cart to JCR for multi-server deployments",
        defaultValue = "false"
    )
    boolean commerce_persistToJCR() default false;

    /**
     * Enables or disables AI form submission handling.
     * @return true if enabled.
     */
    @AttributeDefinition(
        name = "Form Submission Enabled",
        description = "Enable form submission handling",
        defaultValue = "true"
    )
    boolean form_enabled() default true;

    /**
     * Maximum number of form submissions allowed per minute per IP.
     * @return Rate limit value.
     */
    @AttributeDefinition(
        name = "Rate Limit (per minute)",
        description = "Maximum form submissions per minute per IP",
        defaultValue = "10"
    )
    int form_rateLimitPerMinute() default 10;

    /**
     * Maximum character length for any form field value.
     * @return Max field length.
     */
    @AttributeDefinition(
        name = "Max Field Length",
        description = "Maximum length for form field values",
        defaultValue = "5000"
    )
    int form_maxFieldLength() default 5000;

    /**
     * Maximum allowed size for a form submission request in bytes.
     * @return Max request size.
     */
    @AttributeDefinition(
        name = "Max Request Size (bytes)",
        description = "Maximum request size for form submissions",
        defaultValue = "1048576"
    )
    int form_maxRequestSize() default 1048576;

    /**
     * Enables or disables CSRF protection for form submissions.
     * @return true if CSRF protection is active.
     */
    @AttributeDefinition(
        name = "CSRF Protection Enabled",
        description = "Enable CSRF token validation for forms",
        defaultValue = "true"
    )
    boolean form_csrfEnabled() default true;

    /**
     * Enables or disables site search functionality.
     * @return true if enabled.
     */
    @AttributeDefinition(
        name = "Search Enabled",
        description = "Enable site search functionality",
        defaultValue = "true"
    )
    boolean search_enabled() default true;

    /**
     * Maximum number of results to return for a single search query.
     * @return Max results count.
     */
    @AttributeDefinition(
        name = "Max Search Results",
        description = "Maximum number of search results to return",
        defaultValue = "20"
    )
    int search_maxResults() default 20;

    /**
     * Minimum number of characters required for a valid search query.
     * @return Min query length.
     */
    @AttributeDefinition(
        name = "Min Query Length",
        description = "Minimum search query length",
        defaultValue = "2"
    )
    int search_minQueryLength() default 2;

    /**
     * Uses a mock search index instead of searching actual JCR content.
     * @return true to use mock search.
     */
    @AttributeDefinition(
        name = "Use Mock Search Data",
        description = "Use mock search index instead of content search",
        defaultValue = "true"
    )
    boolean search_mockData() default true;
}
