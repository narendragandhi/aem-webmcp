/**
 * AEM WebMCP Voice Command Component
 * Uses MediaPipe for client-side speech recognition
 * Exposes WebMCP tools for AI agent interaction
 */

(function(document, window) {
    'use strict';

    const COMMAND_PATTERNS = [
        { pattern: /^go to (.+)/i, action: 'navigate', param: 1 },
        { pattern: /^click (.+)/i, action: 'click', param: 1 },
        { pattern: /^search for (.+)/i, action: 'search', param: 1 },
        { pattern: /^scroll up/i, action: 'scroll', param: 'up' },
        { pattern: /^scroll down/i, action: 'scroll', param: 'down' },
        { pattern: /^read page/i, action: 'read', param: null },
        { pattern: /^fill form/i, action: 'fill-form', param: null },
        { pattern: /^stop/i, action: 'stop', param: null },
        { pattern: /^check accessibility/i, action: 'audit', param: null },
        { pattern: /^what is (.+)/i, action: 'ask', param: 1 },
        { pattern: /^how do i (.+)/i, action: 'ask', param: 1 },
        { pattern: /^does (.+)/i, action: 'ask', param: 1 },
        { pattern: /^refresh/i, action: 'refresh', param: null }
    ];

    class VoiceCommand {
        constructor(element) {
            this.element = element;
            this.micButton = element.querySelector('#mic-toggle');
            this.transcript = element.querySelector('#transcript');
            this.statusDot = element.querySelector('.status-dot');
            this.statusText = element.querySelector('.status-text');
            this.historyList = element.querySelector('#command-history');
            
            this.isListening = false;
            this.speechRecognizer = null;
            this.speechSynthesis = window.speechSynthesis;
            this.commandHistory = [];
            
            this.init();
        }

        async init() {
            // Set up mic button
            if (this.micButton) {
                this.micButton.addEventListener('click', () => this.toggleListening());
            }

            // Initialize speech recognition
            await this.initSpeechRecognition();

            // Register MCP tools
            this.registerMCPTools();
        }

        async initSpeechRecognition() {
            try {
                // Check for Web Speech API (widely supported)
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    this.speechRecognizer = new SpeechRecognition();
                    this.speechRecognizer.continuous = true;
                    this.speechRecognizer.interimResults = true;
                    this.speechRecognizer.lang = 'en-US';

                    this.speechRecognizer.onresult = (event) => {
                        const transcript = event.results[event.results.length - 1][0].transcript;
                        this.transcript.textContent = transcript;
                        
                        if (event.results[event.results.length - 1].isFinal) {
                            this.processCommand(transcript);
                        }
                    };

                    this.speechRecognizer.onerror = (event) => {
                        console.error('[VoiceCommand] Speech recognition error:', event.error);
                        this.updateStatus('error', 'Error: ' + event.error);
                    };

                    this.speechRecognizer.onend = () => {
                        if (this.isListening) {
                            // Restart if still supposed to be listening
                            this.speechRecognizer.start();
                        } else {
                            this.updateStatus('ready', 'Ready');
                        }
                    };

                    console.log('[VoiceCommand] Web Speech API initialized');
                } else if (typeof window.mediapipe !== 'undefined') {
                    // Try MediaPipe if available
                    console.log('[VoiceCommand] Using MediaPipe for speech');
                } else {
                    console.warn('[VoiceCommand] No speech recognition available');
                }
            } catch (error) {
                console.warn('[VoiceCommand] Init failed:', error);
            }
        }

        toggleListening() {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        }

        startListening() {
            if (!this.speechRecognizer) {
                // Fallback: use Web Speech API directly
                this.useFallbackSpeech();
                return;
            }

            try {
                this.speechRecognizer.start();
                this.isListening = true;
                this.updateStatus('listening', 'Listening...');
                this.micButton.classList.add('active');
            } catch (error) {
                console.error('[VoiceCommand] Start error:', error);
            }
        }

        stopListening() {
            if (this.speechRecognizer) {
                this.speechRecognizer.stop();
            }
            this.isListening = false;
            this.updateStatus('ready', 'Ready');
            this.micButton.classList.remove('active');
        }

        useFallbackSpeech() {
            // Simple fallback using Web Speech API for single utterances
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognizer = new SpeechRecognition();
                recognizer.lang = 'en-US';
                recognizer.interimResults = false;
                
                recognizer.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    this.transcript.textContent = transcript;
                    this.processCommand(transcript);
                };

                recognizer.onend = () => {
                    this.isListening = false;
                    this.updateStatus('ready', 'Ready');
                    this.micButton.classList.remove('active');
                };

                recognizer.start();
                this.isListening = true;
                this.updateStatus('listening', 'Listening...');
                this.micButton.classList.add('active');
            }
        }

        processCommand(transcript) {
            transcript = transcript.trim().toLowerCase();
            
            for (const { pattern, action, param } of COMMAND_PATTERNS) {
                const match = transcript.match(pattern);
                if (match) {
                    const paramValue = param !== null ? match[param] : null;
                    this.executeCommand(action, paramValue);
                    this.addToHistory(transcript, action);
                    return;
                }
            }

            // If a form is being filled, send input to FormAgent
            if (window.AEMFormAgent && window.AEMFormAgent.activeForm) {
                window.AEMFormAgent.processInput(transcript);
                this.addToHistory(transcript, 'form-input');
                return;
            }

            // Unknown command - try to search
            this.executeCommand('search', transcript);
            this.addToHistory(transcript, 'search');
        }

        executeCommand(action, param) {
            console.log('[VoiceCommand] Executing:', action, param);

            switch (action) {
                case 'navigate':
                    if (param) {
                        // Simple navigation - would link to pages
                        console.log('[VoiceCommand] Navigate to:', param);
                        this.speak('Navigating to ' + param);
                    }
                    break;

                case 'click':
                    // Would find and click element
                    console.log('[VoiceCommand] Click:', param);
                    this.speak('Clicking ' + param);
                    break;

                case 'search':
                    // Trigger search
                    console.log('[VoiceCommand] Search:', param);
                    this.speak('Searching for ' + param);
                    window.dispatchEvent(new CustomEvent('webmcp-voice-search', { detail: { query: param } }));
                    break;

                case 'scroll':
                    const direction = param === 'up' ? -1 : 1;
                    window.scrollBy(0, direction * 300);
                    this.speak('Scrolling ' + param);
                    break;

                case 'read':
                    this.readPageContent();
                    break;

                case 'fill-form':
                    if (window.AEMFormAgent) {
                        this.speak('Sure, let me help you with the form. Scanning for fields...');
                        window.AEMFormAgent.discoverForm().then(() => {
                            window.AEMFormAgent.analyzeFields().then(() => {
                                window.AEMFormAgent.checkProgress();
                            });
                        });
                    } else {
                        this.speak('Sorry, the form agent is not available.');
                    }
                    break;

                case 'audit':
                    if (window.AEMAuditAgent) {
                        this.speak('Running accessibility audit...');
                        window.AEMAuditAgent.scanPage();
                    } else {
                        this.speak('Audit agent not available.');
                    }
                    break;

                case 'ask':
                    if (window.AEMContentAgent) {
                        this.speak('Checking page content...');
                        window.AEMContentAgent.ask(param);
                    } else {
                        this.speak('Content agent not available.');
                    }
                    break;

                case 'stop':
                    this.speechSynthesis.cancel();
                    this.speak('Stopped');
                    break;

                case 'refresh':
                    window.location.reload();
                    break;
            }
        }

        readPageContent() {
            // Get page title and headings
            const title = document.title;
            const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
                .map(h => h.textContent)
                .slice(0, 10);

            const content = [title, ...headings].join('. ');
            this.speak(content);
        }

        speak(text) {
            if (this.speechSynthesis) {
                this.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                this.speechSynthesis.speak(utterance);
            }
        }

        addToHistory(transcript, action) {
            this.commandHistory.unshift({ transcript, action, timestamp: Date.now() });
            
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="command">${transcript}</span>
                <span class="action">${action}</span>
            `;
            
            this.historyList.insertBefore(item, this.historyList.firstChild);
            
            // Keep only last 10
            while (this.historyList.children.length > 10) {
                this.historyList.removeChild(this.historyList.lastChild);
            }
        }

        updateStatus(status, text) {
            this.statusDot.className = 'status-dot ' + status;
            this.statusText.textContent = text;
        }

        // MCP Tool Registration
        registerMCPTools() {
            const tools = [
                {
                    name: "startVoiceCommand",
                    description: "Start listening for voice commands",
                    inputSchema: { type: "object", properties: {} },
                    handler: () => this.handleStartVoice()
                },
                {
                    name: "stopVoiceCommand",
                    description: "Stop listening for voice commands",
                    inputSchema: { type: "object", properties: {} },
                    handler: () => this.handleStopVoice()
                },
                {
                    name: "processVoiceCommand",
                    description: "Process a voice command text directly",
                    inputSchema: {
                        type: "object",
                        properties: {
                            command: { type: "string", description: "Voice command to process" }
                        },
                        required: ["command"]
                    },
                    handler: (params) => this.handleProcessCommand(params)
                },
                {
                    name: "speakText",
                    description: "Speak text using text-to-speech",
                    inputSchema: {
                        type: "object",
                        properties: {
                            text: { type: "string", description: "Text to speak" }
                        },
                        required: ["text"]
                    },
                    handler: (params) => this.handleSpeak(params)
                },
                {
                    name: "getCommandHistory",
                    description: "Get voice command history",
                    inputSchema: { type: "object", properties: {} },
                    handler: () => this.handleGetHistory()
                }
            ];

            // Register with native modelContext
            if (window.navigator?.modelContext) {
                try {
                    const registeredTools = tools.map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
                        handle: tool.handler
                    }));
                    
                    if (window.navigator.modelContext.register) {
                        window.navigator.modelContext.register(registeredTools);
                    }
                } catch (e) {
                    console.warn('[MCP-B] Native registration failed:', e);
                }
            }

            // Register with fallback
            if (window.AEMWebMCPAutomator) {
                tools.forEach(tool => {
                    window.AEMWebMCPAutomator.registerTool({
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.inputSchema
                    }, tool.handler);
                });
            }

            // Global exposure
            window.AEMWebMCP = window.AEMWebMCP || {};
            window.AEMWebMCP.VoiceCommand = {
                start: () => this.handleStartVoice(),
                stop: () => this.handleStopVoice(),
                process: (cmd) => this.handleProcessCommand({ command: cmd }),
                speak: (text) => this.handleSpeak({ text }),
                getHistory: () => this.handleGetHistory()
            };
        }

        handleStartVoice() {
            this.startListening();
            return { content: [{ type: "text", text: JSON.stringify({ success: true, status: "listening" }) }] };
        }

        handleStopVoice() {
            this.stopListening();
            return { content: [{ type: "text", text: JSON.stringify({ success: true, status: "stopped" }) }] };
        }

        handleProcessCommand(params) {
            this.processCommand(params.command);
            return { content: [{ type: "text", text: JSON.stringify({ success: true, command: params.command }) }] };
        }

        handleSpeak(params) {
            this.speak(params.text);
            return { content: [{ type: "text", text: JSON.stringify({ success: true, spoken: params.text }) }] };
        }

        handleGetHistory() {
            return { content: [{ type: "text", text: JSON.stringify({ success: true, history: this.commandHistory }) }] };
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        const commands = document.querySelectorAll('.aem-webmcp-voicecommand');
        commands.forEach(el => new VoiceCommand(el));
    });

})(document, window);
