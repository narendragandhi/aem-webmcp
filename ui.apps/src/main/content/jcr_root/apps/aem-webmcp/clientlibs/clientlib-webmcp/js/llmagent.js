/**
 * AEM WebMCP LLM Agent
 * Unified interface for Local LLM (window.ai / Gemini Nano)
 */
(function (document, window) {
    'use strict';

    const LLMAgent = {
        session: null,
        capabilities: null,

        /**
         * Initialize the LLM session
         */
        async init() {
            if (window.ai && (window.ai.assistant || window.ai.languageModel)) {
                try {
                    const ai = window.ai.assistant || window.ai.languageModel;
                    this.capabilities = await ai.capabilities();
                    if (this.capabilities.available !== 'no') {
                        this.session = await ai.create({
                            temperature: 0.7,
                            topK: 3
                        });
                        console.log('[LLMAgent] Local Gemini Nano session initialized');
                        return true;
                    }
                } catch (e) {
                    console.warn('[LLMAgent] Local AI initialization failed, falling back to server-side', e);
                }
            }
            
            console.log('[LLMAgent] Local AI not available, will use server-side AEM proxy');
            return true; // We can still work via proxy
        },

        /**
         * Generate text based on a prompt (Hybrid Routing)
         */
        async generate(prompt, systemPrompt = '') {
            // 1. Try Local AI if available
            if (this.session) {
                try {
                    const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt;
                    return await this.session.prompt(fullPrompt);
                } catch (e) {
                    console.warn('[LLMAgent] Local generation failed, trying server-side', e);
                }
            }

            // 2. Fallback to Server-side AEM Proxy
            return await this._generateServerSide(prompt, systemPrompt);
        },

        async _generateServerSide(prompt, systemPrompt) {
            try {
                // Get current page path for selector-based servlet call
                const pagePath = window.location.pathname.replace('.html', '');
                const response = await fetch(`${pagePath}.webai-chat.json`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        message: prompt,
                        systemPrompt: systemPrompt,
                        sessionId: this.sessionId || 'aem-webmcp-session'
                    })
                });
                
                if (!response.ok) throw new Error(`Server returned ${response.status}`);
                const data = await response.json();
                return data.response;
            } catch (e) {
                console.error('[LLMAgent] Server-side generation failed:', e);
                return null;
            }
        },

        /**
         * Stream response (for better UI feedback)
         */
        async *generateStream(prompt, systemPrompt = '') {
            if (!this.session) {
                const initialized = await this.init();
                if (!initialized) return;
            }

            try {
                const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt;
                const stream = this.session.promptStreaming(fullPrompt);
                for await (const chunk of stream) {
                    yield chunk;
                }
            } catch (e) {
                console.error('[LLMAgent] Streaming failed:', e);
            }
        },

        /**
         * Specialized: Parse structured intent from text
         */
        async parseIntent(text, schema) {
            const systemPrompt = `You are an intent parser. Extract data from the user input according to this JSON schema: ${JSON.stringify(schema)}. Return ONLY valid JSON.`;
            const result = await this.generate(text, systemPrompt);
            try {
                // Find JSON in the response
                const jsonMatch = result.match(/\{.*\}/s);
                return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch (e) {
                console.error('[LLMAgent] Intent parsing failed:', e);
                return null;
            }
        }
    };

    window.AEMLLMAgent = LLMAgent;

})(document, window);
