/**
 * Narrow unit/demo test double, NOT browser conformance evidence.
 * Implements same-document registration and invocation only.
 * No permission-policy, cross-frame, declarative-form or hosted-agent simulation.
 * Never inject this into a native certification run.
 */
(function () {
    'use strict';
    const tools = new Map();
    const mc = new EventTarget();
    mc.registerTool = async function (tool, options = {}) {
        if (!tool || !/^[a-zA-Z0-9_.-]{1,128}$/.test(tool.name) || typeof tool.execute !== 'function' || !tool.description) {
            throw new TypeError('Invalid tool definition');
        }
        if (options.signal && options.signal.aborted) return;
        if (tools.has(tool.name)) throw new DOMException('Duplicate tool', 'InvalidStateError');
        tools.set(tool.name, tool);
        if (options.signal) options.signal.addEventListener('abort', () => {
            tools.delete(tool.name);
            mc.dispatchEvent(new Event('toolchange'));
        }, { once: true });
        mc.dispatchEvent(new Event('toolchange'));
    };
    mc.getTools = async function () {
        return Array.from(tools.values()).map(({ execute, ...tool }) => ({
            ...tool, origin: window.location.origin, window
        })).sort((a, b) => a.name.localeCompare(b.name));
    };
    mc.executeTool = async function (descriptor, input = {}, options = {}) {
        if (options.signal && options.signal.aborted) throw options.signal.reason;
        const tool = tools.get(descriptor.name);
        if (!tool) throw new DOMException('Tool not found', 'NotFoundError');
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Object input required');
        const signal = options.signal || new AbortController().signal;
        return tool.execute(input, { signal });
    };
    let listener;
    Object.defineProperty(mc, 'ontoolchange', {
        get() { return listener; },
        set(next) {
            if (listener) mc.removeEventListener('toolchange', listener);
            listener = next;
            if (listener) mc.addEventListener('toolchange', listener);
        }
    });
    Object.defineProperty(document, 'modelContext', { value: mc, configurable: true });
    Object.defineProperty(window, '__mcTools', { get: () => tools, configurable: true });
})();
