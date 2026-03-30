/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */
package aemwebmcp.core.services;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;
import java.util.function.Supplier;

/**
 * Observability and Metrics Service for AEM WebMCP.
 * Provides counters, timers, gauges, and distributed tracing capabilities.
 *
 * <p>Metrics are exposed via:
 * <ul>
 *   <li>JMX MBeans for operational monitoring</li>
 *   <li>JSON endpoint for Prometheus/Grafana scraping</li>
 *   <li>Structured logging for ELK/Splunk integration</li>
 * </ul>
 *
 * @since 1.1.0
 * @author AEM WebMCP Team
 */
@Component(service = WebMCPMetricsService.class, immediate = true)
@Designate(ocd = WebMCPMetricsService.Config.class)
public class WebMCPMetricsService {

    private static final Logger LOG = LoggerFactory.getLogger(WebMCPMetricsService.class);
    private static final Logger METRICS_LOG = LoggerFactory.getLogger("aem.webmcp.metrics");
    private static final Logger TRACE_LOG = LoggerFactory.getLogger("aem.webmcp.traces");

    @ObjectClassDefinition(
        name = "AEM WebMCP Metrics Configuration",
        description = "Configuration for observability and metrics collection"
    )
    public @interface Config {
        @AttributeDefinition(
            name = "Enable Metrics",
            description = "Enable metrics collection",
            defaultValue = "true"
        )
        boolean metrics_enabled() default true;

        @AttributeDefinition(
            name = "Enable Tracing",
            description = "Enable distributed tracing",
            defaultValue = "true"
        )
        boolean tracing_enabled() default true;

        @AttributeDefinition(
            name = "Log Metrics Interval (seconds)",
            description = "Interval for periodic metrics logging (0 to disable)",
            defaultValue = "60"
        )
        int metrics_logInterval() default 60;

        @AttributeDefinition(
            name = "Histogram Buckets",
            description = "Latency histogram buckets in milliseconds",
            defaultValue = {"10", "50", "100", "250", "500", "1000", "2500", "5000"}
        )
        String[] histogram_buckets() default {"10", "50", "100", "250", "500", "1000", "2500", "5000"};
    }

    // ==================== COUNTERS ====================
    private final LongAdder componentDetectionCount = new LongAdder();
    private final LongAdder formSubmissionCount = new LongAdder();
    private final LongAdder formSubmissionErrorCount = new LongAdder();
    private final LongAdder searchRequestCount = new LongAdder();
    private final LongAdder cartOperationCount = new LongAdder();
    private final LongAdder aiInteractionCount = new LongAdder();
    private final LongAdder aiFunctionCallCount = new LongAdder();
    private final LongAdder contentFragmentFetchCount = new LongAdder();
    private final LongAdder contentFragmentErrorCount = new LongAdder();
    private final LongAdder rateLimitHitCount = new LongAdder();
    private final LongAdder csrfValidationFailCount = new LongAdder();
    private final LongAdder consentGrantedCount = new LongAdder();
    private final LongAdder consentDeniedCount = new LongAdder();

    // ==================== GAUGES ====================
    private final AtomicLong activeCartSessions = new AtomicLong(0);
    private final AtomicLong activeChatSessions = new AtomicLong(0);
    private final AtomicLong pendingAIRequests = new AtomicLong(0);

    // ==================== HISTOGRAMS ====================
    private final Map<String, LatencyHistogram> latencyHistograms = new ConcurrentHashMap<>();

    // ==================== TRACE CONTEXT ====================
    private final ThreadLocal<TraceContext> currentTrace = new ThreadLocal<>();

    private boolean metricsEnabled = true;
    private boolean tracingEnabled = true;
    private long[] histogramBuckets = {10, 50, 100, 250, 500, 1000, 2500, 5000};
    private volatile boolean active = false;

    @Activate
    protected void activate(Config config) {
        this.metricsEnabled = config.metrics_enabled();
        this.tracingEnabled = config.tracing_enabled();

        // Parse histogram buckets
        String[] bucketStrings = config.histogram_buckets();
        this.histogramBuckets = new long[bucketStrings.length];
        for (int i = 0; i < bucketStrings.length; i++) {
            this.histogramBuckets[i] = Long.parseLong(bucketStrings[i]);
        }

        // Initialize histograms
        initializeHistograms();

        this.active = true;
        LOG.info("WebMCP Metrics Service activated - metrics: {}, tracing: {}", metricsEnabled, tracingEnabled);
    }

    @Deactivate
    protected void deactivate() {
        this.active = false;
        LOG.info("WebMCP Metrics Service deactivated");
    }

    private void initializeHistograms() {
        latencyHistograms.put("component_detection", new LatencyHistogram("component_detection", histogramBuckets));
        latencyHistograms.put("form_submission", new LatencyHistogram("form_submission", histogramBuckets));
        latencyHistograms.put("search_request", new LatencyHistogram("search_request", histogramBuckets));
        latencyHistograms.put("cart_operation", new LatencyHistogram("cart_operation", histogramBuckets));
        latencyHistograms.put("ai_inference", new LatencyHistogram("ai_inference", histogramBuckets));
        latencyHistograms.put("graphql_query", new LatencyHistogram("graphql_query", histogramBuckets));
        latencyHistograms.put("content_fragment_fetch", new LatencyHistogram("content_fragment_fetch", histogramBuckets));
    }

    // ==================== COUNTER METHODS ====================

    /**
     * Increment component detection counter.
     * @param componentCount Number of components detected on page
     */
    public void recordComponentDetection(int componentCount) {
        if (!metricsEnabled) return;
        componentDetectionCount.add(componentCount);
        METRICS_LOG.debug("component_detection count={}", componentCount);
    }

    /**
     * Record a form submission.
     * @param success Whether the submission was successful
     */
    public void recordFormSubmission(boolean success) {
        if (!metricsEnabled) return;
        formSubmissionCount.increment();
        if (!success) {
            formSubmissionErrorCount.increment();
        }
        METRICS_LOG.debug("form_submission success={}", success);
    }

    /**
     * Record a search request.
     * @param resultCount Number of results returned
     */
    public void recordSearchRequest(int resultCount) {
        if (!metricsEnabled) return;
        searchRequestCount.increment();
        METRICS_LOG.debug("search_request results={}", resultCount);
    }

    /**
     * Record a cart operation.
     * @param operation Operation type (add, remove, update, checkout)
     */
    public void recordCartOperation(String operation) {
        if (!metricsEnabled) return;
        cartOperationCount.increment();
        METRICS_LOG.debug("cart_operation type={}", operation);
    }

    /**
     * Record an AI interaction.
     * @param functionName Name of the AI function called
     */
    public void recordAIInteraction(String functionName) {
        if (!metricsEnabled) return;
        aiInteractionCount.increment();
        aiFunctionCallCount.increment();
        METRICS_LOG.debug("ai_interaction function={}", functionName);
    }

    /**
     * Record a Content Fragment fetch.
     * @param fragmentPath Path to the Content Fragment
     * @param success Whether the fetch was successful
     */
    public void recordContentFragmentFetch(String fragmentPath, boolean success) {
        if (!metricsEnabled) return;
        contentFragmentFetchCount.increment();
        if (!success) {
            contentFragmentErrorCount.increment();
        }
        METRICS_LOG.debug("content_fragment_fetch path={} success={}", fragmentPath, success);
    }

    /**
     * Record a rate limit hit.
     * @param clientIp Client IP that hit the limit
     * @param endpoint Endpoint that was rate limited
     */
    public void recordRateLimitHit(String clientIp, String endpoint) {
        if (!metricsEnabled) return;
        rateLimitHitCount.increment();
        METRICS_LOG.warn("rate_limit_hit client={} endpoint={}", maskIp(clientIp), endpoint);
    }

    /**
     * Record a CSRF validation failure.
     */
    public void recordCSRFFailure() {
        if (!metricsEnabled) return;
        csrfValidationFailCount.increment();
        METRICS_LOG.warn("csrf_validation_fail");
    }

    /**
     * Record consent decision.
     * @param granted Whether consent was granted
     */
    public void recordConsentDecision(boolean granted) {
        if (!metricsEnabled) return;
        if (granted) {
            consentGrantedCount.increment();
        } else {
            consentDeniedCount.increment();
        }
        METRICS_LOG.debug("consent_decision granted={}", granted);
    }

    // ==================== GAUGE METHODS ====================

    /**
     * Update active cart sessions gauge.
     * @param delta Change in active sessions (+1 or -1)
     */
    public void updateActiveCartSessions(int delta) {
        if (!metricsEnabled) return;
        activeCartSessions.addAndGet(delta);
    }

    /**
     * Update active chat sessions gauge.
     * @param delta Change in active sessions (+1 or -1)
     */
    public void updateActiveChatSessions(int delta) {
        if (!metricsEnabled) return;
        activeChatSessions.addAndGet(delta);
    }

    /**
     * Update pending AI requests gauge.
     * @param delta Change in pending requests (+1 or -1)
     */
    public void updatePendingAIRequests(int delta) {
        if (!metricsEnabled) return;
        pendingAIRequests.addAndGet(delta);
    }

    // ==================== TIMER METHODS ====================

    /**
     * Create a timer for measuring operation latency.
     * @param operation Name of the operation being timed
     * @return Timer instance
     */
    public Timer startTimer(String operation) {
        return new Timer(operation, this);
    }

    /**
     * Record a latency measurement.
     * @param operation Operation name
     * @param durationMs Duration in milliseconds
     */
    public void recordLatency(String operation, long durationMs) {
        if (!metricsEnabled) return;
        LatencyHistogram histogram = latencyHistograms.get(operation);
        if (histogram != null) {
            histogram.record(durationMs);
        }
        METRICS_LOG.debug("latency operation={} duration_ms={}", operation, durationMs);
    }

    /**
     * Execute a timed operation.
     * @param operation Operation name for metrics
     * @param supplier Operation to execute
     * @return Result of the operation
     */
    public <T> T timed(String operation, Supplier<T> supplier) {
        Timer timer = startTimer(operation);
        try {
            return supplier.get();
        } finally {
            timer.stop();
        }
    }

    // ==================== TRACING METHODS ====================

    /**
     * Start a new trace span.
     * @param spanName Name of the span
     * @return TraceContext for the span
     */
    public TraceContext startSpan(String spanName) {
        if (!tracingEnabled) {
            return new TraceContext(spanName, null, false);
        }

        TraceContext parentContext = currentTrace.get();
        TraceContext context = new TraceContext(spanName, parentContext, true);
        currentTrace.set(context);

        TRACE_LOG.debug("span_start name={} trace_id={} span_id={} parent_span_id={}",
            spanName, context.getTraceId(), context.getSpanId(),
            parentContext != null ? parentContext.getSpanId() : "root");

        return context;
    }

    /**
     * End the current trace span.
     * @param context The trace context to end
     */
    public void endSpan(TraceContext context) {
        if (!tracingEnabled || context == null || !context.isActive()) return;

        context.end();
        TraceContext parent = context.getParent();
        currentTrace.set(parent);

        TRACE_LOG.debug("span_end name={} trace_id={} span_id={} duration_ms={}",
            context.getSpanName(), context.getTraceId(), context.getSpanId(), context.getDurationMs());
    }

    /**
     * Add an event to the current span.
     * @param eventName Name of the event
     * @param attributes Event attributes
     */
    public void addSpanEvent(String eventName, Map<String, String> attributes) {
        if (!tracingEnabled) return;
        TraceContext context = currentTrace.get();
        if (context != null) {
            context.addEvent(eventName, attributes);
            TRACE_LOG.debug("span_event name={} trace_id={} span_id={} event={} attributes={}",
                context.getSpanName(), context.getTraceId(), context.getSpanId(), eventName, attributes);
        }
    }

    /**
     * Set an attribute on the current span.
     * @param key Attribute key
     * @param value Attribute value
     */
    public void setSpanAttribute(String key, String value) {
        if (!tracingEnabled) return;
        TraceContext context = currentTrace.get();
        if (context != null) {
            context.setAttribute(key, value);
        }
    }

    /**
     * Get the current trace context.
     * @return Current TraceContext or null if none active
     */
    public TraceContext getCurrentTrace() {
        return currentTrace.get();
    }

    // ==================== METRICS EXPORT ====================

    /**
     * Get all metrics in Prometheus exposition format.
     * @return Prometheus-formatted metrics string
     */
    public String getPrometheusMetrics() {
        StringBuilder sb = new StringBuilder();

        // Counters
        appendCounter(sb, "webmcp_component_detections_total", "Total component detections", componentDetectionCount.sum());
        appendCounter(sb, "webmcp_form_submissions_total", "Total form submissions", formSubmissionCount.sum());
        appendCounter(sb, "webmcp_form_submission_errors_total", "Total form submission errors", formSubmissionErrorCount.sum());
        appendCounter(sb, "webmcp_search_requests_total", "Total search requests", searchRequestCount.sum());
        appendCounter(sb, "webmcp_cart_operations_total", "Total cart operations", cartOperationCount.sum());
        appendCounter(sb, "webmcp_ai_interactions_total", "Total AI interactions", aiInteractionCount.sum());
        appendCounter(sb, "webmcp_ai_function_calls_total", "Total AI function calls", aiFunctionCallCount.sum());
        appendCounter(sb, "webmcp_content_fragment_fetches_total", "Total Content Fragment fetches", contentFragmentFetchCount.sum());
        appendCounter(sb, "webmcp_content_fragment_errors_total", "Total Content Fragment errors", contentFragmentErrorCount.sum());
        appendCounter(sb, "webmcp_rate_limit_hits_total", "Total rate limit hits", rateLimitHitCount.sum());
        appendCounter(sb, "webmcp_csrf_failures_total", "Total CSRF validation failures", csrfValidationFailCount.sum());
        appendCounter(sb, "webmcp_consent_granted_total", "Total consent grants", consentGrantedCount.sum());
        appendCounter(sb, "webmcp_consent_denied_total", "Total consent denials", consentDeniedCount.sum());

        // Gauges
        appendGauge(sb, "webmcp_active_cart_sessions", "Active cart sessions", activeCartSessions.get());
        appendGauge(sb, "webmcp_active_chat_sessions", "Active chat sessions", activeChatSessions.get());
        appendGauge(sb, "webmcp_pending_ai_requests", "Pending AI requests", pendingAIRequests.get());

        // Histograms
        for (LatencyHistogram histogram : latencyHistograms.values()) {
            histogram.appendPrometheus(sb);
        }

        return sb.toString();
    }

    /**
     * Get metrics summary as a map for JSON serialization.
     * @return Map of metric names to values
     */
    public Map<String, Object> getMetricsSummary() {
        Map<String, Object> metrics = new ConcurrentHashMap<>();

        // Counters
        metrics.put("componentDetections", componentDetectionCount.sum());
        metrics.put("formSubmissions", formSubmissionCount.sum());
        metrics.put("formSubmissionErrors", formSubmissionErrorCount.sum());
        metrics.put("searchRequests", searchRequestCount.sum());
        metrics.put("cartOperations", cartOperationCount.sum());
        metrics.put("aiInteractions", aiInteractionCount.sum());
        metrics.put("aiFunctionCalls", aiFunctionCallCount.sum());
        metrics.put("contentFragmentFetches", contentFragmentFetchCount.sum());
        metrics.put("contentFragmentErrors", contentFragmentErrorCount.sum());
        metrics.put("rateLimitHits", rateLimitHitCount.sum());
        metrics.put("csrfFailures", csrfValidationFailCount.sum());
        metrics.put("consentGranted", consentGrantedCount.sum());
        metrics.put("consentDenied", consentDeniedCount.sum());

        // Gauges
        metrics.put("activeCartSessions", activeCartSessions.get());
        metrics.put("activeChatSessions", activeChatSessions.get());
        metrics.put("pendingAIRequests", pendingAIRequests.get());

        // Histogram summaries
        Map<String, Object> latencies = new ConcurrentHashMap<>();
        for (Map.Entry<String, LatencyHistogram> entry : latencyHistograms.entrySet()) {
            latencies.put(entry.getKey(), entry.getValue().getSummary());
        }
        metrics.put("latencies", latencies);

        return metrics;
    }

    // ==================== HELPER CLASSES ====================

    /**
     * Timer for measuring operation latency.
     */
    public static class Timer {
        private final String operation;
        private final WebMCPMetricsService metrics;
        private final Instant startTime;
        private boolean stopped = false;

        Timer(String operation, WebMCPMetricsService metrics) {
            this.operation = operation;
            this.metrics = metrics;
            this.startTime = Instant.now();
        }

        /**
         * Stop the timer and record the measurement.
         * @return Duration in milliseconds
         */
        public long stop() {
            if (stopped) return 0;
            stopped = true;
            long durationMs = Duration.between(startTime, Instant.now()).toMillis();
            metrics.recordLatency(operation, durationMs);
            return durationMs;
        }
    }

    /**
     * Trace context for distributed tracing.
     */
    public static class TraceContext {
        private final String spanName;
        private final String traceId;
        private final String spanId;
        private final TraceContext parent;
        private final Instant startTime;
        private final boolean active;
        private final Map<String, String> attributes = new ConcurrentHashMap<>();
        private Instant endTime;

        TraceContext(String spanName, TraceContext parent, boolean active) {
            this.spanName = spanName;
            this.parent = parent;
            this.active = active;
            this.startTime = Instant.now();
            this.traceId = parent != null ? parent.getTraceId() : generateId();
            this.spanId = generateId();
        }

        private static String generateId() {
            return Long.toHexString(System.nanoTime()) + Long.toHexString((long)(Math.random() * Long.MAX_VALUE));
        }

        public String getSpanName() { return spanName; }
        public String getTraceId() { return traceId; }
        public String getSpanId() { return spanId; }
        public TraceContext getParent() { return parent; }
        public boolean isActive() { return active && endTime == null; }

        public void setAttribute(String key, String value) {
            attributes.put(key, value);
        }

        public void addEvent(String eventName, Map<String, String> eventAttributes) {
            // Events could be stored in a list, simplified here
        }

        public void end() {
            this.endTime = Instant.now();
        }

        public long getDurationMs() {
            Instant end = endTime != null ? endTime : Instant.now();
            return Duration.between(startTime, end).toMillis();
        }
    }

    /**
     * Latency histogram for tracking response time distributions.
     */
    private static class LatencyHistogram {
        private final String name;
        private final long[] buckets;
        private final LongAdder[] bucketCounts;
        private final LongAdder totalCount = new LongAdder();
        private final LongAdder totalSum = new LongAdder();

        LatencyHistogram(String name, long[] buckets) {
            this.name = name;
            this.buckets = buckets;
            this.bucketCounts = new LongAdder[buckets.length + 1]; // +1 for +Inf bucket
            for (int i = 0; i < bucketCounts.length; i++) {
                bucketCounts[i] = new LongAdder();
            }
        }

        void record(long valueMs) {
            totalCount.increment();
            totalSum.add(valueMs);

            for (int i = 0; i < buckets.length; i++) {
                if (valueMs <= buckets[i]) {
                    bucketCounts[i].increment();
                    return;
                }
            }
            bucketCounts[buckets.length].increment(); // +Inf bucket
        }

        void appendPrometheus(StringBuilder sb) {
            String metricName = "webmcp_" + name + "_latency_ms";
            sb.append("# HELP ").append(metricName).append(" Latency histogram for ").append(name).append("\n");
            sb.append("# TYPE ").append(metricName).append(" histogram\n");

            long cumulative = 0;
            for (int i = 0; i < buckets.length; i++) {
                cumulative += bucketCounts[i].sum();
                sb.append(metricName).append("_bucket{le=\"").append(buckets[i]).append("\"} ").append(cumulative).append("\n");
            }
            cumulative += bucketCounts[buckets.length].sum();
            sb.append(metricName).append("_bucket{le=\"+Inf\"} ").append(cumulative).append("\n");
            sb.append(metricName).append("_sum ").append(totalSum.sum()).append("\n");
            sb.append(metricName).append("_count ").append(totalCount.sum()).append("\n");
        }

        Map<String, Object> getSummary() {
            Map<String, Object> summary = new ConcurrentHashMap<>();
            summary.put("count", totalCount.sum());
            summary.put("sum", totalSum.sum());
            if (totalCount.sum() > 0) {
                summary.put("avg", (double) totalSum.sum() / totalCount.sum());
            }
            return summary;
        }
    }

    // ==================== PRIVATE HELPERS ====================

    private void appendCounter(StringBuilder sb, String name, String help, long value) {
        sb.append("# HELP ").append(name).append(" ").append(help).append("\n");
        sb.append("# TYPE ").append(name).append(" counter\n");
        sb.append(name).append(" ").append(value).append("\n");
    }

    private void appendGauge(StringBuilder sb, String name, String help, long value) {
        sb.append("# HELP ").append(name).append(" ").append(help).append("\n");
        sb.append("# TYPE ").append(name).append(" gauge\n");
        sb.append(name).append(" ").append(value).append("\n");
    }

    private String maskIp(String ip) {
        if (ip == null) return "unknown";
        int lastDot = ip.lastIndexOf('.');
        if (lastDot > 0) {
            return ip.substring(0, lastDot) + ".xxx";
        }
        return "masked";
    }
}
