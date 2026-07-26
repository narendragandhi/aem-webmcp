/**
 * webmcp.test.js — Direct unit tests for the AEM WebMCP Automator.
 *
 * Loads the three-file module stack (config → helpers → core) and verifies
 * W3C WebMCP CG-DRAFT spec compliance: registerTool shape, getTools,
 * tool name validation, annotations, AbortSignal cleanup,
 * untrustedContentHint, document.modelContext support, health tracking,
 * and that provideContext() is never called.
 */

/* ------------------------------------------------------------------ */
/*  Environment bootstrap                                             */
/* ------------------------------------------------------------------ */

const WEBMCP_BASE = '../src/main/content/jcr_root/apps/aem-webmcp/clientlibs/clientlib-webmcp/js';

let mockMC;
let Automator;

function loadWebMCP() {
    jest.resetModules();

    mockMC = {
        registerTool:         jest.fn().mockResolvedValue(undefined),
        getTools:             jest.fn().mockResolvedValue([]),
        unregisterTool:       jest.fn(),
        addEventListener:     jest.fn(),
        removeEventListener:  jest.fn(),
        requestUserInteraction: jest.fn().mockResolvedValue(true),
    };

    // Put mock on document.modelContext (spec-correct location)
    Object.defineProperty(document, 'modelContext', {
        value: mockMC,
        writable: true,
        configurable: true,
    });
    // Also on navigator for backward-compat code paths
    Object.defineProperty(navigator, 'modelContext', {
        value: mockMC,
        writable: true,
        configurable: true,
    });

    if (!window.SpeechSynthesisUtterance) window.SpeechSynthesisUtterance = class {};
    if (!window.speechSynthesis) window.speechSynthesis = { speak: jest.fn() };
    if (typeof CSS === 'undefined' || !CSS.escape) {
        window.CSS = window.CSS || {};
        window.CSS.escape = (s) => String(s);
    }

    // Load the three-file stack in order
    require(WEBMCP_BASE + '/webmcp-config.js');
    require(WEBMCP_BASE + '/webmcp-helpers.js');
    require(WEBMCP_BASE + '/webmcp.js');
    Automator = window.AEMWebMCPAutomator;
}

/* ================================================================== */
/*  1. Tool name validation (spec §4.2)                               */
/* ================================================================== */
describe('Tool name validation (_isValidToolName)', () => {
    beforeAll(() => loadWebMCP());

    test('accepts simple alphanumeric names', () => {
        expect(Automator._isValidToolName('getPageInfo')).toBe(true);
    });

    test('accepts names with hyphens, underscores, dots', () => {
        expect(Automator._isValidToolName('my-tool')).toBe(true);
        expect(Automator._isValidToolName('my_tool')).toBe(true);
        expect(Automator._isValidToolName('my.tool')).toBe(true);
    });

    test('rejects empty string', () => {
        expect(Automator._isValidToolName('')).toBe(false);
    });

    test('rejects names longer than 128 chars', () => {
        expect(Automator._isValidToolName('a'.repeat(129))).toBe(false);
    });

    test('accepts exactly 128 chars', () => {
        expect(Automator._isValidToolName('a'.repeat(128))).toBe(true);
    });

    test('rejects names with spaces', () => {
        expect(Automator._isValidToolName('my tool')).toBe(false);
    });

    test('rejects names with special characters', () => {
        expect(Automator._isValidToolName('tool@name')).toBe(false);
        expect(Automator._isValidToolName('tool/name')).toBe(false);
        expect(Automator._isValidToolName('tool:name')).toBe(false);
    });

    test('rejects non-string values', () => {
        expect(Automator._isValidToolName(null)).toBe(false);
        expect(Automator._isValidToolName(undefined)).toBe(false);
        expect(Automator._isValidToolName(123)).toBe(false);
    });
});

/* ================================================================== */
/*  2. toInputSchema                                                   */
/* ================================================================== */
describe('toInputSchema', () => {
    beforeAll(() => loadWebMCP());

    test('returns object schema with properties', () => {
        const schema = Automator.toInputSchema({
            query:  { type: 'string', description: 'Search query' },
            limit:  { type: 'integer', description: 'Max results' },
        });
        expect(schema).toEqual({
            type: 'object',
            properties: {
                query:  { type: 'string', description: 'Search query' },
                limit:  { type: 'integer', description: 'Max results' },
            },
        });
    });

    test('returns empty properties for undefined input', () => {
        expect(Automator.toInputSchema(undefined)).toEqual({ type: 'object', properties: {} });
    });

    test('defaults type to string when omitted', () => {
        const schema = Automator.toInputSchema({ foo: { description: 'bar' } });
        expect(schema.properties.foo.type).toBe('string');
    });
});

/* ================================================================== */
/*  3. toModelContextTool                                              */
/* ================================================================== */
describe('toModelContextTool', () => {
    beforeAll(() => loadWebMCP());

    const fakeAction = {
        name: 'Get Page Info',
        description: 'Returns page info',
        parameters: { foo: { type: 'string', description: 'bar' } },
        execute: jest.fn(),
    };

    test('builds spec-compliant tool shape', () => {
        const tool = Automator.toModelContextTool('getPageInfo', fakeAction);
        expect(tool.name).toBe('getPageInfo');
        expect(tool.title).toBe('Get Page Info');
        expect(tool.description).toBe('Returns page info');
        expect(tool.inputSchema).toEqual({
            type: 'object',
            properties: { foo: { type: 'string', description: 'bar' } },
        });
    });

    test('sets readOnlyHint true for READ_ONLY_TOOLS', () => {
        expect(Automator.toModelContextTool('getPageInfo', fakeAction).annotations.readOnlyHint).toBe(true);
    });

    test('sets readOnlyHint false for non-read-only tools', () => {
        expect(Automator.toModelContextTool('fillForm', fakeAction).annotations.readOnlyHint).toBe(false);
    });

    test('sets untrustedContentHint true for UNTRUSTED_TOOLS', () => {
        Automator.UNTRUSTED_TOOLS.forEach(id => {
            expect(Automator.toModelContextTool(id, fakeAction).annotations.untrustedContentHint).toBe(true);
        });
    });

    test('sets untrustedContentHint false for non-untrusted tools', () => {
        expect(Automator.toModelContextTool('getPageInfo', fakeAction).annotations.untrustedContentHint).toBe(false);
    });

    test('execute wraps result in MCP content format', async () => {
        const action = { ...fakeAction, execute: jest.fn().mockResolvedValue({ ok: true }) };
        const result = await Automator.toModelContextTool('test', action).execute({});
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] });
    });

    test('execute skips consent for read-only tools', async () => {
        const action = { ...fakeAction, execute: jest.fn().mockResolvedValue('data') };
        Automator.consentGiven = false;
        window.WEBMCP_AUTO_CONSENT = false;
        const result = await Automator.toModelContextTool('getPageInfo', action).execute({});
        expect(result.content[0].text).toBe('"data"');
    });
});

/* ================================================================== */
/*  4. registerNativeTools                                            */
/* ================================================================== */
describe('registerNativeTools', () => {
    beforeAll(() => loadWebMCP());

    test('calls mc.registerTool for each tool', () => {
        expect(mockMC.registerTool).toHaveBeenCalled();
        expect(mockMC.registerTool.mock.calls.length).toBeGreaterThanOrEqual(10);
    });

    test('each call includes a signal option', () => {
        mockMC.registerTool.mock.calls.forEach(([tool, opts]) => {
            expect(opts).toHaveProperty('signal');
            expect(opts.signal).toBeInstanceOf(AbortSignal);
        });
    });

    test('each tool has spec-compliant shape', () => {
        mockMC.registerTool.mock.calls.forEach(([tool]) => {
            expect(tool).toHaveProperty('name');
            expect(tool).toHaveProperty('title');
            expect(tool).toHaveProperty('description');
            expect(tool).toHaveProperty('inputSchema');
            expect(tool).toHaveProperty('annotations');
            expect(typeof tool.name).toBe('string');
            expect(tool.name.length).toBeGreaterThanOrEqual(1);
            expect(tool.name.length).toBeLessThanOrEqual(128);
            expect(tool.inputSchema).toHaveProperty('type', 'object');
        });
    });

    test('does NOT call provideContext', () => {
        expect(mockMC.provideContext).toBeUndefined();
    });

    test('all tool names are valid', () => {
        mockMC.registerTool.mock.calls.forEach(([tool]) => {
            expect(Automator._isValidToolName(tool.name)).toBe(true);
        });
    });
});

/* ================================================================== */
/*  5. registerTool (runtime API)                                     */
/* ================================================================== */
describe('registerTool (runtime API)', () => {
    beforeAll(() => loadWebMCP());

    beforeEach(() => {
        mockMC.registerTool.mockClear();
        mockMC.registerTool.mockResolvedValue(undefined);
    });

    test('returns { tool, unregister }', () => {
        const result = Automator.registerTool(
            { name: 'custom.action', title: 'Custom', description: 'A custom tool', parameters: {} },
            async () => ({ ok: true })
        );
        expect(result).toHaveProperty('tool');
        expect(result).toHaveProperty('unregister');
        expect(typeof result.unregister).toBe('function');
    });

    test('calls mc.registerTool with signal', async () => {
        Automator.registerTool(
            { name: 'custom.action', title: 'Custom', description: 'A custom tool', parameters: {} },
            async () => ({ ok: true })
        );
        await new Promise(r => setTimeout(r, 10));
        const [tool, opts] = mockMC.registerTool.mock.calls[mockMC.registerTool.mock.calls.length - 1];
        expect(tool.name).toBe('custom.action');
        expect(opts.signal).toBeInstanceOf(AbortSignal);
    });

    test('unregister aborts the AbortController signal', async () => {
        const { unregister } = Automator.registerTool(
            { name: 'abortable.tool', title: 'Abortable', description: 'Test', parameters: {} },
            async () => ({ ok: true })
        );
        await new Promise(r => setTimeout(r, 10));
        const entry = Automator._registeredTools.get('abortable.tool');
        expect(entry).toBeDefined();
        expect(entry.controller).toBeInstanceOf(AbortController);

        unregister();
        expect(entry.controller.signal.aborted).toBe(true);
        expect(Automator._registeredTools.has('abortable.tool')).toBe(false);
    });

    test('returns null for invalid tool names', () => {
        expect(Automator.registerTool(
            { name: 'invalid name!', title: 'Bad', description: 'Has space', parameters: {} },
            async () => ({})
        )).toBeNull();
    });

    test('overrides inputSchema if provided in definition', () => {
        const customSchema = { type: 'object', properties: { x: { type: 'number' } } };
        const { tool } = Automator.registerTool(
            { name: 'schema.override', title: 'Override', description: 'Test', inputSchema: customSchema },
            async () => ({})
        );
        expect(tool.inputSchema).toEqual(customSchema);
    });
});

/* ================================================================== */
/*  6. getTools — spec §4.2.3                                         */
/* ================================================================== */
describe('getTools', () => {
    beforeAll(() => loadWebMCP());

    beforeEach(() => {
        mockMC.getTools.mockReset();
        Automator._registeredTools.clear();
    });

    test('delegates to mc.getTools when available', async () => {
        const fakeTools = [{ name: 'a', title: 'A', description: 'desc', inputSchema: { type: 'object', properties: {} }, annotations: {} }];
        mockMC.getTools.mockResolvedValue(fakeTools);
        const result = await Automator.getTools();
        expect(mockMC.getTools).toHaveBeenCalled();
        expect(result).toEqual(fakeTools);
    });

    test('passes options to mc.getTools', async () => {
        mockMC.getTools.mockResolvedValue([]);
        const opts = { fromOrigins: ['https://example.com'] };
        await Automator.getTools(opts);
        expect(mockMC.getTools).toHaveBeenCalledWith(opts);
    });

    test('falls back to internal registry when mc.getTools missing', async () => {
        // Remove from both document and navigator
        delete document.modelContext.getTools;
        delete navigator.modelContext.getTools;
        Automator._registeredTools.set('my.tool', {
            tool: { name: 'my.tool', title: 'My Tool', description: 'desc', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
        });
        const result = await Automator.getTools();
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('my.tool');
    });
});

/* ================================================================== */
/*  7. unregisterTool                                                 */
/* ================================================================== */
describe('unregisterTool', () => {
    beforeAll(() => loadWebMCP());

    beforeEach(() => {
        mockMC.registerTool.mockReset();
        mockMC.registerTool.mockResolvedValue(undefined);
        mockMC.unregisterTool.mockClear();
        Automator._registeredTools.clear();
    });

    test('aborts controller and removes from registry', async () => {
        Automator.registerTool(
            { name: 'removable.tool', title: 'Removable', description: 'Test', parameters: {} },
            async () => ({})
        );
        await new Promise(r => setTimeout(r, 10));
        expect(Automator._registeredTools.has('removable.tool')).toBe(true);

        Automator.unregisterTool('removable.tool');
        expect(Automator._registeredTools.has('removable.tool')).toBe(false);
    });

    test('calls mc.unregisterTool when no controller', () => {
        Automator._registeredTools.set('legacy.tool', { tool: { name: 'legacy.tool' }, controller: null });
        Automator.unregisterTool('legacy.tool');
        expect(mockMC.unregisterTool).toHaveBeenCalledWith('legacy.tool');
    });

    test('no-op for unknown tool names', () => {
        expect(() => Automator.unregisterTool('nonexistent.tool')).not.toThrow();
    });
});

/* ================================================================== */
/*  8. ontoolchange events                                            */
/* ================================================================== */
describe('ontoolchange event handling', () => {
    beforeAll(() => loadWebMCP());

    test('addEventListener is available', () => {
        expect(typeof navigator.modelContext.addEventListener).toBe('function');
    });

    test('removeEventListener is available', () => {
        expect(typeof navigator.modelContext.removeEventListener).toBe('function');
    });
});

/* ================================================================== */
/*  9. ensureAgentConsent                                             */
/* ================================================================== */
describe('ensureAgentConsent', () => {
    beforeAll(() => loadWebMCP());

    beforeEach(() => {
        Automator.consentGiven = false;
        window.WEBMCP_AUTO_CONSENT = false;
        window.AEM_WEBMCP_CONSENT = false;
    });

    test('returns true when WEBMCP_AUTO_CONSENT is true', async () => {
        window.WEBMCP_AUTO_CONSENT = true;
        expect(await Automator.ensureAgentConsent()).toBe(true);
    });

    test('returns true when AEM_WEBMCP_CONSENT is true', async () => {
        window.AEM_WEBMCP_CONSENT = true;
        expect(await Automator.ensureAgentConsent()).toBe(true);
    });

    test('returns true when consentGiven is already true', async () => {
        Automator.consentGiven = true;
        expect(await Automator.ensureAgentConsent()).toBe(true);
    });

    test('calls requestUserInteraction when available', async () => {
        mockMC.requestUserInteraction.mockResolvedValue(true);
        expect(await Automator.ensureAgentConsent()).toBe(true);
        expect(mockMC.requestUserInteraction).toHaveBeenCalled();
        expect(Automator.consentGiven).toBe(true);
    });

    test('returns false when requestUserInteraction returns false', async () => {
        mockMC.requestUserInteraction.mockResolvedValue(false);
        expect(await Automator.ensureAgentConsent()).toBe(false);
        expect(Automator.consentGiven).toBe(false);
    });

    test('returns false when requestUserInteraction throws', async () => {
        mockMC.requestUserInteraction.mockRejectedValue(new Error('denied'));
        expect(await Automator.ensureAgentConsent()).toBe(false);
    });

    test('returns false when no requestUserInteraction and no consent flags', async () => {
        delete document.modelContext.requestUserInteraction;
        delete navigator.modelContext.requestUserInteraction;
        expect(await Automator.ensureAgentConsent()).toBe(false);
    });
});

/* ================================================================== */
/*  10. _getModelContext — document.modelContext with navigator fallback */
/* ================================================================== */
describe('_getModelContext', () => {
    beforeAll(() => loadWebMCP());

    test('returns mock from document.modelContext', () => {
        expect(Automator._getModelContext()).toBe(mockMC);
    });

    test('falls back to navigator.modelContext when document.modelContext missing', () => {
        delete document.modelContext;
        // navigator.modelContext should still work
        expect(Automator._getModelContext()).toBe(mockMC);
    });

    test('returns null when neither is available', () => {
        delete document.modelContext;
        delete navigator.modelContext;
        expect(Automator._getModelContext()).toBeNull();
    });
});

/* ================================================================== */
/*  11. _health — registration observability                          */
/* ================================================================== */
describe('_health tracking', () => {
    beforeAll(() => loadWebMCP());

    test('_health object exists with expected keys', () => {
        expect(Automator._health).toBeDefined();
        expect(typeof Automator._health.registered).toBe('number');
        expect(typeof Automator._health.failed).toBe('number');
        expect(typeof Automator._health.skipped).toBe('number');
    });

    test('registered count matches successful registerTool calls', () => {
        expect(Automator._health.registered).toBeGreaterThanOrEqual(10);
    });
});

/* ================================================================== */
/*  12. version and basic properties                                  */
/* ================================================================== */
describe('Automator properties', () => {
    beforeAll(() => loadWebMCP());

    test('version is 2.1.0', () => {
        expect(Automator.version).toBe('2.1.0');
    });

    test('READ_ONLY_TOOLS includes expected tools', () => {
        expect(Automator.READ_ONLY_TOOLS).toContain('getPageInfo');
        expect(Automator.READ_ONLY_TOOLS).toContain('getComponents');
        expect(Automator.READ_ONLY_TOOLS).toContain('getPageScreenshot');
        expect(Automator.READ_ONLY_TOOLS).toContain('getAccessibilityTree');
    });

    test('UNTRUSTED_TOOLS includes expected tools', () => {
        expect(Automator.UNTRUSTED_TOOLS).toContain('getPageScreenshot');
        expect(Automator.UNTRUSTED_TOOLS).toContain('getAccessibilityTree');
        expect(Automator.UNTRUSTED_TOOLS).toContain('getSearchResults');
    });

    test('isWebMCPSupported returns true when modelContext exists', () => {
        expect(Automator.isWebMCPSupported()).toBe(true);
    });

    test('isWebMCPSupported returns false when modelContext missing', () => {
        delete document.modelContext;
        delete navigator.modelContext;
        expect(Automator.isWebMCPSupported()).toBe(false);
    });
});

/* ================================================================== */
/*  13. componentMappings                                             */
/* ================================================================== */
describe('componentMappings', () => {
    beforeAll(() => loadWebMCP());

    test('has entries for all major categories', () => {
        const categories = new Set(Object.values(Automator.componentMappings).map(m => m.category));
        expect(categories).toContain('commerce');
        expect(categories).toContain('navigation');
        expect(categories).toContain('content');
        expect(categories).toContain('layout');
        expect(categories).toContain('form');
        expect(categories).toContain('media');
    });

    test('every mapping has category and action', () => {
        Object.entries(Automator.componentMappings).forEach(([key, mapping]) => {
            expect(mapping.category).toBeDefined();
            expect(mapping.action).toBeDefined();
        });
    });
});

/* ================================================================== */
/*  14. window.AEMWebMCP global API                                   */
/* ================================================================== */
describe('window.AEMWebMCP global API', () => {
    beforeAll(() => loadWebMCP());

    test('is exposed on window', () => {
        expect(window.AEMWebMCP).toBeDefined();
    });

    test('has version property', () => {
        expect(window.AEMWebMCP.version).toBe('2.1.0');
    });

    test('has _checkConsent method', () => {
        expect(typeof window.AEMWebMCP._checkConsent).toBe('function');
    });

    test('has consented property', () => {
        expect(typeof window.AEMWebMCP.consented).toBe('boolean');
    });
});
