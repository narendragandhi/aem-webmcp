/**
 * Opt-in JSON form adapter. Both humans and tools use the same submission path.
 * Requires a same-origin endpoint accepting JSON and returning { success: true, ... }.
 * This does not replace Core Forms / Adaptive Forms submit actions.
 */
(function (window, document) {
    'use strict';
    function attach(form) {
        if (form.dataset.webmcpAttached) return;
        var A = window.AEMWebMCPAutomator;
        if (!A || !A.enabled || A.isExcluded(form)) return;
        form.dataset.webmcpAttached = 'true';
        var output = form.querySelector('[role="status"]');
        var active = null;
        var currentController = null;
        var revision = 0;
        var lastSnapshot = JSON.stringify(Object.fromEntries(new FormData(form)));
        function currentRevision() {
            var snapshot = JSON.stringify(Object.fromEntries(new FormData(form)));
            if (snapshot !== lastSnapshot) { revision++; lastSnapshot = snapshot; }
            return revision;
        }

        function show(result) {
            if (output) output.textContent = JSON.stringify(result, null, 2);
            return result;
        }
        async function submit(signal) {
            A.throwIfAborted(signal);
            if (active) return { success: false, error: 'A submission is already in progress' };
            if (!A.enabled || A.isExcluded(form) || !form.reportValidity()) {
                return show({ success: false, error: 'Form is disabled or invalid' });
            }
            active = true;
            try {
                var endpoint = new URL(form.action, window.location.href);
                if (endpoint.origin !== window.location.origin) throw new Error('A same-origin form action is required');
                var payload = Object.fromEntries(new FormData(form));
                var snapshot = JSON.stringify(payload);
                var summary = 'Send this request?\n' + Object.entries(payload).map(function (entry) {
                    return entry[0] + ': ' + entry[1];
                }).join('\n');
                if (!await A.confirmAction(summary, signal)) return show({ success: false, error: 'Submission canceled' });
                A.throwIfAborted(signal);
                if (!form.isConnected || A.isExcluded(form) || !form.reportValidity() ||
                        snapshot !== JSON.stringify(Object.fromEntries(new FormData(form)))) {
                    return show({ success: false, error: 'The form changed. Review it and submit again.' });
                }
                var headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
                // Opt in on authenticated AEM deployments. Granite validates this header.
                if (form.dataset.webmcpCsrf === 'granite') {
                    var tokenResponse = await fetch('/libs/granite/csrf/token.json', { credentials: 'same-origin', signal: signal });
                    if (!tokenResponse.ok) throw new Error('Unable to obtain an AEM CSRF token');
                    var token = await tokenResponse.json();
                    if (!token.token) throw new Error('AEM CSRF token missing');
                    headers['CSRF-Token'] = token.token;
                }
                var response = await fetch(endpoint.href, {
                    method: 'POST', credentials: 'same-origin', headers: headers,
                    body: snapshot, signal: signal
                });
                var result = await response.json();
                if (!response.ok || result.success !== true) throw new Error(result.error || 'Submission was not accepted');
                return show(result);
            } catch (error) {
                if (signal && signal.aborted) {
                    show({ success: false, error: 'Canceled. If sending had begun, verify delivery before retrying.' });
                    throw error;
                }
                return show({ success: false, error: error.message });
            } finally {
                active = null;
            }
        }
        form.webmcpSubmit = submit;

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (active) {
                if (event.agentInvoked && event.respondWith) event.respondWith(Promise.resolve({ success: false, error: 'Submission in progress' }));
                return;
            }
            var controller = new AbortController();
            currentController = controller;
            var promise = submit(controller.signal).catch(function (error) {
                return { success: false, error: error.message };
            }).finally(function () { if (currentController === controller) currentController = null; });
            if (event.agentInvoked && typeof event.respondWith === 'function') event.respondWith(promise);
        });
        form.addEventListener('reset', function () { if (currentController) currentController.abort(); });
        function cancel(event) {
            if (event.toolName === form.getAttribute('toolname') && currentController) currentController.abort();
        }
        window.addEventListener('toolcancel', cancel);
        window.addEventListener('toolcanceled', cancel);
        var button = form.querySelector('[data-cancel-request]');
        if (button) button.addEventListener('click', function () { if (currentController) currentController.abort(); });

        var registration = A.registerTool({
            name: form.dataset.webmcpTool,
            title: 'Send a support request',
            description: 'Fill the visible support form, ask the user to confirm its exact values, and submit. A demo receipt is not a delivered support ticket.',
            inputSchema: {
                type: 'object', additionalProperties: false,
                required: ['fullName', 'email', 'message'],
                properties: {
                    fullName: { type: 'string', minLength: 2, maxLength: 100, description: 'Your full name' },
                    email: { type: 'string', format: 'email', maxLength: 254, description: 'Your reply email' },
                    message: { type: 'string', minLength: 10, maxLength: 5000, description: 'Your support request' },
                    expectedRevision: { type: 'integer', minimum: 0, description: 'Optional revision from inspecting the form; prevents replacing newer human edits' }
                }
            },
            annotations: { readOnlyHint: false, consequentialHint: true, untrustedContentHint: true }
        }, async function (input, options) {
            if (active) return { success: false, error: 'Submission in progress' };
            if (input.expectedRevision !== undefined && (!Number.isInteger(input.expectedRevision) || input.expectedRevision < 0)) {
                return { success: false, error: 'expectedRevision must be a nonnegative integer' };
            }
            if (input.expectedRevision !== undefined && input.expectedRevision !== currentRevision()) {
                return { success: false, error: 'STALE_REVISION', revision: currentRevision() };
            }
            var limits = { fullName: [2, 100], email: [3, 254], message: [10, 5000] };
            if (Object.keys(input).some(function (key) { return key !== 'expectedRevision' && !Object.hasOwn(limits, key); }) ||
                    Object.keys(limits).some(function (key) {
                        return typeof input[key] !== 'string' || input[key].length < limits[key][0] || input[key].length > limits[key][1];
                    })) return { success: false, error: 'Invalid support request fields' };
            A.throwIfAborted(options.signal);
            Object.keys(limits).forEach(function (key) {
                var field = form.elements.namedItem(key);
                field.value = input[key];
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            });
            currentRevision();
            var controller = new AbortController();
            currentController = controller;
            function abort() { controller.abort(options.signal.reason); }
            if (options.signal) options.signal.addEventListener('abort', abort, { once: true });
            try { return await submit(controller.signal); }
            finally {
                if (options.signal) options.signal.removeEventListener('abort', abort);
                if (currentController === controller) currentController = null;
            }
        });
        var inspection = A.registerTool({
            name: 'inspect_' + form.dataset.webmcpTool,
            description: 'Inspect the support form revision and validity before proposing changes. Does not return field values.',
            inputSchema: { type: 'object', properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true }
        }, async function () {
            return { revision: currentRevision(), valid: form.checkValidity(), pending: !!active };
        });
        // The owner must tear down when removing the form in an SPA/editor.
        form.webmcpDestroy = function () {
            if (currentController) currentController.abort();
            if (registration) registration.unregister();
            if (inspection) inspection.unregister();
            window.removeEventListener('toolcancel', cancel);
            window.removeEventListener('toolcanceled', cancel);
        };
    }
    function init() { document.querySelectorAll('form[data-webmcp-json-form]').forEach(attach); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    document.addEventListener('foundation-contentloaded', init);
})(window, document);
