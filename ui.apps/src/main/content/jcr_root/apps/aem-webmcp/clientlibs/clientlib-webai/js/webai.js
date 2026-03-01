/**
 * AEM WebAI - TinyLlama Chat Integration
 * 
 * Runs TinyLlama 1.1B locally in browser via transformers.js
 * No GPU required - uses WebAssembly for CPU inference
 * 
 * @version 1.1.0 - Production Ready
 */

(function (document, window) {
    'use strict';

    const AEMWebAI = {
        // State
        model: null,
        pipeline: null,
        isLoading: false,
        isReady: false,
        isOpen: false,
        sessionId: null,
        retryCount: 0,
        maxRetries: 3,
        
        // Config
        config: {
            modelId: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
            maxTokens: 512,
            temperature: 0.7,
            device: null,
            modelTimeout: 120000, // 2 minutes
            cdnUrls: [
                'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js',
                'https://unpkg.com/@xenova/transformers@2.17.2/dist/transformers.min.js'
            ]
        },
        
        // WebMCP Functions available to AI
        functions: {},
        
        // Chat history
        history: [],
        
        // Initialize
        init: function() {
            console.log('[WebAI] Initializing AEM WebAI...');
            this.detectDevice();
            this.registerFunctions();
            this.generateSessionId();
            this.updateStatus('ready');
            console.log('[WebAI] Ready - device:', this.config.device);
        },
        
        // Detect CPU vs GPU
        detectDevice: function() {
            if (navigator.gpu) {
                this.config.device = 'webgpu';
                console.log('[WebAI] Using WebGPU');
            } else {
                this.config.device = 'cpu';
                console.log('[WebAI] Using CPU (WebAssembly)');
            }
        },
        
        // Generate session ID
        generateSessionId: function() {
            this.sessionId = 'webai-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        },
        
        // Register WebMCP functions for AI
        registerFunctions: function() {
            this.functions = {
                getPageInfo: {
                    description: 'Get current page information',
                    execute: () => window.AEMWebMCP?.getPageInfo() || { error: 'WebMCP not available' }
                },
                getComponents: {
                    description: 'Get all components on page',
                    execute: (params) => window.AEMWebMCP?.getComponents(params?.category) || []
                },
                search: {
                    description: 'Search the website',
                    execute: (params) => {
                        if (params?.query) {
                            window.AEMWebMCP?.search(params.query);
                            return { success: true, message: `Searching for: ${params.query}` };
                        }
                        return { error: 'Query required' };
                    }
                },
                fillForm: {
                    description: 'Fill a form field',
                    execute: (params) => {
                        if (params?.selector && params?.value) {
                            return window.AEMWebMCP?.fillForm(params.selector, params.value) || { error: 'WebMCP not available' };
                        }
                        return { error: 'Selector and value required' };
                    }
                },
                submitForm: {
                    description: 'Submit a form',
                    execute: (params) => {
                        if (params?.selector) {
                            return window.AEMWebMCP?.submitForm(params.selector) || { error: 'WebMCP not available' };
                        }
                        return { error: 'Selector required' };
                    }
                },
                navigate: {
                    description: 'Navigate to a URL',
                    execute: (params) => {
                        if (params?.url) {
                            window.AEMWebMCP?.navigate(params.url);
                            return { success: true, message: `Navigating to: ${params.url}` };
                        }
                        return { error: 'URL required' };
                    }
                },
                addToCart: {
                    description: 'Add product to cart',
                    execute: (params) => {
                        const selector = params?.productSelector || '.product';
                        const qty = params?.quantity || 1;
                        return window.AEMWebMCP?.addToCart(selector, qty) || { error: 'WebMCP not available' };
                    }
                },
                expandAccordion: {
                    description: 'Expand accordion',
                    execute: (params) => {
                        const selector = params?.selector || '.accordion';
                        return window.AEMWebMCP?.interact(selector, 'expand') || { error: 'WebMCP not available' };
                    }
                },
                selectTab: {
                    description: 'Switch to a tab',
                    execute: (params) => {
                        const selector = params?.selector || '.tabs';
                        const index = params?.index || 0;
                        return window.AEMWebMCP?.interact(selector, 'select-tab', { index }) || { error: 'WebMCP not available' };
                    }
                }
            };
            console.log('[WebAI] Registered', Object.keys(this.functions).length, 'functions');
        },
        
        // Update status indicator
        updateStatus: function(status, message) {
            const dot = document.querySelector('.aem-webai-chat__status-dot');
            const text = document.querySelector('.aem-webai-chat__status-text');
            if (!dot || !text) return;
            
            const statuses = {
                'ready': { color: '#4caf50', text: 'Ready' },
                'loading': { color: '#ff9800', text: 'Loading model...' },
                'thinking': { color: '#2196f3', text: 'Thinking...' },
                'error': { color: '#f44336', text: 'Error' }
            };
            
            const s = statuses[status] || statuses.ready;
            dot.style.background = s.color;
            text.textContent = message || s.text;
        },
        
        // Toggle chat window
        toggle: function() {
            const chatWindow = document.querySelector('.aem-webai-chat__window');
            const toggle = document.querySelector('.aem-webai-chat__toggle');
            
            if (!chatWindow || !toggle) return;
            
            this.isOpen = !this.isOpen;
            
            if (this.isOpen) {
                chatWindow.style.display = 'flex';
                toggle.style.display = 'none';
                const input = document.getElementById('aem-webai-input');
                if (input) input.focus();
            } else {
                chatWindow.style.display = 'none';
                toggle.style.display = 'flex';
            }
        },
        
        // Send message
        send: async function() {
            const input = document.getElementById('aem-webai-input');
            const message = input?.value?.trim();
            
            if (!message) return;
            
            // Add user message
            this.addMessage('user', message);
            input.value = '';
            
            // Load model if needed
            if (!this.pipeline) {
                await this.loadModel();
            }
            
            // Generate response
            await this.generateResponse(message);
        },
        
        // Add message to chat
        addMessage: function(role, content) {
            const container = document.getElementById('aem-webai-messages');
            if (!container) return;
            
            const div = document.createElement('div');
            div.className = `aem-webai-chat__message aem-webai-chat__message--${role}`;
            
            const avatar = role === 'user' ? '👤' : '🤖';
            div.innerHTML = `
                <div class="aem-webai-chat__avatar">${avatar}</div>
                <div class="aem-webai-chat__bubble">${this.escapeHtml(content)}</div>
            `;
            
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
            
            this.history.push({ role, content });
        },
        
        // Escape HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        // Load TinyLlama model
        loadModel: async function() {
            if (this.pipeline || this.isLoading) return;
            
            this.isLoading = true;
            this.updateStatus('loading');
            
            try {
                console.log('[WebAI] Loading TinyLlama model...');
                
                // Check if transformers.js is available
                if (!window.transformers) {
                    await this.loadTransformers();
                }
                
                // Timeout handling
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Model loading timeout')), this.config.modelTimeout)
                );
                
                const loadPromise = window.transformers.pipeline(
                    'text-generation',
                    this.config.modelId,
                    {
                        device: this.config.device,
                        dtype: 'q4',
                        progress_callback: (progress) => {
                            console.log('[WebAI] Loading:', Math.round(progress * 100) + '%');
                        }
                    }
                );
                
                this.pipeline = await Promise.race([loadPromise, timeoutPromise]);
                
                this.isReady = true;
                this.retryCount = 0;
                this.updateStatus('ready');
                console.log('[WebAI] Model loaded successfully!');
                
            } catch (error) {
                console.error('[WebAI] Failed to load model:', error);
                
                // Retry logic
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log('[WebAI] Retrying...', this.retryCount + '/' + this.maxRetries);
                    this.updateStatus('loading', 'Retrying...');
                    setTimeout(() => this.loadModel(), 2000);
                } else {
                    this.updateStatus('error', 'Load failed');
                    this.addMessage('ai', 'Sorry, I failed to load the AI model after multiple attempts. Please refresh the page and try again. Alternatively, you can still use the WebMCP features directly.');
                }
            }
            
            this.isLoading = false;
        },
        
        // Load transformers.js from CDN with fallback
        loadTransformers: function(urlIndex = 0) {
            return new Promise((resolve, reject) => {
                if (window.transformers) {
                    resolve();
                    return;
                }
                
                if (urlIndex >= this.config.cdnUrls.length) {
                    reject(new Error('Failed to load transformers.js from all CDNs'));
                    return;
                }
                
                const script = document.createElement('script');
                script.src = this.config.cdnUrls[urlIndex];
                script.onload = () => {
                    console.log('[WebAI] Loaded transformers from:', this.config.cdnUrls[urlIndex]);
                    resolve();
                };
                script.onerror = () => {
                    console.warn('[WebAI] CDN failed, trying next...', urlIndex + 1);
                    this.loadTransformers(urlIndex + 1).then(resolve).catch(reject);
                };
                document.head.appendChild(script);
            });
        },
        
        // Generate AI response
        generateResponse: async function(userMessage) {
            this.updateStatus('thinking');
            
            try {
                // Build prompt with context
                const prompt = this.buildPrompt(userMessage);
                
                // Generate
                const output = await this.pipeline(
                    prompt,
                    {
                        max_new_tokens: this.config.maxTokens,
                        temperature: this.config.temperature,
                        do_sample: true,
                        top_p: 0.9,
                        top_k: 50
                    }
                );
                
                const response = output[0]?.generated_text?.replace(prompt, '')?.trim() || 
                    "I'm sorry, I couldn't generate a response.";
                
                // Check for function calls
                const functionResponse = this.parseFunctionCall(response);
                if (functionResponse) {
                    this.addMessage('ai', functionResponse.message);
                    if (functionResponse.execute) {
                        setTimeout(() => functionResponse.execute(), 500);
                    }
                } else {
                    this.addMessage('ai', response);
                }
                
            } catch (error) {
                console.error('[WebAI] Generation error:', error);
                this.addMessage('ai', 'Sorry, I encountered an error. Please try again.');
            }
            
            this.updateStatus('ready');
        },
        
        // Build prompt with context
        buildPrompt: function(userMessage) {
            const functionDescriptions = Object.entries(this.functions)
                .map(([name, fn]) => `- ${name}: ${fn.description}`)
                .join('\n');
            
            const recentHistory = this.history.slice(-4)
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');
            
            return `<|system|>
You are a helpful AI assistant for this website.
You have access to these functions:
${functionDescriptions}

If you need to perform an action, respond with the function name and parameters in this format:
[FUNCTION_CALL] function_name {"param": "value"} [/FUNCTION_CALL]

Otherwise, respond naturally to the user.

Recent conversation:
${recentHistory}

<|user|>
${userMessage}
<|assistant|>
`;
        },
        
        // Parse function call from response
        parseFunctionCall: function(response) {
            const match = response.match(/\[FUNCTION_CALL\]\s*(\w+)\s*(\{[^}]+\})\s*\[\/FUNCTION_CALL\]/);
            
            if (match) {
                const fnName = match[1];
                const fn = this.functions[fnName];
                
                if (fn) {
                    try {
                        const params = JSON.parse(match[2]);
                        const result = fn.execute(params);
                        return {
                            message: `Executing ${fnName}...`,
                            execute: () => console.log('[WebAI] Executed:', fnName, params)
                        };
                    } catch (e) {
                        return { message: `Failed to parse parameters for ${fnName}` };
                    }
                }
            }
            return null;
        },
        
        // Clear chat
        clear: function() {
            this.history = [];
            const container = document.getElementById('aem-webai-messages');
            if (container) {
                container.innerHTML = `
                    <div class="aem-webai-chat__message aem-webai-chat__message--ai">
                        <div class="aem-webai-chat__avatar">🤖</div>
                        <div class="aem-webai-chat__bubble">
                            Hello! I'm an AI assistant powered by TinyLlama running locally in your browser. 
                            I can help you navigate this site, search for content, fill forms, and more. 
                            What would you like to do?
                        </div>
                    </div>
                `;
            }
        }
    };
    
    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AEMWebAI.init());
    } else {
        AEMWebAI.init();
    }
    
    // Expose globally
    window.AEMWebAI = AEMWebAI;
    
})(document, window);
