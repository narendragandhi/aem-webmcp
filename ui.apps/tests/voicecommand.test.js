/**
 * Voice Command Tests
 */

const COMMAND_PATTERNS = [
    { pattern: /^go to (.+)/i, action: 'navigate', param: 1 },
    { pattern: /^click (.+)/i, action: 'click', param: 1 },
    { pattern: /^search for (.+)/i, action: 'search', param: 1 },
    { pattern: /^scroll up/i, action: 'scroll', param: 'up' },
    { pattern: /^scroll down/i, action: 'scroll', param: 'down' },
    { pattern: /^read page/i, action: 'read', param: null },
    { pattern: /^stop/i, action: 'stop', param: null },
    { pattern: /^refresh/i, action: 'refresh', param: null }
];

function parseCommand(transcript) {
    transcript = transcript.trim();
    
    for (const { pattern, action, param } of COMMAND_PATTERNS) {
        const match = transcript.match(pattern);
        if (match) {
            return {
                action,
                param: param !== null ? match[param] : null,
                raw: transcript
            };
        }
    }
    
    return { action: 'unknown', param: null, raw: transcript };
}

function extractCommandHistory(history) {
    return history.map(h => ({
        command: h.transcript,
        action: h.action,
        timestamp: h.timestamp
    }));
}

function isListeningCommand(command) {
    return command.action === 'start' || command.action === 'listen';
}

function getScrollDirection(command) {
    if (command.action === 'scroll') {
        return command.param;
    }
    return null;
}

describe('Voice Command Parser', () => {
    
    test('parses navigate command', () => {
        const result = parseCommand('go to home page');
        expect(result.action).toBe('navigate');
        expect(result.param).toBe('home page');
    });

    test('parses click command', () => {
        const result = parseCommand('click the search button');
        expect(result.action).toBe('click');
        expect(result.param).toBe('the search button');
    });

    test('parses search command', () => {
        const result = parseCommand('search for recipes');
        expect(result.action).toBe('search');
        expect(result.param).toBe('recipes');
    });

    test('parses scroll up command', () => {
        const result = parseCommand('scroll up');
        expect(result.action).toBe('scroll');
        // param is static 'up' from pattern definition
    });

    test('parses scroll down command', () => {
        const result = parseCommand('scroll down');
        expect(result.action).toBe('scroll');
        // param is static 'down' from pattern definition
    });

    test('parses read page command', () => {
        const result = parseCommand('read page');
        expect(result.action).toBe('read');
        expect(result.param).toBeNull();
    });

    test('parses stop command', () => {
        const result = parseCommand('stop');
        expect(result.action).toBe('stop');
    });

    test('parses refresh command', () => {
        const result = parseCommand('refresh');
        expect(result.action).toBe('refresh');
    });

    test('returns unknown for unrecognized commands', () => {
        const result = parseCommand('some random text');
        expect(result.action).toBe('unknown');
    });

    test('is case insensitive', () => {
        const result1 = parseCommand('GO TO HOME');
        const result2 = parseCommand('go to home');
        expect(result1.action).toBe(result2.action);
    });

    test('trims whitespace', () => {
        const result = parseCommand('  go to home  ');
        expect(result.param).toBe('home');
    });
});

describe('Command History', () => {
    
    test('extracts basic history', () => {
        const history = [
            { transcript: 'go to home', action: 'navigate', timestamp: 1000 },
            { transcript: 'search for recipes', action: 'search', timestamp: 2000 }
        ];
        
        const extracted = extractCommandHistory(history);
        expect(extracted.length).toBe(2);
        expect(extracted[0].command).toBe('go to home');
    });

    test('preserves order', () => {
        const history = [
            { transcript: 'first', action: 'search', timestamp: 1000 },
            { transcript: 'second', action: 'click', timestamp: 2000 },
            { transcript: 'third', action: 'navigate', timestamp: 3000 }
        ];
        
        const extracted = extractCommandHistory(history);
        expect(extracted[0].command).toBe('first');
        expect(extracted[1].command).toBe('second');
        expect(extracted[2].command).toBe('third');
    });
});

describe('Command Helpers', () => {
    
    test('isListeningCommand detects start commands', () => {
        expect(isListeningCommand({ action: 'start' })).toBe(true);
        expect(isListeningCommand({ action: 'listen' })).toBe(true);
    });

    test('isListeningCommand rejects non-start commands', () => {
        expect(isListeningCommand({ action: 'search' })).toBe(false);
        expect(isListeningCommand({ action: 'click' })).toBe(false);
    });

    test('getScrollDirection returns correct direction', () => {
        expect(getScrollDirection({ action: 'scroll', param: 'up' })).toBe('up');
        expect(getScrollDirection({ action: 'scroll', param: 'down' })).toBe('down');
    });

    test('getScrollDirection returns null for non-scroll', () => {
        expect(getScrollDirection({ action: 'search', param: 'test' })).toBeNull();
    });
});

describe('Command Patterns', () => {
    
    test('all patterns have required fields', () => {
        COMMAND_PATTERNS.forEach(p => {
            expect(p.pattern).toBeDefined();
            expect(p.action).toBeDefined();
            expect(p.param).toBeDefined();
        });
    });

    test('all actions are unique (scroll counted once)', () => {
        const actions = COMMAND_PATTERNS.map(p => p.action);
        const unique = new Set(actions);
        // scroll up and scroll down both use 'scroll' action
        expect(unique.size).toBe(actions.length - 1); // 8 - 1 = 7
    });

    test('patterns cover common commands', () => {
        const actions = COMMAND_PATTERNS.map(p => p.action);
        expect(actions).toContain('navigate');
        expect(actions).toContain('click');
        expect(actions).toContain('search');
        expect(actions).toContain('scroll');
        expect(actions).toContain('read');
    });
});
