// Local reference playground only. Never use this receipt simulator as an AEM backend.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.WEBMCP_PORT || 4178);
const origin = 'http://127.0.0.1:' + port;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.md': 'text/plain' };
const json = (response, status, data) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(data));
};
http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Permissions-Policy', 'tools=(self)');
    response.setHeader('Origin-Agent-Cluster', '?1');
    const url = new URL(request.url, origin);
    if (url.pathname === '/api/support' && request.method === 'POST') {
        if (request.headers.origin !== origin || !request.headers['content-type']?.startsWith('application/json')) {
            return json(response, 403, { success: false, error: 'Same-origin JSON requests only' });
        }
        let body = '';
        try {
            for await (const chunk of request) {
                body += chunk;
                if (Buffer.byteLength(body) > 16384) return json(response, 413, { success: false, error: 'Request too large' });
            }
            const data = JSON.parse(body);
            if (!data || typeof data !== 'object' || Object.keys(data).some(key => !['fullName', 'email', 'message'].includes(key)) ||
                typeof data.fullName !== 'string' || data.fullName.trim().length < 2 || data.fullName.length > 100 ||
                typeof data.email !== 'string' || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
                typeof data.message !== 'string' || data.message.trim().length < 10 || data.message.length > 5000) {
                return json(response, 400, { success: false, error: 'Invalid support request fields' });
            }
            return json(response, 200, { success: true, demo: true, receipt: randomUUID(), message: 'Demo validated. No support ticket was created or message stored.' });
        } catch { return json(response, 400, { success: false, error: 'Invalid JSON request' }); }
    }
    if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { error: 'Method not allowed' });
    let relative;
    if (url.pathname.startsWith('/clientlib/')) relative = 'ui.apps/src/main/content/jcr_root/apps/aem-webmcp/clientlibs/clientlib-webmcp/js/' + url.pathname.slice(11);
    else if (url.pathname.startsWith('/docs/')) relative = url.pathname.slice(1);
    else relative = 'test-site/' + (url.pathname === '/' ? 'form-journey.html' : url.pathname.slice(1));
    const path = resolve(root, relative);
    if (!path.startsWith(root) || !types[extname(path)] || relative.includes('..')) return json(response, 404, { error: 'Not found' });
    try {
        const body = await readFile(path);
        response.writeHead(200, { 'Content-Type': types[extname(path)] + '; charset=utf-8' });
        response.end(request.method === 'HEAD' ? undefined : body);
    } catch { json(response, 404, { error: 'Not found' }); }
}).listen(port, '127.0.0.1', () => console.log('WebMCP playground: ' + origin));
