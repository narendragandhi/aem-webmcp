/**
 * Mock of the W3C WebMCP navigator.modelContext API, matching the surface
 * that Edge 147 / Chrome 149 (origin trial) expose. Load this BEFORE
 * webmcp.js (e.g. via Playwright addInitScript) to verify that the site
 * registers tools a real browser agent could discover and invoke.
 *
 * Captured state:
 *   window.__mcTools            - tools registered via provideContext/registerTool
 *   window.__mcInteractionCalls - number of requestUserInteraction() calls
 */
(function () {
    'use strict';

    const tools = new Map();
    window.__mcInteractionCalls = 0;

    const modelContext = {
        provideContext: function (context) {
            (context && context.tools ? context.tools : []).forEach(t => tools.set(t.name, t));
        },
        registerTool: function (tool) {
            tools.set(tool.name, tool);
            return Promise.resolve();
        },
        unregisterTool: function (name) {
            tools.delete(name);
        },
        requestUserInteraction: function () {
            window.__mcInteractionCalls++;
            return Promise.resolve(true); // simulated user approval
        }
    };

    Object.defineProperty(window.navigator, 'modelContext', {
        value: modelContext,
        configurable: true
    });

    Object.defineProperty(window, '__mcTools', {
        get: () => tools,
        configurable: true
    });
})();
