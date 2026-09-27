(function () {
    'use strict';
    var mc = document.modelContext || navigator.modelContext;
    var capability = document.getElementById('capability');
    capability.textContent = mc ? 'WebMCP API detected. Check your browser version against the compatibility guide.' :
        'Native WebMCP is unavailable. You can still complete the form manually. Enable the WebMCP testing flag in a supported browser to inspect native tools.';
    async function refresh() {
        var tools = mc && typeof mc.getTools === 'function' ? await mc.getTools() : [];
        document.getElementById('tools').textContent = JSON.stringify(tools.map(function (tool) {
            return { name: tool.name, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations };
        }), null, 2);
    }
    document.getElementById('refresh').onclick = function () { refresh().catch(function (error) { capability.textContent = error.message; }); };
    document.getElementById('enable').onclick = function () { window.AEMWebMCP._showConsentUI(); };
    if (mc && mc.addEventListener) mc.addEventListener('toolchange', refresh);
    refresh().catch(function (error) { capability.textContent = error.message; });
})();
