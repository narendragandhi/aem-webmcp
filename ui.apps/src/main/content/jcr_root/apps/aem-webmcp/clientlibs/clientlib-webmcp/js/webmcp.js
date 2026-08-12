/**
 * AEM WebMCP Auto-Enhancer — Core Module
 *
 * W3C WebMCP CG-DRAFT (21 July 2026) compliant.
 * Uses registerTool() / getTools() / ontoolchange only.
 * (provideContext removed from spec March 2026)
 *
 * Depends on: webmcp-config.js (component mappings, tool lists)
 *             webmcp-helpers.js (DOM helpers, enrichment)
 *
 * Version: 2.1.0
 */

(function (document, window) {
    'use strict';

    var A = window.AEMWebMCPAutomator || {};

    A.version = '2.1.0';
    A.debug = window.WEBMCP_DEBUG || false;
    A.enabled = window.WEBMCP_ENABLED !== false;
    A.consentGiven = window.WEBMCP_CONSENT === true;

    /** Internal registry of currently registered tool names. */
    A._registeredTools = new Map();

    /** Health: tracks registration outcomes for observability. */
    A._health = { registered: 0, failed: 0, skipped: 0, lastError: null };

    // ==================== MODEL CONTEXT ACCESSOR ====================
    // Spec §4.1: modelContext lives on Document.
    // Chrome/Edge origin trials ship it on Navigator — try both.

    A._getModelContext = function () {
        return (typeof document !== 'undefined' && document.modelContext) ||
               (typeof navigator !== 'undefined' && navigator.modelContext) ||
               null;
    };

    // ==================== TOOL NAME VALIDATION (spec §4.2) ====================

    A._isValidToolName = function (name) {
        return typeof name === 'string' &&
               name.length >= 1 &&
               name.length <= 128 &&
               /^[a-zA-Z0-9_\-.]+$/.test(name);
    };

    // ==================== SCHEMA CONVERSION ====================

    A.toInputSchema = function (parameters) {
        var properties = {};
        Object.entries(parameters || {}).forEach(function (entry) {
            var key = entry[0], def = entry[1];
            properties[key] = { type: def.type || 'string', description: def.description || '' };
        });
        return { type: 'object', properties: properties };
    };

    A.toModelContextTool = function (id, action) {
        var readOnly = A.READ_ONLY_TOOLS.indexOf(id) !== -1;
        var untrusted = A.UNTRUSTED_TOOLS.indexOf(id) !== -1;
        return {
            name: id,
            title: action.name,
            description: action.description,
            inputSchema: A.toInputSchema(action.parameters),
            annotations: { readOnlyHint: readOnly, untrustedContentHint: untrusted },
            execute: async function (input) {
                if (!readOnly) {
                    var allowed = await A.ensureAgentConsent();
                    if (!allowed) {
                        return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'User consent required' }) }] };
                    }
                }
                var result = await action.execute(input);
                return { content: [{ type: 'text', text: JSON.stringify(result) }] };
            }
        };
    };

    // ==================== CONSENT ====================

    A.canExposeAPI = function () {
        if (A.consentGiven) return true;
        if (window.WEBMCP_AUTO_CONSENT === true) {
            A.consentGiven = true;
            return true;
        }
        return false;
    };

    A.ensureAgentConsent = async function () {
        if (A.consentGiven || window.WEBMCP_AUTO_CONSENT === true || window.AEM_WEBMCP_CONSENT === true) {
            A.consentGiven = true;
            return true;
        }
        var mc = A._getModelContext();
        if (mc && typeof mc.requestUserInteraction === 'function') {
            try {
                var granted = await mc.requestUserInteraction();
                A.consentGiven = granted !== false;
                return A.consentGiven;
            } catch (e) {
                return false;
            }
        }
        return false;
    };

    // ==================== TOOL REGISTRATION ====================

    /**
     * Register tools with the browser's ModelContext (spec §4.2).
     * Each tool gets its own AbortController for clean teardown.
     *
     * Health stats are available on A._health:
     *   { registered, failed, skipped, lastError }
     */
    A.registerNativeTools = function (actions) {
        var mc = A._getModelContext();
        if (!mc) return;

        var tools = Object.entries(actions).map(function (entry) {
            return A.toModelContextTool(entry[0], entry[1]);
        });

        tools.forEach(function (tool) {
            if (!A._isValidToolName(tool.name)) {
                A.debug && console.warn('[WebMCP] Skipping tool with invalid name:', tool.name);
                A._health.skipped++;
                return;
            }

            try {
                if (typeof mc.registerTool === 'function') {
                    var controller = new AbortController();
                    mc.registerTool(tool, { signal: controller.signal })
                        .then(function () {
                            A._registeredTools.set(tool.name, { tool: tool, controller: controller });
                            A._health.registered++;
                            A.debug && console.log('[WebMCP] Registered tool:', tool.name);
                        })
                        .catch(function (e) {
                            A._health.failed++;
                            A._health.lastError = { tool: tool.name, error: String(e) };
                            A.debug && console.warn('[WebMCP] registerTool failed for', tool.name, ':', e);
                        });
                } else if (typeof mc.register === 'function') {
                    mc.register([tool]);
                    A._registeredTools.set(tool.name, { tool: tool, controller: null });
                    A._health.registered++;
                } else if (typeof mc.declareAction === 'function') {
                    mc.declareAction({ id: tool.name, name: tool.title, description: tool.description, parameters: tool.inputSchema.properties });
                    A._registeredTools.set(tool.name, { tool: tool, controller: null });
                    A._health.registered++;
                }
            } catch (e) {
                A._health.failed++;
                A._health.lastError = { tool: tool.name, error: String(e) };
                A.debug && console.warn('[WebMCP] Native tool registration failed:', e);
            }
        });

        A.debug && console.log('[WebMCP] Registered', A._health.registered, 'tools,', A._health.failed, 'failed,', A._health.skipped, 'skipped');
    };

    /**
     * Register a tool at runtime (used by component agents).
     * Returns { tool, unregister } where unregister() tears down the AbortController.
     */
    A.registerTool = function (definition, handler) {
        var action = {
            name: definition.title || definition.name,
            description: definition.description,
            parameters: definition.parameters,
            execute: handler
        };
        var tool = A.toModelContextTool(definition.name, action);
        if (definition.inputSchema) tool.inputSchema = definition.inputSchema;

        if (!A._isValidToolName(tool.name)) {
            A.debug && console.warn('[WebMCP] Cannot register tool with invalid name:', tool.name);
            return null;
        }

        var mc = A._getModelContext();
        var unregister = function () {};

        if (mc) {
            try {
                if (typeof mc.registerTool === 'function') {
                    var controller = new AbortController();
                    mc.registerTool(tool, { signal: controller.signal }).then(function () {
                        A._registeredTools.set(tool.name, { tool: tool, controller: controller });
                    }).catch(function (e) {
                        A.debug && console.warn('[WebMCP] Could not register tool:', definition.name, e);
                    });
                    unregister = function () { controller.abort(); A._registeredTools.delete(tool.name); };
                } else if (typeof mc.register === 'function') {
                    mc.register([tool]);
                    A._registeredTools.set(tool.name, { tool: tool, controller: null });
                    unregister = function () { try { mc.unregisterTool && mc.unregisterTool(tool.name); } catch (e) {} A._registeredTools.delete(tool.name); };
                }
            } catch (e) {
                A.debug && console.warn('[WebMCP] Could not register tool:', definition.name, e);
            }
        }

        return { tool: tool, unregister: unregister };
    };

    /**
     * Retrieve currently registered tools (spec §4.2.3).
     * Delegates to native getTools() when available; falls back to internal map.
     */
    A.getTools = async function (options) {
        var mc = A._getModelContext();
        if (mc && typeof mc.getTools === 'function') {
            return mc.getTools(options || {});
        }
        var result = [];
        A._registeredTools.forEach(function (entry) {
            result.push({
                name: entry.tool.name,
                title: entry.tool.title,
                description: entry.tool.description,
                inputSchema: entry.tool.inputSchema,
                annotations: entry.tool.annotations
            });
        });
        return result;
    };

    /**
     * Unregister a tool by name.
     * Uses AbortController when available; otherwise calls native unregisterTool.
     */
    A.unregisterTool = function (name) {
        var entry = A._registeredTools.get(name);
        if (!entry) return;

        if (entry.controller) {
            entry.controller.abort();
        } else {
            var mc = A._getModelContext();
            if (mc && typeof mc.unregisterTool === 'function') {
                mc.unregisterTool(name);
            }
        }
        A._registeredTools.delete(name);
        A.debug && console.log('[WebMCP] Unregistered tool:', name);
    };

    // ==================== API SUPPORT ====================

    A.isWebMCPSupported = function () {
        return A._getModelContext() !== null;
    };

    /**
     * Build the window.AEMWebMCP global with consent-gated action wrappers
     * and the consent UI (Shadow DOM bar).
     */
    A.exposeWebMCPAPI = function () {
        var self = A;

        // Action definitions
        var actions = {
            getPageInfo: { name: 'Get Page Info', description: 'Get current page information including title, URL, and component count', execute: function () { return self.getPageInfo(); } },
            getComponents: { name: 'Get Components', description: 'Get all interactive components on the page', parameters: { category: { type: 'string', description: 'Filter by category' } }, execute: function (params) { return self.getAllComponents(params && params.category); } },
            findComponent: { name: 'Find Component', description: 'Find a component by action type', parameters: { type: { type: 'string', description: 'Component action type (e.g., search, form, accordion)' }, index: { type: 'integer', description: 'Index if multiple components of same type' } }, execute: function (params) { return self.findComponent(params && params.type, (params && params.index) || 0); } },
            findComponentsByCategory: { name: 'Find Components By Category', description: 'Find all components in a category', parameters: { category: { type: 'string', description: 'Category (commerce, navigation, content, layout, form, media, experience)' } }, execute: function (params) { return self.getAllComponents(params && params.category); } },
            interactComponent: { name: 'Interact with Component', description: 'Perform an action on a component', parameters: { selector: { type: 'string', description: 'CSS selector of the component' }, action: { type: 'string', description: 'Action to perform (click, expand, collapse, select-tab, next, prev, etc.)' }, options: { type: 'object', description: 'Additional options (e.g., { index: 0 })' } }, execute: function (params) { return self.interactComponent(params && params.selector, params && params.action, params && params.options); } },
            fillForm: { name: 'Fill Form Field', description: 'Fill a form field with a value', parameters: { selector: { type: 'string', description: 'CSS selector for input' }, value: { type: 'string', description: 'Value to fill' } }, execute: function (params) { return self.fillFormField(params && params.selector, params && params.value); } },
            submitForm: { name: 'Submit Form', description: 'Submit a form', parameters: { selector: { type: 'string', description: 'CSS selector for form' } }, execute: function (params) { return self.submitForm(params && params.selector); } },
            getFormFields: { name: 'Get Form Fields', description: 'Get all fields in a form', parameters: { selector: { type: 'string', description: 'CSS selector for form' } }, execute: function (params) { return self.getFormFields(params && params.selector); } },
            navigate: { name: 'Navigate', description: 'Navigate to a URL', parameters: { url: { type: 'string', description: 'Target URL' } }, execute: function (params) { window.location.href = params && params.url; return { success: true, url: params && params.url }; } },
            clickElement: { name: 'Click Element', description: 'Click an element by selector', parameters: { selector: { type: 'string', description: 'CSS selector' } }, execute: function (params) { return self.interactComponent(params && params.selector, 'click'); } },
            search: { name: 'Search', description: 'Perform a site search', parameters: { query: { type: 'string', description: 'Search query' } }, execute: function (params) { return self.performSearch(params && params.query); } },
            getSearchResults: { name: 'Get Search Results', description: 'Get current search results if available', execute: function () { return self.getSearchResults(); } },
            addToCart: { name: 'Add to Cart', description: 'Add a product to shopping cart', parameters: { productSelector: { type: 'string', description: 'CSS selector for product' }, quantity: { type: 'integer', description: 'Quantity to add' } }, execute: function (params) { return self.addToCart(params && params.productSelector, (params && params.quantity) || 1); } },
            updateCartQuantity: { name: 'Update Cart Quantity', description: 'Update item quantity in cart', parameters: { itemSelector: { type: 'string', description: 'CSS selector for cart item' }, quantity: { type: 'integer', description: 'New quantity' } }, execute: function (params) { return self.updateCartQuantity(params && params.itemSelector, params && params.quantity); } },
            expandAccordion: { name: 'Expand Accordion', description: 'Expand an accordion item', parameters: { selector: { type: 'string', description: 'CSS selector for accordion' } }, execute: function (params) { return self.interactComponent(params && params.selector, 'expand'); } },
            collapseAccordion: { name: 'Collapse Accordion', description: 'Collapse an accordion item', parameters: { selector: { type: 'string', description: 'CSS selector for accordion' } }, execute: function (params) { return self.interactComponent(params && params.selector, 'collapse'); } },
            selectTab: { name: 'Select Tab', description: 'Switch to a specific tab', parameters: { selector: { type: 'string', description: 'CSS selector for tabs' }, index: { type: 'integer', description: 'Tab index (0-based)' } }, execute: function (params) { return self.interactComponent(params && params.selector, 'select-tab', { index: (params && params.index) || 0 }); } },
            carouselNext: { name: 'Carousel Next', description: 'Go to next slide in carousel', parameters: { selector: { type: 'string', description: 'CSS selector for carousel' } }, execute: function (params) { return self.interactComponent(params && params.selector, 'next'); } },
            carouselPrev: { name: 'Carousel Previous', description: 'Go to previous slide in carousel', parameters: { selector: { type: 'string', description: 'CSS selector for carousel' } }, execute: function (params) { return self.interactComponent(params && params.selector, 'prev'); } },
            goToSlide: { name: 'Go To Slide', description: 'Jump to specific carousel slide', parameters: { selector: { type: 'string', description: 'CSS selector for carousel' }, index: { type: 'integer', description: 'Slide index (0-based)' } }, execute: function (params) { return self.interactComponent(params && params.selector, 'go-to-slide', { index: (params && params.index) || 0 }); } },
            getElementInfo: { name: 'Get Element Info', description: 'Get detailed information about an element', parameters: { selector: { type: 'string', description: 'CSS selector' } }, execute: function (params) { return self.getElementInfo(params && params.selector); } },
            waitForElement: { name: 'Wait For Element', description: 'Wait for an element to appear', parameters: { selector: { type: 'string', description: 'CSS selector' }, timeout: { type: 'integer', description: 'Timeout in ms (default: 5000)' } }, execute: function (params) { return self.waitForElement(params && params.selector, (params && params.timeout) || 5000); } },
            getPageScreenshot: { name: 'Get Page Screenshot', description: 'Get base64 screenshot of page (for vision-enabled agents)', execute: function () { return self.getPageScreenshot(); } },
            getAccessibilityTree: { name: 'Get Accessibility Tree', description: 'Get accessibility tree for screen reader/AI', execute: function () { return self.getAccessibilityTree(); } },
            speakText: { name: 'Speak Text', description: 'Read text aloud using speech synthesis', parameters: { text: { type: 'string', description: 'Text to speak' } }, execute: function (params) { self.speakText(params && params.text); return { success: true }; } }
        };

        // Always register with the browser — consent enforced at execution time
        self.registerNativeTools(actions);

        // Expose global API with consent gate
        window.AEMWebMCP = {
            version: self.version,
            consented: !!window.AEM_WEBMCP_CONSENT,

            _checkConsent: function () {
                if (this.consented || window.AEM_WEBMCP_CONSENT === true) {
                    this.consented = true;
                    return true;
                }
                this._showConsentUI();
                return false;
            },

            _showConsentUI: function () {
                if (document.getElementById('webmcp-consent-wrapper')) return;

                var host = document.createElement('div');
                host.id = 'webmcp-consent-wrapper';
                document.body.appendChild(host);

                var shadow = host.attachShadow({ mode: 'open' });

                var style = document.createElement('style');
                style.textContent = '\
                    :host { font-family: system-ui, -apple-system, sans-serif; }\
                    #bar {\
                        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(150%);\
                        width: 90%; max-width: 600px; background: rgba(255, 255, 255, 0.8);\
                        backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3);\
                        border-radius: 16px; padding: 16px 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);\
                        display: flex; align-items: center; justify-content: space-between; transition: transform 0.5s ease;\
                    }\
                    #bar.visible { transform: translateX(-50%) translateY(0); }\
                    .message { font-size: 14px; color: #1f2937; }\
                    .actions { display: flex; gap: 12px; }\
                    button { padding: 8px 16px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; }\
                    .btn-allow { background: #6366f1; color: white; }\
                    .btn-deny { background: transparent; color: #6b7280; }\
                ';

                var bar = document.createElement('div');
                bar.id = 'bar';
                bar.innerHTML = '\
                    <div class="message"><b>AI Assistant</b> wants to help you with this page.</div>\
                    <div class="actions">\
                        <button class="btn-deny">Not now</button>\
                        <button class="btn-allow">Allow Access</button>\
                    </div>\
                ';

                shadow.appendChild(style);
                shadow.appendChild(bar);

                setTimeout(function () { bar.classList.add('visible'); }, 100);

                bar.querySelector('.btn-allow').onclick = function () {
                    window.AEMWebMCP.consented = true;
                    bar.classList.remove('visible');
                    setTimeout(function () { host.remove(); }, 500);
                };

                bar.querySelector('.btn-deny').onclick = function () {
                    bar.classList.remove('visible');
                    setTimeout(function () { host.remove(); }, 500);
                };
            },

            // Wrap all actions with consent check
            getPageInfo: function () { return window.AEMWebMCP._checkConsent() ? self.getPageInfo() : { error: 'Consent required' }; },
            getPageScreenshot: function () { return window.AEMWebMCP._checkConsent() ? self.getPageScreenshot() : Promise.resolve({ error: 'Consent required' }); }
        };

        // Wrap remaining actions
        ['getComponents', 'findComponent', 'findComponentsByCategory', 'interactComponent', 'fillForm', 'submitForm', 'getFormFields', 'clickElement', 'search', 'getSearchResults', 'addToCart', 'updateCartQuantity', 'expandAccordion', 'collapseAccordion', 'selectTab', 'carouselNext', 'carouselPrev', 'goToSlide', 'getElementInfo', 'waitForElement', 'getAccessibilityTree', 'speakText'].forEach(function (id) {
            var action = actions[id];
            if (!action) return;
            window.AEMWebMCP[id] = function () {
                if (window.AEMWebMCP._checkConsent()) {
                    return action.execute.apply(self, arguments);
                }
                return { success: false, error: 'User consent required' };
            };
        });

        window.AEMWebMCP.navigate = function (u) { return window.AEMWebMCP._checkConsent() ? (window.location.href = u) : { error: 'Consent required' }; };
        window.AEMWebMCP.interact = function (s, a, o) { return window.AEMWebMCP._checkConsent() ? self.interactComponent(s, a, o) : { error: 'Consent required' }; };
        window.AEMWebMCP.addToCart = function (s, q) { return window.AEMWebMCP._checkConsent() ? self.addToCart(s, q) : { error: 'Consent required' }; };
    };

    // ==================== DEBUG PANEL ====================

    A.createDebugPanel = function () {
        if (document.getElementById('webmcp-debug-panel')) return;

        var panel = document.createElement('div');
        panel.id = 'webmcp-debug-panel';
        panel.innerHTML = '\
            <style>\
                #webmcp-debug-panel {\
                    position: fixed; bottom: 10px; right: 10px; width: 350px; max-height: 400px;\
                    background: #1a1a2e; color: #eee; font-family: monospace; font-size: 12px;\
                    padding: 15px; border-radius: 8px; z-index: 999999; box-shadow: 0 4px 20px rgba(0,0,0,0.5);\
                    overflow: auto;\
                }\
                #webmcp-debug-panel h3 { margin: 0 0 10px 0; color: #00d9ff; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px; }\
                #webmcp-debug-panel .webmcp-stat { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #333; }\
                #webmcp-debug-panel .webmcp-stat-label { color: #888; }\
                #webmcp-debug-panel .webmcp-stat-value { color: #00ff88; }\
                #webmcp-debug-panel .webmcp-components { margin-top: 10px; max-height: 250px; overflow: auto; }\
                #webmcp-debug-panel .webmcp-comp-item { padding: 4px 8px; margin: 2px 0; background: #16213e; border-radius: 4px; font-size: 11px; }\
                #webmcp-debug-panel .webmcp-comp-category { color: #ff6b6b; }\
                #webmcp-debug-panel .webmcp-comp-action { color: #4ecdc4; }\
                #webmcp-debug-panel .webmcp-comp-desc { color: #aaa; font-size: 10px; }\
                #webmcp-debug-panel .close-btn { position: absolute; top: 5px; right: 10px; cursor: pointer; color: #666; }\
            </style>\
            <span class="close-btn" onclick="this.parentElement.remove()">&#10005;</span>\
            <h3>&#129302; AEM WebMCP Debug</h3>\
            <div class="webmcp-stats"></div>\
            <div class="webmcp-components"></div>\
        ';
        document.body.appendChild(panel);

        var components = A.getAllComponents();
        var categories = {};
        components.forEach(function (c) { categories[c.category] = (categories[c.category] || 0) + 1; });

        var stats = panel.querySelector('.webmcp-stats');
        stats.innerHTML = '\
            <div class="webmcp-stat"><span class="webmcp-stat-label">Total Components</span><span class="webmcp-stat-value">' + components.length + '</span></div>\
            <div class="webmcp-stat"><span class="webmcp-stat-label">Categories</span><span class="webmcp-stat-value">' + Object.keys(categories).length + '</span></div>\
            ' + Object.keys(categories).map(function (cat) {
            return '<div class="webmcp-stat"><span class="webmcp-stat-label">' + cat + '</span><span class="webmcp-stat-value">' + categories[cat] + '</span></div>';
        }).join('') + '\
        ';

        var compList = panel.querySelector('.webmcp-components');
        compList.innerHTML = components.map(function (c) {
            return '<div class="webmcp-comp-item"><span class="webmcp-comp-category">[' + c.category + ']</span> <span class="webmcp-comp-action">' + c.action + '</span><div class="webmcp-comp-desc">' + (c.description || '') + '</div></div>';
        }).join('');
    };

    // ==================== INIT ====================

    A.init = function () {
        if (!A.enabled) {
            A.debug && console.log('[WebMCP] Disabled via WEBMCP_ENABLED flag');
            return;
        }

        A.debug && console.log('[WebMCP] Initializing AEM WebMCP Automator v' + A.version);

        A.exposeWebMCPAPI();
        A.enhanceAllComponents();

        if (A.debug || window.WEBMCP_SHOW_PANEL) {
            A.createDebugPanel();
        }

        A.debug && console.log('[WebMCP] Ready - enhanced',
            document.querySelectorAll('[data-webmcp-action]').length, 'components');
    };

    // ==================== BOOT ====================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { A.init(); });
    } else {
        A.init();
    }

    window.AEMWebMCPAutomator = A;

})(document, window);
