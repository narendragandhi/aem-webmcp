/**
 * AEM WebMCP Form Agent
 * Bridges Web AI dialogue with WebMCP Form Tools
 */
(function (document, window) {
    'use strict';

    const FormAgent = {
        activeForm: null,
        requiredFields: [],
        collectedData: {},

        allFields: [],

        /**
         * 1. Discovery: Find the first or best form on the page
         */
        async discoverForm() {
            if (!window.AEMWebMCP) return null;
            
            const components = await window.AEMWebMCP.getComponents();
            
            // 1. Prioritize by ID if we know we're looking for a specific one
            let formComp = components.find(c => c.selector && c.selector.includes('#contact-form'));
            
            // 2. Fallback to any component with action 'form'
            if (!formComp) {
                formComp = components.find(c => c.action === 'form');
            }
            
            if (formComp) {
                this.activeForm = formComp;
                console.log('[FormAgent] Discovered form:', this.activeForm.selector);
                return this.activeForm;
            }
            return null;
        },

        /**
         * 2. Analysis: Get the fields and build the "interview" plan
         */
        async analyzeFields() {
            if (!this.activeForm) return [];
            
            const result = await window.AEMWebMCP.getFormFields({ selector: this.activeForm.selector });
            if (result.success) {
                this.allFields = result.fields;
                this.requiredFields = result.fields.filter(f => f.required);
                console.log('[FormAgent] Discovered fields:', this.allFields.length);
                return this.allFields;
            }
            return [];
        },

        /**
         * 3. Dialogue: Map user natural language to form fields
         */
        async processInput(text) {
            console.log('[FormAgent] Processing input:', text);
            if (window.AEMLLMAgent && window.AEMLLMAgent.session) {
                try {
                    const schema = {
                        type: "object",
                        properties: this.allFields.reduce((acc, f) => {
                            acc[f.name] = { type: "string", description: `The value for field ${f.label || f.name}` };
                            return acc;
                        }, {})
                    };

                    const intent = await window.AEMLLMAgent.parseIntent(text, schema);
                    if (intent) {
                        console.log('[FormAgent] LLM Intent parsed:', intent);
                        for (const [name, value] of Object.entries(intent)) {
                            if (value && value !== "unknown") {
                                await this.fillField(name, value);
                                // Design: Small staggered delay between fields
                                await new Promise(r => setTimeout(r, 200));
                            }
                        }
                        return;
                    }
                } catch (e) {
                    console.warn('[FormAgent] LLM processing failed, using fallback', e);
                }
            }

            console.log('[FormAgent] Using pattern-matching fallback for input');
            this.fallbackProcessInput(text);
        },

        fallbackProcessInput(text) {
            // Original pattern matcher logic...
            const patterns = {
                email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
                phone: /\d{3}-\d{3}-\d{4}/,
                zip: /\d{5}/
            };

            for (const field of this.allFields) {
                if (patterns[field.name] && text.match(patterns[field.name])) {
                    const val = text.match(patterns[field.name])[0];
                    await this.fillField(field.name, val);
                } else if (text.toLowerCase().includes(field.name.toLowerCase())) {
                    const parts = text.split(/is|is:|:|was/i);
                    if (parts.length > 1) {
                        await this.fillField(field.name, parts[1].trim());
                    }
                }
            }
        },

        /**
         * 4. Action: Fill the actual DOM via WebMCP
         */
        async fillField(name, value) {
            console.log(`[FormAgent] Attempting to fill field: "${name}" with value: "${value}"`);
            
            // Debug: Log all inputs in the form
            const formEl = document.querySelector(this.activeForm.selector);
            if (formEl) {
                const inputs = Array.from(formEl.querySelectorAll('input, textarea, select'));
                console.log(`[FormAgent] Form has ${inputs.length} inputs:`, inputs.map(i => i.name).join(', '));
            }

            // Try specific selector first
            let selector = `${this.activeForm.selector} [name="${name}"]`;
            
            // Fallback: search globally if the form selector is just a class or might be unstable
            if (!document.querySelector(selector)) {
                console.log(`[FormAgent] Selector "${selector}" not found, trying global name search`);
                selector = `input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`;
            }

            const target = document.querySelector(selector);
            if (target) {
                console.log(`[FormAgent] Found target element for "${name}", calling AEMWebMCP.fillForm`);
                const result = await window.AEMWebMCP.fillForm({
                    selector: selector,
                    value: value
                });
                console.log(`[FormAgent] AEMWebMCP.fillForm result for "${name}":`, JSON.stringify(result));
            } else {
                console.error(`[FormAgent] Could not find any element for name="${name}" with selector "${selector}"`);
            }
            
            this.collectedData[name] = value;
            this.checkProgress();
        },

        checkProgress() {
            const remaining = this.requiredFields.filter(f => !this.collectedData[f.name]);
            if (remaining.length === 0) {
                console.log('[FormAgent] All fields collected. Ready to submit!');
                window.AEMWebMCP.speakText({ text: "I've filled out the form for you. Would you like me to submit it?" });
            } else {
                const next = remaining[0];
                window.AEMWebMCP.speakText({ text: `Got it. Now, what is your ${next.name}?` });
            }
        }
    };

    window.AEMFormAgent = FormAgent;

})(document, window);
