/**
 * AEM WebMCP Audit Agent
 * Checks for semantic accessibility issues on the page.
 */
(function (document, window) {
    'use strict';

    const AuditAgent = {
        issues: [],

        /**
         * 1. Scan: Get all components relevant to accessibility
         */
        async scanPage() {
            if (!window.AEMWebMCP) return;
            
            this.issues = [];
            
            try {
                const images = await window.AEMWebMCP.getComponents('media');
                if (Array.isArray(images)) {
                    for (const imgComp of images) {
                        if (!imgComp.selector) continue;
                        try {
                            const info = await window.AEMWebMCP.getElementInfo({ selector: imgComp.selector });
                            if (info && info.success) {
                                const img = document.querySelector(imgComp.selector)?.querySelector('img');
                                if (img && !img.alt) {
                                    this.reportIssue('Image missing alt text', imgComp.selector);
                                } else if (img && img.alt.length < 5) {
                                    this.reportIssue('Image alt text is too short', imgComp.selector);
                                }
                            }
                        } catch (e) { /* skip */ }
                    }
                }

                const headings = await window.AEMWebMCP.getComponents('content');
                let lastLevel = 0;
                
                if (Array.isArray(headings)) {
                    for (const hComp of headings) {
                        if (!hComp.selector) continue;
                        try {
                            const el = document.querySelector(hComp.selector);
                            if (!el) continue;
                            const tag = el.tagName;
                            if (/H[1-6]/.test(tag)) {
                                const level = parseInt(tag.substring(1));
                                if (level > lastLevel + 1 && lastLevel !== 0) {
                                    this.reportIssue('Skipped heading level from H' + lastLevel + ' to H' + level, hComp.selector);
                                }
                                lastLevel = level;
                            }
                        } catch (e) { /* skip */ }
                    }
                }
            } catch (e) {
                console.warn('[AuditAgent] scanPage failed:', e.message);
            }
            
            this.summarize();
        },

        reportIssue(msg, selector) {
            this.issues.push({ message: msg, selector: selector });
            console.warn(`[AuditAgent] Issue: ${msg} at ${selector}`);
            
            // Visually highlight in debug mode
            if (window.WEBMCP_DEBUG) {
                const el = document.querySelector(selector);
                if (el) el.style.border = '2px solid red';
            }
        },

        summarize() {
            const count = this.issues.length;
            if (count > 0) {
                const msg = `I found ${count} accessibility issues on this page. Check the console for details.`;
                window.AEMWebMCP.speakText({ text: msg });
            } else {
                window.AEMWebMCP.speakText({ text: 'This page looks good for basic accessibility!' });
            }
        }
    };

    window.AEMAuditAgent = AuditAgent;

})(document, window);
