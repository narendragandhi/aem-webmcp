/**
 * Mock of the W3C WebMCP document.modelContext API, matching the CG-DRAFT
 * spec (21 July 2026). Load this BEFORE webmcp.js (e.g. via Playwright
 * addInitScript) to verify that the site registers tools a real browser
 * agent could discover and invoke.
 *
 * Spec interface (§4.2):
 *   interface ModelContext : EventTarget {
 *     Promise<undefined> registerTool(ModelContextTool, optional ModelContextRegisterToolOptions);
 *     Promise<sequence<RegisteredTool>> getTools(optional ModelContextGetToolOptions);
 *     attribute EventHandler ontoolchange;
 *   };
 *
 * Captured state:
 *   window.__mcTools            - tools registered via registerTool()
 *   window.__mcInteractionCalls - number of requestUserInteraction() calls
 */
(function () {
    'use strict';

    const tools = new Map();
    const eventListeners = { toolchange: [] };
    window.__mcInteractionCalls = 0;

    function fireToolChange() {
        const event = new Event('toolchange');
        (eventListeners.toolchange || []).forEach(function(fn) {
            try { fn(event); } catch(e) { console.error('[MockAgent] toolchange handler error:', e); }
        });
    }

    // EventTarget-like interface for ModelContext
    function addEventListener(type, fn) {
        if (!eventListeners[type]) eventListeners[type] = [];
        eventListeners[type].push(fn);
    }
    function removeEventListener(type, fn) {
        if (!eventListeners[type]) return;
        eventListeners[type] = eventListeners[type].filter(function(f) { return f !== fn; });
    }

    const modelContext = {
        // Spec §4.2.2 - registerTool(tool, options)
        registerTool: function (tool, options) {
            // Validate name per spec §4.2: 1-128 chars, ASCII alphanumeric + _ - .
            if (!tool || typeof tool.name !== 'string' || tool.name.length === 0 || tool.name.length > 128) {
                return Promise.reject(new DOMException('Invalid tool name', 'InvalidStateError'));
            }
            if (!/^[a-zA-Z0-9_\-.]+$/.test(tool.name)) {
                return Promise.reject(new DOMException('Invalid tool name characters', 'InvalidStateError'));
            }
            if (tools.has(tool.name)) {
                return Promise.reject(new DOMException('Tool already registered: ' + tool.name, 'InvalidStateError'));
            }
            if (!tool.description || tool.description.length === 0) {
                return Promise.reject(new DOMException('Description is required', 'InvalidStateError'));
            }

            tools.set(tool.name, tool);

            // AbortSignal support (§4.2.2)
            if (options && options.signal) {
                options.signal.addEventListener('abort', function() {
                    tools.delete(tool.name);
                    fireToolChange();
                });
            }

            fireToolChange();
            return Promise.resolve(undefined);
        },

        // Spec §4.2.3 - getTools(options)
        getTools: function (options) {
            var fromOrigins = (options && options.fromOrigins) || [];
            var result = [];
            tools.forEach(function(tool, name) {
                result.push({
                    name: tool.name,
                    title: tool.title || '',
                    description: tool.description,
                    inputSchema: tool.inputSchema ? JSON.stringify(tool.inputSchema) : undefined,
                    annotations: tool.annotations || undefined,
                    window: window,
                    origin: window.location.origin
                });
            });
            // Sort by name per spec §4.2.3 step 4
            result.sort(function(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
            return Promise.resolve(result);
        },

        // Spec §4.4 - ontoolchange event handler
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,

        // Spec §5.2.1 - requestUserInteraction (consent mechanism)
        requestUserInteraction: function () {
            window.__mcInteractionCalls++;
            return Promise.resolve(true); // simulated user approval
        }
    };

    // Expose ontoolchange as event handler IDL attribute (§4.4)
    Object.defineProperty(modelContext, 'ontoolchange', {
        set: function(fn) {
            // Remove old listener if any, set new one
            if (this._ontoolchangeFn) {
                removeEventListener('toolchange', this._ontoolchangeFn);
            }
            this._ontoolchangeFn = fn;
            if (fn) addEventListener('toolchange', fn);
        },
        get: function() {
            return this._ontoolchangeFn || null;
        },
        configurable: true
    });

    // Install on document.modelContext (per spec §4.1, modelContext is on Document)
    // For the mock, we put it on navigator for easy detection.
    Object.defineProperty(window.navigator, 'modelContext', {
        value: modelContext,
        configurable: true
    });

    Object.defineProperty(window, '__mcTools', {
        get: function() { return tools; },
        configurable: true
    });
})();
