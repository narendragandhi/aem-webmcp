/**
 * AEM WebMCP ↔ SLICC browser bridge.
 *
 * This is deliberately a small, optional adapter. SLICC can inspect the
 * current page and call this API from its browser runtime without needing a
 * server-side MCP endpoint or access to AEM credentials.
 *
 * Security properties:
 * - Only tools registered by AEM WebMCP can be invoked.
 * - Tool execution is delegated to the original WebMCP execute callback.
 * - State-changing tools retain WebMCP's native/page consent gate.
 * - Tool metadata returned to the agent never includes execute callbacks.
 */
(function (window) {
    'use strict';

    var BRIDGE_VERSION = '1.0.0';
    var DEFAULT_TIMEOUT_MS = 10000;
    var FALLBACK_TOOLS = [
        { name: 'getPageInfo', title: 'Get Page Info', description: 'Get current page information', readOnly: true },
        { name: 'getComponents', title: 'Get Components', description: 'Get interactive components on the page', readOnly: true },
        { name: 'findComponent', title: 'Find Component', description: 'Find a component by action type', readOnly: true },
        { name: 'getFormFields', title: 'Get Form Fields', description: 'Get fields in a form', readOnly: true },
        { name: 'getElementInfo', title: 'Get Element Info', description: 'Get information about an element', readOnly: true },
        { name: 'getAccessibilityTree', title: 'Get Accessibility Tree', description: 'Get the page accessibility tree', readOnly: true },
        { name: 'search', title: 'Search', description: 'Perform a site search', readOnly: true },
        { name: 'fillForm', title: 'Fill Form', description: 'Fill a form field', readOnly: false },
        { name: 'submitForm', title: 'Submit Form', description: 'Submit a form', readOnly: false },
        { name: 'clickElement', title: 'Click Element', description: 'Click an element', readOnly: false },
        { name: 'addToCart', title: 'Add to Cart', description: 'Add a product to the cart', readOnly: false },
        { name: 'navigate', title: 'Navigate', description: 'Navigate to a URL', readOnly: false }
    ];

    function getAutomator() {
        return window.AEMWebMCPAutomator || null;
    }

    function errorResult(message) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({ success: false, error: message })
            }],
            isError: true
        };
    }

    function sanitizeTool(tool) {
        return {
            name: tool.name,
            title: tool.title,
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: tool.annotations
        };
    }

    function fallbackTools() {
        return FALLBACK_TOOLS.map(function (definition) {
            return {
                name: definition.name,
                title: definition.title,
                description: definition.description,
                inputSchema: { type: 'object', properties: {} },
                annotations: { readOnlyHint: definition.readOnly }
            };
        });
    }

    function contentResult(value) {
        return {
            content: [{
                type: 'text',
                text: typeof value === 'string' ? value : JSON.stringify(value)
            }]
        };
    }

    var bridge = {
        version: BRIDGE_VERSION,

        isReady: function () {
            var automator = getAutomator();
            return !!(
                (automator && automator._registeredTools && automator._registeredTools.size > 0) ||
                (window.AEMWebMCP && typeof window.AEMWebMCP.getPageInfo === 'function')
            );
        },

        ready: function (timeoutMs) {
            var timeout = typeof timeoutMs === 'number' ? timeoutMs : DEFAULT_TIMEOUT_MS;
            var started = Date.now();

            return new Promise(function (resolve, reject) {
                function check() {
                    if (bridge.isReady()) {
                        resolve(bridge.listTools());
                        return;
                    }
                    if (Date.now() - started >= timeout) {
                        reject(new Error('AEM WebMCP tools were not registered before the timeout'));
                        return;
                    }
                    window.setTimeout(check, 50);
                }
                check();
            });
        },

        listTools: function () {
            var automator = getAutomator();
            if (!automator || !automator._registeredTools) return [];

            var tools = [];
            automator._registeredTools.forEach(function (entry) {
                if (entry && entry.tool) tools.push(sanitizeTool(entry.tool));
            });
            return tools.length ? tools : fallbackTools();
        },

        callTool: async function (name, input) {
            var automator = getAutomator();
            if (!automator || !automator._registeredTools) {
                return errorResult('AEM WebMCP is not available on this page');
            }

            if (typeof name !== 'string' || !name) {
                return errorResult('A tool name is required');
            }

            var entry = automator._registeredTools.get(name);
            if (entry && entry.tool && typeof entry.tool.execute === 'function') {
                try {
                    return await entry.tool.execute(input && typeof input === 'object' ? input : {});
                } catch (error) {
                    return errorResult(String(error && error.message ? error.message : error));
                }
            }

            // Native WebMCP is not available in every browser. Fall back to
            // the public AEMWebMCP API, whose wrappers retain consent checks.
            var api = window.AEMWebMCP;
            if (!api || typeof api[name] !== 'function') {
                return errorResult('Unknown AEM WebMCP tool: ' + name);
            }

            try {
                var params = input && typeof input === 'object' ? input : {};
                var value;
                if (name === 'navigate') value = api[name](params.url);
                else if (name === 'addToCart') value = api[name](params.productSelector, params.quantity);
                else if (name === 'interact') value = api[name](params.selector, params.action, params.options);
                else value = api[name](params);
                return contentResult(await value);
            } catch (fallbackError) {
                return errorResult(String(fallbackError && fallbackError.message ? fallbackError.message : fallbackError));
            }
        },

        invoke: function (name, input) {
            return bridge.callTool(name, input);
        }
    };

    window.AEMWebMCPSlicc = bridge;
})(window);
