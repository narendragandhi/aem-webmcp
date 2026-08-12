/** Tests for the optional SLICC browser bridge. */

const WEBMCP_BASE = '../src/main/content/jcr_root/apps/aem-webmcp/clientlibs/clientlib-webmcp/js';
const BRIDGE = '../src/main/content/jcr_root/apps/aem-webmcp/clientlibs/clientlib-webmcp/js/slicc-bridge.js';

function loadBridge() {
    jest.resetModules();

    const registeredTool = {
        name: 'getPageInfo',
        title: 'Get Page Info',
        description: 'Read page information',
        inputSchema: { type: 'object', properties: {} },
        annotations: { readOnlyHint: true },
        execute: jest.fn().mockResolvedValue({
            content: [{ type: 'text', text: JSON.stringify({ title: 'AEM page' }) }]
        })
    };

    window.AEMWebMCPAutomator = {
        _registeredTools: new Map([['getPageInfo', { tool: registeredTool }]])
    };
    require(BRIDGE);
    return { bridge: window.AEMWebMCPSlicc, registeredTool };
}

describe('AEM WebMCP SLICC bridge', () => {
    afterEach(() => {
        delete window.AEMWebMCPSlicc;
        delete window.AEMWebMCPAutomator;
    });

    test('lists metadata without exposing execute callbacks', () => {
        const { bridge } = loadBridge();
        const tools = bridge.listTools();

        expect(tools).toHaveLength(1);
        expect(tools[0]).toMatchObject({ name: 'getPageInfo', title: 'Get Page Info' });
        expect(tools[0].execute).toBeUndefined();
    });

    test('invokes only a registered tool and preserves its result envelope', async () => {
        const { bridge, registeredTool } = loadBridge();
        const result = await bridge.callTool('getPageInfo', { });

        expect(registeredTool.execute).toHaveBeenCalledWith({ });
        expect(result.content[0].text).toContain('AEM page');
    });

    test('rejects unknown tools without evaluating arbitrary code', async () => {
        const { bridge } = loadBridge();
        const result = await bridge.callTool('not-registered', { expression: 'alert(1)' });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Unknown AEM WebMCP tool');
    });

    test('waits for delayed tool registration', async () => {
        jest.useFakeTimers();
        const { bridge } = loadBridge();
        window.AEMWebMCPAutomator._registeredTools.clear();

        const pending = bridge.ready(1000);
        window.AEMWebMCPAutomator._registeredTools.set('getPageInfo', {
            tool: { name: 'getPageInfo', execute: jest.fn() }
        });
        await jest.runOnlyPendingTimersAsync();

        await expect(pending).resolves.toHaveLength(1);
        jest.useRealTimers();
    });

    test('falls back to the public consent-gated API without native WebMCP', async () => {
        jest.resetModules();
        window.AEMWebMCPAutomator = { _registeredTools: new Map() };
        window.AEMWebMCP = {
            getPageInfo: jest.fn().mockResolvedValue({ title: 'Fallback page' })
        };
        require(BRIDGE);

        expect(window.AEMWebMCPSlicc.isReady()).toBe(true);
        expect(window.AEMWebMCPSlicc.listTools().map(tool => tool.name)).toContain('getPageInfo');
        const result = await window.AEMWebMCPSlicc.callTool('getPageInfo', {});

        expect(window.AEMWebMCP.getPageInfo).toHaveBeenCalledWith({});
        expect(result.content[0].text).toContain('Fallback page');
    });
});
