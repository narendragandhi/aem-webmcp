package aemwebmcp.core.config;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

@ObjectClassDefinition(
    name = "AEM WebMCP Configuration",
    description = "Configuration for WebMCP (Web Model Context Protocol) integration"
)
public @interface WebMCPConfiguration {

    @AttributeDefinition(
        name = "Enable WebMCP",
        description = "Enable or disable WebMCP functionality globally",
        defaultValue = "true"
    )
    boolean webmcp_enabled() default true;

    @AttributeDefinition(
        name = "Debug Mode",
        description = "Enable debug logging for WebMCP",
        defaultValue = "false"
    )
    boolean webmcp_debug() default false;

    @AttributeDefinition(
        name = "Require User Consent",
        description = "Require user consent before enabling WebMCP features",
        defaultValue = "true"
    )
    boolean webmcp_consentRequired() default true;

    @AttributeDefinition(
        name = "Commerce Enabled",
        description = "Enable commerce features (cart, search)",
        defaultValue = "true"
    )
    boolean commerce_enabled() default true;

    @AttributeDefinition(
        name = "Use Mock Commerce Data",
        description = "Use mock data instead of connecting to CIF/Commerce",
        defaultValue = "true"
    )
    boolean commerce_mockData() default true;

    @AttributeDefinition(
        name = "Max Cart Items",
        description = "Maximum number of items in cart",
        defaultValue = "50"
    )
    int commerce_maxCartItems() default 50;

    @AttributeDefinition(
        name = "Cart Timeout (minutes)",
        description = "Cart expiration timeout in minutes",
        defaultValue = "30"
    )
    int commerce_cartTimeoutMinutes() default 30;

    @AttributeDefinition(
        name = "Persist Cart to JCR",
        description = "Persist cart to JCR for multi-server deployments",
        defaultValue = "false"
    )
    boolean commerce_persistToJCR() default false;

    @AttributeDefinition(
        name = "Form Submission Enabled",
        description = "Enable form submission handling",
        defaultValue = "true"
    )
    boolean form_enabled() default true;

    @AttributeDefinition(
        name = "Rate Limit (per minute)",
        description = "Maximum form submissions per minute per IP",
        defaultValue = "10"
    )
    int form_rateLimitPerMinute() default 10;

    @AttributeDefinition(
        name = "Max Field Length",
        description = "Maximum length for form field values",
        defaultValue = "5000"
    )
    int form_maxFieldLength() default 5000;

    @AttributeDefinition(
        name = "Max Request Size (bytes)",
        description = "Maximum request size for form submissions",
        defaultValue = "1048576"
    )
    int form_maxRequestSize() default 1048576;

    @AttributeDefinition(
        name = "CSRF Protection Enabled",
        description = "Enable CSRF token validation for forms",
        defaultValue = "true"
    )
    boolean form_csrfEnabled() default true;

    @AttributeDefinition(
        name = "Search Enabled",
        description = "Enable site search functionality",
        defaultValue = "true"
    )
    boolean search_enabled() default true;

    @AttributeDefinition(
        name = "Max Search Results",
        description = "Maximum number of search results to return",
        defaultValue = "20"
    )
    int search_maxResults() default 20;

    @AttributeDefinition(
        name = "Min Query Length",
        description = "Minimum search query length",
        defaultValue = "2"
    )
    int search_minQueryLength() default 2;

    @AttributeDefinition(
        name = "Use Mock Search Data",
        description = "Use mock search index instead of content search",
        defaultValue = "true"
    )
    boolean search_mockData() default true;
}
