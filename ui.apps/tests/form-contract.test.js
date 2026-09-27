const BASE = '../src/main/content/jcr_root/apps/aem-webmcp/clientlibs/clientlib-webmcp/js/';
let A;
beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<form id="contact"><input id="email" name="email" type="email" required><button>Send</button></form>';
    window.AEMWebMCPAutomator = undefined;
    window.WEBMCP_ENABLED = true;
    window.WEBMCP_CONSENT = true;
    require(BASE + 'webmcp-config.js');
    require(BASE + 'webmcp-helpers.js');
    require(BASE + 'webmcp.js');
    A = window.AEMWebMCPAutomator;
    A.exposeWebMCPAPI();
});

test('documented positional and object calls fill the same field', async () => {
    expect((await window.AEMWebMCP.fillForm('#email', 'first@example.com')).success).toBe(true);
    expect(document.querySelector('#email').value).toBe('first@example.com');
    await window.AEMWebMCP.fillForm({ selector: '#email', value: 'second@example.com' });
    expect(document.querySelector('#email').value).toBe('second@example.com');
});

test('canceled native invocation cannot mutate a field', async () => {
    const controller = new AbortController();
    controller.abort();
    const handler = jest.fn();
    const tool = A.toModelContextTool('fillForm', { execute: handler });
    await expect(tool.execute({}, { signal: controller.signal })).rejects.toHaveProperty('name', 'AbortError');
    expect(handler).not.toHaveBeenCalled();
});

test('execution signal and custom annotations survive the adapter', async () => {
    const controller = new AbortController();
    const execute = jest.fn().mockResolvedValue('ok');
    const { tool } = A.registerTool({ name: 'lookup', annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false } }, execute);
    await tool.execute({}, { signal: controller.signal });
    expect(execute).toHaveBeenCalledWith({}, { signal: controller.signal });
    expect(tool.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true, consequentialHint: false });
});

test('schema conversion preserves validation constraints', () => {
    expect(A.toInputSchema({ count: { type: 'integer', required: true, minimum: 1, maximum: 5 }, mode: { enum: ['one', 'all'] } })).toEqual({
        type: 'object', required: ['count'], properties: {
            count: { type: 'integer', description: '', minimum: 1, maximum: 5 },
            mode: { type: 'string', description: '', enum: ['one', 'all'] }
        }
    });
});

test('invalid form never asks confirmation or submits', async () => {
    A.confirmAction = jest.fn();
    const submit = jest.spyOn(document.querySelector('form'), 'requestSubmit');
    expect((await A.submitForm('#contact')).success).toBe(false);
    expect(A.confirmAction).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
});

test('confirmed submission preserves the existing submit handler', async () => {
    document.querySelector('#email').value = 'user@example.com';
    A.confirmAction = jest.fn().mockResolvedValue(true);
    const handler = jest.fn(event => event.preventDefault());
    document.querySelector('form').addEventListener('submit', handler);
    expect((await A.submitForm('#contact')).status).toBe('submitted');
    expect(handler).toHaveBeenCalledTimes(1);
});

test('confirmation rejection and cancellation prevent submission', async () => {
    document.querySelector('#email').value = 'user@example.com';
    const submit = jest.spyOn(document.querySelector('form'), 'requestSubmit');
    A.confirmAction = jest.fn().mockResolvedValue(false);
    await A.submitForm('#contact');
    expect(submit).not.toHaveBeenCalled();
    const controller = new AbortController();
    A.confirmAction = async () => { controller.abort(); return true; };
    await expect(A.submitForm('#contact', { signal: controller.signal })).rejects.toHaveProperty('name', 'AbortError');
    expect(submit).not.toHaveBeenCalled();
});

test('excluded ancestor prevents enhancement and form mutation', async () => {
    document.querySelector('form').setAttribute('data-webmcp-disabled', 'true');
    document.querySelector('form').removeAttribute('data-webmcp-action');
    A.enhanceAllComponents();
    expect(document.querySelector('form').hasAttribute('data-webmcp-action')).toBe(false);
    expect((await A.fillFormField('#email', 'user@example.com')).success).toBe(false);
    expect(document.querySelector('#email').value).toBe('');
});
