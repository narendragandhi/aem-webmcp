/**
 * AEM WebMCP Content Agent (In-Page RAG)
 * Answers user questions based on the current page content.
 */
(function (document, window) {
    'use strict';

    const ContentAgent = {
        pageContent: '',
        chunks: [],

        /**
         * 1. Ingest: Read the page content using WebMCP tools
         */
        async indexPage() {
            if (!window.AEMWebMCP) return;

            try {
                const components = await window.AEMWebMCP.getComponents('content');
                if (!Array.isArray(components) || components.length === 0) return;

                let fullText = '';

                for (const comp of components) {
                    if (!comp.selector) continue;
                    try {
                        const info = await window.AEMWebMCP.getElementInfo({ selector: comp.selector });
                        if (info && info.success && info.text) {
                            fullText += info.text + '\n\n';
                        }
                    } catch (e) { /* skip individual component */ }
                }

                const pageInfo = await window.AEMWebMCP.getPageInfo();
                if (pageInfo && pageInfo.title) {
                    fullText = 'Page Title: ' + pageInfo.title + '\nURL: ' + (pageInfo.url || '') + '\n\n' + fullText;
                }

                this.pageContent = fullText;
                this.chunks = this.createChunks(fullText);
                console.log('[ContentAgent] Indexed page content length:', this.pageContent.length);
            } catch (e) {
                console.warn('[ContentAgent] indexPage failed:', e.message);
            }
        },

        /**
         * 2. Chunking: Simple sentence/paragraph splitter
         */
        createChunks(text) {
            // Split by double newlines or periods to create manageable context chunks
            return text.split(/\n\n|\. /).filter(c => c.length > 20);
        },

        /**
         * 3. Retrieval & Generation: Find relevant chunks and use LLM to answer
         */
        async ask(question) {
            if (!this.pageContent) await this.indexPage();
            if (!this.pageContent) return "I need to index the page first. Please try again.";
            
            const keywords = question.toLowerCase().replace(/[?.,]/g, '').split(' ')
                .filter(w => w.length > 3 && !['what', 'where', 'when', 'does', 'this', 'have'].includes(w));
            
            // Score chunks based on keyword matches
            const scoredChunks = this.chunks.map(chunk => {
                let score = 0;
                keywords.forEach(kw => {
                    if (chunk.toLowerCase().includes(kw)) score++;
                });
                return { chunk, score };
            }).sort((a, b) => b.score - a.score);

            const relevantContext = scoredChunks.slice(0, 3).filter(c => c.score > 0).map(c => c.chunk).join('\n\n');
            
            if (relevantContext && window.AEMLLMAgent) {
                const systemPrompt = `You are a helpful assistant for this website. Answer the user's question based ONLY on the provided context. If the answer isn't in the context, say "I couldn't find that information on this page."\n\nContext:\n${relevantContext}`;
                const answer = await window.AEMLLMAgent.generate(question, systemPrompt);
                
                if (answer) {
                    console.log('[ContentAgent] LLM Answer:', answer);
                    window.AEMWebMCP.speakText({ text: answer });
                    return answer;
                }
            }

            // Fallback to simple matching
            return this.fallbackAsk(question, scoredChunks[0]);
        },

        fallbackAsk(question, topMatch) {
            if (topMatch && topMatch.score > 0) {
                const answer = `Based on this page: ${topMatch.chunk}`;
                window.AEMWebMCP.speakText({ text: answer });
                return answer;
            } else {
                const fallback = "I couldn't find that information on this page.";
                window.AEMWebMCP.speakText({ text: fallback });
                return fallback;
            }
        }
    };

    // Lazy-index: only when explicitly asked, not on load (consent may not be granted yet)
    window.AEMContentAgent = ContentAgent;

})(document, window);
