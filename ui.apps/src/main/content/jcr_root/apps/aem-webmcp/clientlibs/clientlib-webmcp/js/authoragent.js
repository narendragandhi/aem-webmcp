/**
 * AEM WebMCP Author Agent
 * Helps authors optimize and test pages in the AEM Editor.
 */
(function (document, window) {
    'use strict';

    const AuthorAgent = {
        isAuthorMode: false,

        /**
         * Initialize Author Mode
         */
        init() {
            // Check if we are in AEM Author Editor
            if (window.location.pathname.includes('/editor.html') || window.AEM_AUTHOR_MODE) {
                this.isAuthorMode = true;
                this.setupAuthorUI();
                console.log('[AuthorAgent] Author Mode detected and initialized');
            }
        },

        setupAuthorUI() {
            // We could add a floating button or integrate with the debug panel
            if (window.AEMWebMCPAutomator) {
                window.AEMWebMCPAutomator.registerTool({
                    name: "optimizePage",
                    description: "Scan the page for authoring optimizations (SEO, Alt text, hierarchy)",
                    parameters: {}
                }, () => this.runOptimizationScan());
            }
        },

        /**
         * Scan page for author-specific optimizations
         */
        async runOptimizationScan() {
            if (!window.AEMWebMCP) return;

            window.AEMWebMCP.speakText({ text: "Starting authoring optimization scan..." });
            
            const results = [];
            
            // 1. Check for missing Image Alt text (AI suggested)
            const images = await window.AEMWebMCP.getComponents('media');
            for (const imgComp of images) {
                const img = document.querySelector(imgComp.selector)?.querySelector('img');
                if (img && !img.alt) {
                    // Use ImageTagger to suggest alt text
                    if (window.AEMWebMCP.ImageTagger) {
                        const tags = await window.AEMWebMCP.ImageTagger.tag(img.src);
                        const suggestion = tags.tags?.slice(0, 3).map(t => t.name).join(', ');
                        results.push({
                            type: 'Image Optimization',
                            message: `Missing Alt text. Suggested based on AI: "A photo of ${suggestion}"`,
                            selector: imgComp.selector
                        });
                    }
                }
            }

            // 2. SEO Check: Missing Meta Description or Page Title issues
            const pageInfo = await window.AEMWebMCP.getPageInfo();
            if (pageInfo.title.length < 10) {
                results.push({
                    type: 'SEO',
                    message: 'Page title is very short. Consider a more descriptive title for better SEO.',
                    selector: 'head title'
                });
            }

            // 3. Accessibility: Link descriptive text
            const links = document.querySelectorAll('a');
            links.forEach(link => {
                const text = link.textContent.trim().toLowerCase();
                if (['click here', 'read more', 'learn more'].includes(text)) {
                    results.push({
                        type: 'Accessibility',
                        message: `Non-descriptive link text "${text}". Use more specific text for screen readers.`,
                        selector: window.AEMWebMCPAutomator.getSelector(link)
                    });
                }
            });

            this.displayResults(results);
        },

        displayResults(results) {
            if (results.length === 0) {
                window.AEMWebMCP.speakText({ text: "Great job! I found no major optimization opportunities." });
                return;
            }

            console.table(results);
            window.AEMWebMCP.speakText({ text: `I found ${results.length} optimizations. See the console or debug panel for details.` });
            
            // Highlight in the UI if debug is on
            results.forEach(res => {
                const el = document.querySelector(res.selector);
                if (el) {
                    el.style.outline = '3px dashed #ff8800';
                    el.title = res.message;
                }
            });
        }
    };

    window.AEMAuthorAgent = AuthorAgent;
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AuthorAgent.init());
    } else {
        AuthorAgent.init();
    }

})(document, window);
