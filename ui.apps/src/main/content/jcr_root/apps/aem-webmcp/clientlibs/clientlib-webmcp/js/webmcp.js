/**
 * AEM WebMCP Auto-Enhancer - Comprehensive Version
 * 
 * Automatically enhances AEM Core Components with WebMCP AI agent capabilities.
 * Detects component type and adds appropriate structured data and actions.
 * 
 * Supports 30+ Core Components with full interaction capabilities.
 * Version: 1.1.0 - Enhanced with more interactions and debugging
 */

(function (document, window) {
    'use strict';

    const AEMWebMCPAutomator = {
        
        version: '1.1.0',
        debug: window.WEBMCP_DEBUG || false,
        enabled: window.WEBMCP_ENABLED !== false,
        consentGiven: window.WEBMCP_CONSENT === true,
        
        /**
         * Complete Core Components mapping to WebMCP actions
         * Includes all major AEM Core Components
         */
        componentMappings: {
            // ==================== COMMERCE COMPONENTS ====================
            'core/wcm/components/search/v1/search': { category: 'commerce', action: 'search', description: 'Site search functionality', interactions: ['submit', 'clear'] },
            'core/wcm/components/search/v2/search': { category: 'commerce', action: 'search', description: 'Site search functionality', interactions: ['submit', 'clear'] },
            'core/wcm/components/search': { category: 'commerce', action: 'search', description: 'Site search functionality', interactions: ['submit', 'clear'],
                fields: { query: { type: 'string', description: 'Search query' } }
            },
            
            'core/wcm/components/commerce/cart': { category: 'commerce', action: 'shopping-cart', description: 'Shopping cart', interactions: ['update-quantity', 'remove-item', 'checkout'],
                getData: function(el) { return { items: this.getCartItems(el), subtotal: this.getText(el, '.cart-total'), itemCount: el.querySelectorAll('.cart-item').length }; }
            },
            'core/wcm/components/cart': { category: 'commerce', action: 'shopping-cart', description: 'Shopping cart', interactions: ['update-quantity', 'remove-item', 'checkout'],
                getData: function(el) { return { items: this.getCartItems(el), itemCount: el.querySelectorAll('.cart-item').length }; }
            },
            
            'core/wcm/components/commerce/product': { category: 'commerce', action: 'product', description: 'Product display', interactions: ['add-to-cart', 'add-to-wishlist'] },
            'core/wcm/components/product': { category: 'commerce', action: 'product', description: 'Product display', interactions: ['add-to-cart'] },
            'core/wcm/components/commerce/featuredproducts': { category: 'commerce', action: 'featured-products', description: 'Featured products', interactions: ['view-all'] },
            
            'core/wcm/components/commerce/productlist': { category: 'commerce', action: 'product-list', description: 'Product list', interactions: ['filter', 'sort', 'paginate'],
                getData: function(el) { return { products: el.querySelectorAll('.product-item, [data-product]').length }; }
            },
            'core/wcm/components/commerce/wishlist': { category: 'commerce', action: 'wishlist', description: 'Wishlist', interactions: ['add', 'remove', 'view'] },
            'core/wcm/components/commerce/checkout': { category: 'commerce', action: 'checkout', description: 'Checkout', interactions: ['proceed', 'back', 'apply-coupon'] },
            'core/wcm/components/commerce/orders': { category: 'commerce', action: 'order-history', description: 'Order history', interactions: ['view', 'reorder'] },

            // ==================== NAVIGATION COMPONENTS ====================
            'core/wcm/components/navigation/v1/navigation': { category: 'navigation', action: 'navigation', description: 'Site navigation', interactions: ['navigate', 'expand', 'collapse'],
                getData: function(el) { return this.parseNavigation(el); }
            },
            'core/wcm/components/navigation/v2/navigation': { category: 'navigation', action: 'navigation', description: 'Site navigation', interactions: ['navigate', 'expand', 'collapse'],
                getData: function(el) { return this.parseNavigation(el); }
            },
            'core/wcm/components/navigation': { category: 'navigation', action: 'navigation', description: 'Site navigation', interactions: ['navigate'],
                getData: function(el) { return this.parseNavigation(el); }
            },
            
            'core/wcm/components/languagenavigation/v1/languagenavigation': { category: 'navigation', action: 'language-navigation', description: 'Language selector', interactions: ['select-language'],
                getData: function(el) { return { languages: Array.from(el.querySelectorAll('a')).map(a => ({ label: a.textContent.trim(), href: a.href })) }; }
            },
            'core/wcm/components/languagenavigation': { category: 'navigation', action: 'language-navigation', description: 'Language selector', interactions: ['select-language'] },
            
            'core/wcm/components/breadcrumb/v1/breadcrumb': { category: 'navigation', action: 'breadcrumb', description: 'Breadcrumb', interactions: ['navigate'],
                getData: function(el) { return { items: Array.from(el.querySelectorAll('nav ol li')).map(li => ({ label: li.textContent.trim(), href: li.querySelector('a')?.href })) }; }
            },
            'core/wcm/components/breadcrumb/v2/breadcrumb': { category: 'navigation', action: 'breadcrumb', description: 'Breadcrumb', interactions: ['navigate'],
                getData: function(el) { return { items: Array.from(el.querySelectorAll('li')).map(li => ({ label: li.textContent.trim(), href: li.querySelector('a')?.href })) }; }
            },
            'core/wcm/components/breadcrumb/v3/breadcrumb': { category: 'navigation', action: 'breadcrumb', description: 'Breadcrumb', interactions: ['navigate'] },
            'core/wcm/components/breadcrumb': { category: 'navigation', action: 'breadcrumb', description: 'Breadcrumb', interactions: ['navigate'] },

            // ==================== CONTENT COMPONENTS ====================
            'core/wcm/components/text/v1/text': { category: 'content', action: 'text', description: 'Rich text content' },
            'core/wcm/components/text/v2/text': { category: 'content', action: 'text', description: 'Rich text content' },
            'core/wcm/components/text': { category: 'content', action: 'text', description: 'Rich text content',
                getData: function(el) { return { content: el.textContent?.trim().substring(0, 500) }; }
            },
            
            'core/wcm/components/title/v1/title': { category: 'content', action: 'title', description: 'Title/heading' },
            'core/wcm/components/title/v2/title': { category: 'content', action: 'title', description: 'Title/heading' },
            'core/wcm/components/title/v3/title': { category: 'content', action: 'title', description: 'Title/heading',
                getData: function(el) { return { text: el.textContent?.trim(), level: el.tagName }; }
            },
            'core/wcm/components/title': { category: 'content', action: 'title', description: 'Title/heading' },
            
            'core/wcm/components/image/v1/image': { category: 'content', action: 'image', description: 'Image' },
            'core/wcm/components/image/v2/image': { category: 'content', action: 'image', description: 'Image' },
            'core/wcm/components/image/v3/image': { category: 'content', action: 'image', description: 'Image',
                getData: function(el) { const img = el.querySelector('img'); return { src: img?.src, alt: img?.alt }; }
            },
            'core/wcm/components/image': { category: 'content', action: 'image', description: 'Image' },
            
            'core/wcm/components/teaser/v1/teaser': { category: 'content', action: 'teaser', description: 'Teaser/promotional content', interactions: ['click'] },
            'core/wcm/components/teaser/v2/teaser': { category: 'content', action: 'teaser', description: 'Teaser/promotional content', interactions: ['click'] },
            'core/wcm/components/teaser': { category: 'content', action: 'teaser', description: 'Teaser content',
                getData: function(el) { return { title: this.getText(el, 'h3'), link: el.querySelector('a')?.href }; }
            },
            
            'core/wcm/components/download/v1/download': { category: 'content', action: 'download', description: 'File download', interactions: ['download'] },
            'core/wcm/components/download/v2/download': { category: 'content', action: 'download', description: 'File download', interactions: ['download'] },
            'core/wcm/components/download': { category: 'content', action: 'download', description: 'File download' },
            
            'core/wcm/components/contentfragment/v1/contentfragment': { category: 'content', action: 'content-fragment', description: 'Content fragment' },
            'core/wcm/components/contentfragment': { category: 'content', action: 'content-fragment', description: 'Content fragment' },
            
            'core/wcm/components/contentfragmentlist': { category: 'content', action: 'content-fragment-list', description: 'Content fragment list' },
            
            'core/wcm/components/embed/v1/embed': { category: 'content', action: 'embed', description: 'Embedded content' },
            'core/wcm/components/embed/v2/embed': { category: 'content', action: 'embed', description: 'Embedded content' },
            'core/wcm/components/embed': { category: 'content', action: 'embed', description: 'Embedded content' },

            // ==================== LAYOUT COMPONENTS ====================
            'core/wcm/components/container/v1/container': { category: 'layout', action: 'container', description: 'Content container' },
            'core/wcm/components/container': { category: 'layout', action: 'container', description: 'Content container',
                getData: function(el) { return { children: el.children.length }; }
            },
            
            'core/wcm/components/accordion/v1/accordion': { category: 'layout', action: 'accordion', description: 'Accordion', interactions: ['expand', 'collapse', 'expand-all'],
                getData: function(el) { return { items: Array.from(el.querySelectorAll('.accordion__item')).map(i => ({ title: i.querySelector('.accordion__title')?.textContent?.trim(), expanded: i.classList.contains('expanded') })) }; }
            },
            'core/wcm/components/accordion': { category: 'layout', action: 'accordion', description: 'Accordion' },
            
            'core/wcm/components/tabs/v1/tabs': { category: 'layout', action: 'tabs', description: 'Tabs', interactions: ['select-tab', 'next', 'prev'],
                getData: function(el) { return { tabs: Array.from(el.querySelectorAll('[role="tab"]')).map(t => ({ label: t.textContent?.trim(), selected: t.getAttribute('aria-selected') === 'true' })) }; }
            },
            'core/wcm/components/tabs': { category: 'layout', action: 'tabs', description: 'Tabs' },
            
            'core/wcm/components/carousel/v1/carousel': { category: 'layout', action: 'carousel', description: 'Carousel/slider', interactions: ['next', 'prev', 'go-to-slide', 'play', 'pause'],
                getData: function(el) { return { slides: el.querySelectorAll('.carousel__item').length }; }
            },
            'core/wcm/components/carousel': { category: 'layout', action: 'carousel', description: 'Carousel' },
            
            'core/wcm/components/progressbar/v1/progressbar': { category: 'layout', action: 'progress-bar', description: 'Progress bar' },
            'core/wcm/components/progressbar': { category: 'layout', action: 'progress-bar', description: 'Progress bar' },
            
            'core/wcm/components/separator/v1/separator': { category: 'layout', action: 'separator', description: 'Separator' },
            'core/wcm/components/separator': { category: 'layout', action: 'separator', description: 'Separator' },
            
            'core/wcm/components/tableofcontents/v1/tableofcontents': { category: 'layout', action: 'table-of-contents', description: 'Table of contents' },
            'core/wcm/components/tableofcontents': { category: 'layout', action: 'table-of-contents', description: 'Table of contents' },

            // ==================== FORM COMPONENTS ====================
            'core/wcm/components/form/container/v1/container': { category: 'form', action: 'form', description: 'Form container', interactions: ['submit', 'reset'],
                getData: function(el) { return { fields: this.extractFormFields(el) }; }
            },
            'core/wcm/components/form/container/v2/container': { category: 'form', action: 'form', description: 'Form container', interactions: ['submit', 'reset'] },
            'core/wcm/components/form/container': { category: 'form', action: 'form', description: 'Form', interactions: ['submit', 'reset'] },
            
            'core/wcm/components/form/text/v1/text': { category: 'form', action: 'form-field', fieldType: 'text',
                getData: function(el) { const i = el.querySelector('input'); return { name: i?.name, type: i?.type, required: i?.required }; }
            },
            'core/wcm/components/form/text/v2/text': { category: 'form', action: 'form-field', fieldType: 'text' },
            'core/wcm/components/form/text': { category: 'form', action: 'form-field', fieldType: 'text' },
            
            'core/wcm/components/form/textarea/v1/textarea': { category: 'form', action: 'form-field', fieldType: 'textarea',
                getData: function(el) { const t = el.querySelector('textarea'); return { name: t?.name, required: t?.required }; }
            },
            'core/wcm/components/form/textarea': { category: 'form', action: 'form-field', fieldType: 'textarea' },
            
            'core/wcm/components/form/date/v1/date': { category: 'form', action: 'form-field', fieldType: 'date',
                getData: function(el) { const i = el.querySelector('input'); return { name: i?.name, required: i?.required }; }
            },
            'core/wcm/components/form/date': { category: 'form', action: 'form-field', fieldType: 'date' },
            
            'core/wcm/components/form/dropdown/v1/dropdown': { category: 'form', action: 'form-dropdown', fieldType: 'select',
                getData: function(el) { const s = el.querySelector('select'); return { name: s?.name, options: Array.from(s?.querySelectorAll('option') || []).map(o => o.value) }; }
            },
            'core/wcm/components/form/dropdown': { category: 'form', action: 'form-dropdown', fieldType: 'select' },
            
            'core/wcm/components/form/checkbox/v1/checkbox': { category: 'form', action: 'form-checkbox', fieldType: 'checkbox' },
            'core/wcm/components/form/checkbox': { category: 'form', action: 'form-checkbox', fieldType: 'checkbox' },
            
            'core/wcm/components/form/radio/v1/radio': { category: 'form', action: 'form-radio', fieldType: 'radio' },
            'core/wcm/components/form/radio': { category: 'form', action: 'form-radio', fieldType: 'radio' },
            
            'core/wcm/components/form/fileupload/v1/fileupload': { category: 'form', action: 'form-file-upload', fieldType: 'file',
                interactions: ['upload', 'clear'] 
            },
            'core/wcm/components/form/fileupload': { category: 'form', action: 'form-file-upload', fieldType: 'file' },
            
            'core/wcm/components/form/button/v1/button': { category: 'form', action: 'form-button', fieldType: 'button' },
            'core/wcm/components/form/button/v2/button': { category: 'form', action: 'form-button', fieldType: 'button' },
            'core/wcm/components/form/button': { category: 'form', action: 'form-button', fieldType: 'button' },
            
            'core/wcm/components/form/hidden/v1/hidden': { category: 'form', action: 'form-hidden', fieldType: 'hidden' },
            'core/wcm/components/form/hidden/v2/hidden': { category: 'form', action: 'form-hidden', fieldType: 'hidden' },
            'core/wcm/components/form/hidden': { category: 'form', action: 'form-hidden', fieldType: 'hidden' },
            
            'core/wcm/components/form/options/v1/options': { category: 'form', action: 'form-options', fieldType: 'options' },
            'core/wcm/components/form/options/v2/options': { category: 'form', action: 'form-options', fieldType: 'options' },
            'core/wcm/components/form/options': { category: 'form', action: 'form-options', fieldType: 'options' },

            // ==================== MEDIA COMPONENTS ====================
            'core/wcm/components/pdfviewer/v1/pdfviewer': { category: 'media', action: 'pdf-viewer', description: 'PDF viewer', interactions: ['download', 'print', 'zoom'] },
            'core/wcm/components/pdfviewer': { category: 'media', action: 'pdf-viewer', description: 'PDF viewer' },

            // ==================== AEM WebMCP COMPONENTS ====================
            'aem-webmcp/components/form/container': { category: 'form', action: 'form', description: 'Contact Form', interactions: ['submit', 'reset'] },
            'aem-webmcp/components/search': { category: 'search', action: 'search', description: 'Site Search' },
            'aem-webmcp/components/cart': { category: 'commerce', action: 'shopping-cart', description: 'Shopping Cart' },
            'aem-webmcp/components/navigation': { category: 'navigation', action: 'navigation', description: 'Site Navigation' },
            
            // ==================== EXPERIENCE FRAGMENTS ====================
            'core/wcm/components/experiencefragment/v1/experiencefragment': { category: 'experience', action: 'experience-fragment', description: 'Experience fragment' },
            'core/wcm/components/experiencefragment/v2/experiencefragment': { category: 'experience', action: 'experience-fragment', description: 'Experience fragment' },
            'core/wcm/components/experiencefragment': { category: 'experience', action: 'experience-fragment', description: 'Experience fragment' },

            // ==================== SOCIAL & COMMUNITY COMPONENTS ====================
            'core/wcm/components/comments': { category: 'social', action: 'comments', description: 'Comments section', interactions: ['post', 'reply', 'like', 'delete'] },
            'core/wcm/components/comments/v1/comments': { category: 'social', action: 'comments', description: 'Comments', interactions: ['post', 'reply'] },
            
            'core/wcm/components/sharing': { category: 'social', action: 'social-share', description: 'Social sharing', interactions: ['share'],
                getData: function(el) { return { platforms: Array.from(el.querySelectorAll('a')).map(a => ({ label: a.getAttribute('aria-label') || a.href, href: a.href })) }; }
            },
            'core/wcm/components/sharing/v1/sharing': { category: 'social', action: 'social-share', description: 'Share content' },
            
            'core/wcm/components/voting': { category: 'social', action: 'voting', description: 'Voting/rating', interactions: ['vote-up', 'vote-down', 'rate'],
                getData: function(el) { return { upVotes: el.querySelectorAll('[aria-label*="up"], .vote-up').length, downVotes: el.querySelectorAll('[aria-label*="down"], .vote-down').length }; }
            },
            'core/wcm/components/voting/v1/voting': { category: 'social', action: 'voting', description: 'Vote on content' },
            
            // ==================== ADDITIONAL COMMERCE COMPONENTS ====================
            'core/wcm/components/commerce/price': { category: 'commerce', action: 'price', description: 'Price display', interactions: ['add-to-cart'] },
            'core/wcm/components/price': { category: 'commerce', action: 'price', description: 'Product price' },
            
            'core/wcm/components/commerce/swatch': { category: 'commerce', action: 'swatch', description: 'Color swatch selector', interactions: ['select'] },
            'core/wcm/components/swatch': { category: 'commerce', action: 'swatch', description: 'Variant selector' },
            
            // ==================== ADDITIONAL LAYOUT COMPONENTS ====================
            'core/wcm/components/list': { category: 'content', action: 'content-list', description: 'Content list',
                getData: function(el) { return { items: el.querySelectorAll('li, .list-item').length }; }
            },
            'core/wcm/components/list/v1/list': { category: 'content', action: 'content-list', description: 'List of content' },
            
            'core/wcm/components/carousel/v2/carousel': { category: 'layout', action: 'carousel', description: 'Carousel/slider', interactions: ['next', 'prev', 'go-to-slide', 'play', 'pause'],
                getData: function(el) { return { slides: el.querySelectorAll('.carousel__item, .cmp-carousel__item').length }; }
            },
            
            // ==================== QUICK SEARCH ====================
            'core/wcm/components/quicksearch': { category: 'commerce', action: 'quick-search', description: 'Quick search/autocomplete', interactions: ['search', 'select-result'],
                getData: function(el) { return { suggestions: el.querySelectorAll('.suggestion, [role="option"]').length }; }
            },
            
            // ==================== LANGUAGE STRUCTURE ====================
            'core/wcm/components/languagenavigation/v2/languagenavigation': { category: 'navigation', action: 'language-navigation', description: 'Language selector', interactions: ['select-language'],
                getData: function(el) { return { languages: Array.from(el.querySelectorAll('a')).map(a => ({ label: a.textContent.trim(), href: a.href, active: a.classList.contains('active') })) }; }
            }
        },
        
        /**
         * Initialize the automator
         */
        init: function() {
            if (!this.enabled) {
                this.debug && console.log('[WebMCP] Disabled via WEBMCP_ENABLED flag');
                return;
            }
            
            this.debug && console.log('[WebMCP] Initializing AEM WebMCP Automator v' + this.version);
            
            // Always expose the API for JS-based agents and testing
            this.exposeWebMCPAPI();
            this.enhanceAllComponents();
            
            if (this.debug || window.WEBMCP_SHOW_PANEL) {
                this.createDebugPanel();
            }
            
            this.debug && console.log('[WebMCP] Ready - enhanced', 
                document.querySelectorAll('[data-webmcp-action]').length, 'components');
        },
        
        /**
         * Check if consent is given for WebMCP exposure
         */
        canExposeAPI: function() {
            if (this.consentGiven) return true;
            if (window.WEBMCP_AUTO_CONSENT === true) {
                this.consentGiven = true;
                return true;
            }
            return false;
        },
        
        /**
         * Create debug panel to visualize WebMCP components
         */
        createDebugPanel: function() {
            if (document.getElementById('webmcp-debug-panel')) return;
            
            const panel = document.createElement('div');
            panel.id = 'webmcp-debug-panel';
            panel.innerHTML = `
                <style>
                    #webmcp-debug-panel {
                        position: fixed;
                        bottom: 10px;
                        right: 10px;
                        width: 350px;
                        max-height: 400px;
                        background: #1a1a2e;
                        color: #eee;
                        font-family: monospace;
                        font-size: 12px;
                        padding: 15px;
                        border-radius: 8px;
                        z-index: 999999;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                        overflow: auto;
                    }
                    #webmcp-debug-panel h3 {
                        margin: 0 0 10px 0;
                        color: #00d9ff;
                        font-size: 14px;
                        border-bottom: 1px solid #333;
                        padding-bottom: 8px;
                    }
                    #webmcp-debug-panel .webmcp-stat {
                        display: flex;
                        justify-content: space-between;
                        padding: 4px 0;
                        border-bottom: 1px solid #333;
                    }
                    #webmcp-debug-panel .webmcp-stat-label { color: #888; }
                    #webmcp-debug-panel .webmcp-stat-value { color: #00ff88; }
                    #webmcp-debug-panel .webmcp-components {
                        margin-top: 10px;
                        max-height: 250px;
                        overflow: auto;
                    }
                    #webmcp-debug-panel .webmcp-comp-item {
                        padding: 4px 8px;
                        margin: 2px 0;
                        background: #16213e;
                        border-radius: 4px;
                        font-size: 11px;
                    }
                    #webmcp-debug-panel .webmcp-comp-category { color: #ff6b6b; }
                    #webmcp-debug-panel .webmcp-comp-action { color: #4ecdc4; }
                    #webmcp-debug-panel .webmcp-comp-desc { color: #aaa; font-size: 10px; }
                    #webmcp-debug-panel .close-btn {
                        position: absolute;
                        top: 5px;
                        right: 10px;
                        cursor: pointer;
                        color: #666;
                    }
                </style>
                <span class="close-btn" onclick="this.parentElement.remove()">✕</span>
                <h3>🤖 AEM WebMCP Debug</h3>
                <div class="webmcp-stats"></div>
                <div class="webmcp-components"></div>
            `;
            document.body.appendChild(panel);
            
            const components = this.getAllComponents();
            const categories = {};
            components.forEach(c => { categories[c.category] = (categories[c.category] || 0) + 1; });
            
            const stats = panel.querySelector('.webmcp-stats');
            stats.innerHTML = `
                <div class="webmcp-stat"><span class="webmcp-stat-label">Total Components</span><span class="webmcp-stat-value">${components.length}</span></div>
                <div class="webmcp-stat"><span class="webmcp-stat-label">Categories</span><span class="webmcp-stat-value">${Object.keys(categories).length}</span></div>
                ${Object.entries(categories).map(([cat, count]) => 
                    `<div class="webmcp-stat"><span class="webmcp-stat-label">${cat}</span><span class="webmcp-stat-value">${count}</span></div>`
                ).join('')}
            `;
            
            const compList = panel.querySelector('.webmcp-components');
            compList.innerHTML = components.map(c => `
                <div class="webmcp-comp-item">
                    <span class="webmcp-comp-category">[${c.category}]</span>
                    <span class="webmcp-comp-action">${c.action}</span>
                    <div class="webmcp-comp-desc">${c.description || ''}</div>
                </div>
            `).join('');
        },
        
         /**
         * Check WebMCP support
         */
        isWebMCPSupported: function() {
            return 'modelContext' in navigator;
        },
        
        /**
         * Expose WebMCP API for AI agents
         */
        exposeWebMCPAPI: function() {
            const self = this;
            const withConsent = this.canExposeAPI();
            
            // Create comprehensive action handlers
            const actions = {
                // Page actions
                getPageInfo: { 
                    name: 'Get Page Info', 
                    description: 'Get current page information including title, URL, and component count',
                    execute: () => self.getPageInfo()
                },
                getComponents: { 
                    name: 'Get Components', 
                    description: 'Get all interactive components on the page',
                    parameters: { category: { type: 'string', description: 'Filter by category' } },
                    execute: (params) => self.getAllComponents(params?.category)
                },
                
                // Discovery actions
                findComponent: { 
                    name: 'Find Component', 
                    description: 'Find a component by action type',
                    parameters: { 
                        type: { type: 'string', description: 'Component action type (e.g., search, form, accordion)' },
                        index: { type: 'integer', description: 'Index if multiple components of same type' }
                    },
                    execute: (params) => self.findComponent(params?.type, params?.index || 0)
                },
                findComponentsByCategory: {
                    name: 'Find Components By Category',
                    description: 'Find all components in a category',
                    parameters: { category: { type: 'string', description: 'Category (commerce, navigation, content, layout, form, media, experience)' } },
                    execute: (params) => self.getAllComponents(params?.category)
                },
                
                // Interaction actions
                interactComponent: { 
                    name: 'Interact with Component', 
                    description: 'Perform an action on a component',
                    parameters: { 
                        selector: { type: 'string', description: 'CSS selector of the component' },
                        action: { type: 'string', description: 'Action to perform (click, expand, collapse, select-tab, next, prev, etc.)' },
                        options: { type: 'object', description: 'Additional options (e.g., { index: 0 })' }
                    },
                    execute: (params) => self.interactComponent(params?.selector, params?.action, params?.options)
                },
                
                // Form actions
                fillForm: { 
                    name: 'Fill Form Field', 
                    description: 'Fill a form field with a value',
                    parameters: { 
                        selector: { type: 'string', description: 'CSS selector for input' },
                        value: { type: 'string', description: 'Value to fill' }
                    },
                    execute: (params) => self.fillFormField(params?.selector, params?.value)
                },
                submitForm: { 
                    name: 'Submit Form', 
                    description: 'Submit a form',
                    parameters: { selector: { type: 'string', description: 'CSS selector for form' } },
                    execute: (params) => self.submitForm(params?.selector)
                },
                getFormFields: {
                    name: 'Get Form Fields',
                    description: 'Get all fields in a form',
                    parameters: { selector: { type: 'string', description: 'CSS selector for form' } },
                    execute: (params) => self.getFormFields(params?.selector)
                },
                
                // Navigation actions
                navigate: { 
                    name: 'Navigate', 
                    description: 'Navigate to a URL',
                    parameters: { url: { type: 'string', description: 'Target URL' } },
                    execute: (params) => { window.location.href = params?.url; return { success: true, url: params?.url }; }
                },
                clickElement: {
                    name: 'Click Element',
                    description: 'Click an element by selector',
                    parameters: { selector: { type: 'string', description: 'CSS selector' } },
                    execute: (params) => self.interactComponent(params?.selector, 'click')
                },
                
                // Search actions
                search: { 
                    name: 'Search', 
                    description: 'Perform a site search',
                    parameters: { query: { type: 'string', description: 'Search query' } },
                    execute: (params) => self.performSearch(params?.query)
                },
                getSearchResults: {
                    name: 'Get Search Results',
                    description: 'Get current search results if available',
                    execute: () => self.getSearchResults()
                },
                
                // E-commerce actions
                addToCart: { 
                    name: 'Add to Cart', 
                    description: 'Add a product to shopping cart',
                    parameters: { 
                        productSelector: { type: 'string', description: 'CSS selector for product' },
                        quantity: { type: 'integer', description: 'Quantity to add' }
                    },
                    execute: (params) => self.addToCart(params?.productSelector, params?.quantity || 1)
                },
                updateCartQuantity: {
                    name: 'Update Cart Quantity',
                    description: 'Update item quantity in cart',
                    parameters: {
                        itemSelector: { type: 'string', description: 'CSS selector for cart item' },
                        quantity: { type: 'integer', description: 'New quantity' }
                    },
                    execute: (params) => self.updateCartQuantity(params?.itemSelector, params?.quantity)
                },
                
                // Layout actions
                expandAccordion: {
                    name: 'Expand Accordion',
                    description: 'Expand an accordion item',
                    parameters: { selector: { type: 'string', description: 'CSS selector for accordion' } },
                    execute: (params) => self.interactComponent(params?.selector, 'expand')
                },
                collapseAccordion: {
                    name: 'Collapse Accordion',
                    description: 'Collapse an accordion item',
                    parameters: { selector: { type: 'string', description: 'CSS selector for accordion' } },
                    execute: (params) => self.interactComponent(params?.selector, 'collapse')
                },
                selectTab: {
                    name: 'Select Tab',
                    description: 'Switch to a specific tab',
                    parameters: { 
                        selector: { type: 'string', description: 'CSS selector for tabs' },
                        index: { type: 'integer', description: 'Tab index (0-based)' }
                    },
                    execute: (params) => self.interactComponent(params?.selector, 'select-tab', { index: params?.index || 0 })
                },
                carouselNext: {
                    name: 'Carousel Next',
                    description: 'Go to next slide in carousel',
                    parameters: { selector: { type: 'string', description: 'CSS selector for carousel' } },
                    execute: (params) => self.interactComponent(params?.selector, 'next')
                },
                carouselPrev: {
                    name: 'Carousel Previous',
                    description: 'Go to previous slide in carousel',
                    parameters: { selector: { type: 'string', description: 'CSS selector for carousel' } },
                    execute: (params) => self.interactComponent(params?.selector, 'prev')
                },
                goToSlide: {
                    name: 'Go To Slide',
                    description: 'Jump to specific carousel slide',
                    parameters: { 
                        selector: { type: 'string', description: 'CSS selector for carousel' },
                        index: { type: 'integer', description: 'Slide index (0-based)' }
                    },
                    execute: (params) => self.interactComponent(params?.selector, 'go-to-slide', { index: params?.index || 0 })
                },
                
                // Utility actions
                getElementInfo: {
                    name: 'Get Element Info',
                    description: 'Get detailed information about an element',
                    parameters: { selector: { type: 'string', description: 'CSS selector' } },
                    execute: (params) => self.getElementInfo(params?.selector)
                },
                waitForElement: {
                    name: 'Wait For Element',
                    description: 'Wait for an element to appear',
                    parameters: { 
                        selector: { type: 'string', description: 'CSS selector' },
                        timeout: { type: 'integer', description: 'Timeout in ms (default: 5000)' }
                    },
                    execute: (params) => self.waitForElement(params?.selector, params?.timeout || 5000)
                },
                getPageScreenshot: {
                    name: 'Get Page Screenshot',
                    description: 'Get base64 screenshot of page (for vision-enabled agents)',
                    execute: () => self.getPageScreenshot()
                },
                getAccessibilityTree: {
                    name: 'Get Accessibility Tree',
                    description: 'Get accessibility tree for screen reader/AI',
                    execute: () => self.getAccessibilityTree()
                },
                speakText: {
                    name: 'Speak Text',
                    description: 'Read text aloud using speech synthesis',
                    parameters: { text: { type: 'string', description: 'Text to speak' } },
                    execute: (params) => { self.speakText(params?.text); return { success: true }; }
                }
            };
            
            // Register with navigator.modelContext if available (requires consent)
            if (withConsent && window.navigator.modelContext?.declareAction) {
                const mc = window.navigator.modelContext;
                
                Object.entries(actions).forEach(([id, action]) => {
                    try {
                        mc.declareAction({
                            id: id,
                            name: action.name,
                            description: action.description,
                            parameters: action.parameters || {}
                        });
                    } catch (e) {
                        self.debug && console.warn('[WebMCP] Could not declare action:', id, e);
                    }
                });
            }
            
            // Expose global API with consent check
            window.AEMWebMCP = {
                version: this.version,
                consented: !!window.AEM_WEBMCP_CONSENT,
                
                _checkConsent: function() {
                    console.log(`[WebMCP] Checking consent. Internal: ${this.consented}, Global: ${window.AEM_WEBMCP_CONSENT}`);
                    if (this.consented || window.AEM_WEBMCP_CONSENT === true) {
                        this.consented = true;
                        return true;
                    }
                    
                    this._showConsentUI();
                    return false;
                },

                _showConsentUI: function() {
                    if (document.getElementById('webmcp-consent-wrapper')) return;

                    const host = document.createElement('div');
                    host.id = 'webmcp-consent-wrapper';
                    document.body.appendChild(host);
                    
                    const shadow = host.attachShadow({mode: 'open'});
                    
                    // Inject Styles into Shadow DOM
                    const style = document.createElement('style');
                    style.textContent = `
                        :host { font-family: system-ui, -apple-system, sans-serif; }
                        #bar {
                            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(150%);
                            width: 90%; max-width: 600px; background: rgba(255, 255, 255, 0.8);
                            backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3);
                            border-radius: 16px; padding: 16px 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                            display: flex; align-items: center; justify-content: space-between; transition: transform 0.5s ease;
                        }
                        #bar.visible { transform: translateX(-50%) translateY(0); }
                        .message { font-size: 14px; color: #1f2937; }
                        .actions { display: flex; gap: 12px; }
                        button { padding: 8px 16px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; }
                        .btn-allow { background: #6366f1; color: white; }
                        .btn-deny { background: transparent; color: #6b7280; }
                    `;
                    
                    const bar = document.createElement('div');
                    bar.id = 'bar';
                    bar.innerHTML = `
                        <div class="message"><b>AI Assistant</b> wants to help you with this page.</div>
                        <div class="actions">
                            <button class="btn-deny">Not now</button>
                            <button class="btn-allow">Allow Access</button>
                        </div>
                    `;
                    
                    shadow.appendChild(style);
                    shadow.appendChild(bar);
                    
                    setTimeout(() => bar.classList.add('visible'), 100);

                    bar.querySelector('.btn-allow').onclick = () => {
                        this.consented = true;
                        bar.classList.remove('visible');
                        setTimeout(() => host.remove(), 500);
                    };

                    bar.querySelector('.btn-deny').onclick = () => {
                        bar.classList.remove('visible');
                        setTimeout(() => host.remove(), 500);
                    };
                },

                // Wrap all actions with consent check
                ...Object.fromEntries(
                    Object.entries(actions).map(([id, action]) => [
                        id, 
                        (...args) => {
                            if (window.AEMWebMCP._checkConsent()) {
                                return action.execute(...args);
                            }
                            return { success: false, error: 'User consent required' };
                        }
                    ])
                )
            };
            
            // Also expose for backward compatibility (all protected by consent)
            window.AEMWebMCP.interact = (s, a, o) => window.AEMWebMCP._checkConsent() ? self.interactComponent(s, a, o) : { error: 'Consent required' };
            window.AEMWebMCP.fillForm = (s, v) => window.AEMWebMCP._checkConsent() ? self.fillFormField(s, v) : { error: 'Consent required' };
            window.AEMWebMCP.submitForm = (s) => window.AEMWebMCP._checkConsent() ? self.submitForm(s) : { error: 'Consent required' };
            window.AEMWebMCP.navigate = (u) => window.AEMWebMCP._checkConsent() ? (window.location.href = u) : { error: 'Consent required' };
            window.AEMWebMCP.search = (q) => window.AEMWebMCP._checkConsent() ? self.performSearch(q) : { error: 'Consent required' };
            window.AEMWebMCP.addToCart = (s, q) => window.AEMWebMCP._checkConsent() ? self.addToCart(s, q) : { error: 'Consent required' };
            window.AEMWebMCP.getPageInfo = () => window.AEMWebMCP._checkConsent() ? self.getPageInfo() : { error: 'Consent required' };
            window.AEMWebMCP.getPageScreenshot = () => window.AEMWebMCP._checkConsent() ? self.getPageScreenshot() : Promise.resolve({ error: 'Consent required' });
        },
        
        /**
         * Enhance all Core Components on page
         */
        enhanceAllComponents: function() {
            const selectors = ['[data-cq-resource-path]', '[data-resource-type]', '.aem-GridComponent'];
            let enhanced = 0;
            
            selectors.forEach(selector => {
                try {
                    document.querySelectorAll(selector).forEach(el => { if (this.enhanceComponent(el)) enhanced++; });
                } catch (e) {}
            });
            
            this.enhanceByPatterns();
            this.debug && console.log('[WebMCP] Enhanced', enhanced, 'components');
        },
        
        /**
         * Enhance a single component
         */
        enhanceComponent: function(el) {
            const resourceType = el.dataset.resourceType || el.dataset.cqResourcePath || this.getResourceTypeFromClass(el);
            if (!resourceType) return false;
            
            const normalizedType = this.normalizeResourceType(resourceType);
            const mapping = this.componentMappings[normalizedType] || this.componentMappings[resourceType];
            
            if (mapping) {
                el.setAttribute('data-webmcp-action', mapping.action);
                el.setAttribute('data-webmcp-description', mapping.description || '');
                el.setAttribute('data-webmcp-category', mapping.category || 'general');
                
                if (mapping.interactions) {
                    el.setAttribute('data-webmcp-interactions', mapping.interactions.join(','));
                }
                
                if (mapping.getData) {
                    try {
                        const data = mapping.getData.call(this, el);
                        if (data) el.setAttribute('data-webmcp-data', JSON.stringify(data).substring(0, 1000));
                    } catch (e) {}
                }
                return true;
            }
            return false;
        },
        
        /**
         * Normalize resource type
         */
        normalizeResourceType: function(type) {
            if (!type) return '';
            // Remove versioning (v1, v2, etc.)
            let normalized = type.replace(/\/v\d+/g, '');
            // Handle proxy components mapping to core components or base paths
            return normalized;
        },
        
        /**
         * Get resource type from class name
         */
        getResourceTypeFromClass: function(el) {
            const classList = el.className.split(' ');
            for (const cls of classList) {
                if (cls.startsWith('core-wcm-components-')) {
                    return 'core/wcm/components/' + cls.replace('core-wcm-components-', '').replace(/-/g, '/');
                }
            }
            return null;
        },
        
        /**
         * Enhance by common patterns
         */
        enhanceByPatterns: function() {
            const patterns = { 
                'search': 'search', 
                'cart': 'shopping-cart', 
                'form': 'form',
                'cmp-form': 'form',
                'cmp-form-container': 'form',
                'navigation': 'navigation', 
                'breadcrumb': 'breadcrumb', 
                'accordion': 'accordion', 
                'tabs': 'tabs', 
                'carousel': 'carousel' 
            };
            Object.entries(patterns).forEach(([pattern, action]) => {
                document.querySelectorAll(`.${pattern}:not([data-webmcp-action])`).forEach(el => {
                    el.setAttribute('data-webmcp-action', action);
                    el.setAttribute('data-webmcp-category', action === 'shopping-cart' ? 'commerce' : (action === 'form' ? 'form' : pattern));
                });
            });

            // Target form tags and IDs specifically
            document.querySelectorAll('form:not([data-webmcp-action]), [id*="form"]:not([data-webmcp-action])').forEach(el => {
                el.setAttribute('data-webmcp-action', 'form');
                el.setAttribute('data-webmcp-category', 'form');
            });
        },
        
        /**
         * Get all components
         */
        getAllComponents: function(category) {
            const components = [];
            const allElements = document.querySelectorAll('[data-webmcp-action]');
            console.log(`[WebMCP] Found ${allElements.length} elements with data-webmcp-action attribute`);
            
            allElements.forEach(el => {
                if (category && el.dataset.webmcpCategory !== category) return;
                const data = { action: el.dataset.webmcpAction, category: el.dataset.webmcpCategory, description: el.dataset.webmcpDescription, selector: this.getSelector(el), interactions: (el.dataset.webmcpInteractions || '').split(',') };
                try { if (el.dataset.webmcpData) data.data = JSON.parse(el.dataset.webmcpData); } catch (e) {}
                components.push(data);
            });
            return components;
        },
        
        /**
         * Find component by type
         */
        findComponent: function(type, index = 0) {
            const components = document.querySelectorAll(`[data-webmcp-action="${type}"]`);
            return components[index] ? this.getSelector(components[index]) : null;
        },
        
        /**
         * Get page info
         */
        getPageInfo: function() {
            return { title: document.title, url: window.location.href, path: window.location.pathname, components: this.getAllComponents().length };
        },
        
        /**
         * Interact with component
         */
        interactComponent: function(selector, action, options) {
            const el = document.querySelector(selector);
            if (!el) return { success: false, error: 'Element not found' };
            
            switch (action) {
                case 'click': case 'submit':
                    const clickable = el.querySelector('button, a, [role="button"]') || el;
                    clickable.click();
                    return { success: true, element: this.getSelector(clickable) };
                    
                case 'expand': case 'collapse':
                    const expandable = el.querySelector('[aria-expanded], [data-toggle], .accordion__header, .cmp-accordion__header, [data-cmp-accordion-heading]');
                    if (expandable) {
                        expandable.click();
                        return { success: true, expanded: expandable.getAttribute('aria-expanded') === 'true' };
                    }
                    return { success: false, error: 'No expandable element found' };
                    
                case 'select-tab':
                    const tabIndex = options?.index || 0;
                    const tab = el.querySelectorAll('[role="tab"], .cmp-tabs__tab').item(tabIndex);
                    if (tab) { tab.click(); return { success: true, tabIndex: tabIndex }; }
                    return { success: false, error: 'Tab not found at index ' + tabIndex };
                    
                case 'next': case 'next-slide':
                    const nextBtn = el.querySelector('[data-cmp-valuename="next"], .carousel__control--next, .slick-next, [aria-label="next"]');
                    if (nextBtn) { nextBtn.click(); return { success: true }; }
                    return { success: false, error: 'Next button not found' };
                    
                case 'prev': case 'previous':
                    const prevBtn = el.querySelector('[data-cmp-valuename="prev"], .carousel__control--prev, .slick-prev, [aria-label="previous"]');
                    if (prevBtn) { prevBtn.click(); return { success: true }; }
                    return { success: false, error: 'Previous button not found' };
                    
                case 'go-to-slide':
                    const slideIndex = options?.index || 0;
                    const slide = el.querySelectorAll('.carousel__item, .slick-slide').item(slideIndex);
                    if (slide) { slide.click(); return { success: true, slideIndex: slideIndex }; }
                    return { success: false, error: 'Slide not found at index ' + slideIndex };
                    
                case 'select-option':
                    const optionValue = options?.value;
                    const option = el.querySelector(`option[value="${optionValue}"], input[value="${optionValue}"], radio[value="${optionValue}"]`);
                    if (option) { option.click(); return { success: true, value: optionValue }; }
                    return { success: false, error: 'Option not found: ' + optionValue };
                    
                case 'download':
                    const downloadLink = el.querySelector('a[href*=".pdf"], a[download], [data-download-url]');
                    if (downloadLink) { downloadLink.click(); return { success: true }; }
                    return { success: false, error: 'Download link not found' };
                    
                case 'navigate':
                    const navLink = el.querySelector('a');
                    if (navLink) { window.location.href = navLink.href; return { success: true, url: navLink.href }; }
                    return { success: false, error: 'Navigation link not found' };
                    
                case 'scroll-into-view':
                    el.scrollIntoView({ behavior: 'smooth' });
                    return { success: true };
                    
                case 'focus':
                    el.focus();
                    return { success: true };
                    
                default: return { success: false, error: 'Unknown action: ' + action };
            }
        },
        
        /**
         * Fill form field
         */
        fillFormField: function(selector, value) {
            return new Promise((resolve) => {
                const input = document.querySelector(selector);
                if (!input) {
                    resolve({ success: false, error: 'Input not found: ' + selector });
                    return;
                }
                
                // Design: Add AI Aura
                input.classList.add('webmcp-ai-active');
                
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Design: Visual pause so human can see what's happening
                setTimeout(() => {
                    input.classList.remove('webmcp-ai-active');
                    resolve({ success: true });
                }, 400);
            });
        },
        
        /**
         * Submit form
         */
        submitForm: function(selector) {
            const form = document.querySelector(selector);
            if (!form) return { success: false, error: 'Form not found' };
            form.submit();
            return { success: true };
        },
        
        /**
         * Perform search
         */
        performSearch: function(query) {
            const searchInput = document.querySelector('input[type="search"], input[name="q"], input[name="search"]');
            if (searchInput) { searchInput.value = query; const form = searchInput.closest('form'); if (form) { form.submit(); return { success: true }; } }
            window.location.href = '/search?q=' + encodeURIComponent(query);
            return { success: true };
        },
        
        /**
         * Add to cart
         */
        addToCart: function(selector, quantity) {
            const product = document.querySelector(selector);
            if (!product) return { success: false, error: 'Product not found' };
            const addButton = product.querySelector('button') || product.querySelector('[data-add-to-cart], .add-to-cart, [aria-label*="cart"], [title*="Cart"]');
            if (addButton) { addButton.click(); return { success: true }; }
            return { success: false, error: 'Add to cart button not found' };
        },
        
        // ==================== HELPERS ====================
        getText: function(el, selector) { return el.querySelector(selector)?.textContent?.trim(); },
        
        parseNavigation: function(el) {
            const items = [];
            el.querySelectorAll(':scope > ul > li').forEach(item => {
                const link = item.querySelector('a');
                if (link) {
                    const node = { label: link.textContent?.trim(), href: link.href };
                    const sub = item.querySelector('ul');
                    if (sub) node.children = Array.from(sub.querySelectorAll('li a')).map(a => ({ label: a.textContent?.trim(), href: a.href }));
                    items.push(node);
                }
            });
            return { items };
        },
        
        getCartItems: function(el) {
            return Array.from(el.querySelectorAll('.cart-item')).map(item => ({
                name: item.querySelector('.item-name')?.textContent?.trim(),
                price: item.querySelector('.price')?.textContent?.trim()
            }));
        },
        
        extractFormFields: function(el) {
            const fields = [];
            el.querySelectorAll('input, select, textarea').forEach(input => {
                if (input.name && input.type !== 'hidden') fields.push({ name: input.name, type: input.type || input.tagName.toLowerCase(), required: input.required });
            });
            return fields;
        },
        
        getSelector: function(el) {
            if (el.id) return '#' + el.id;
            let selector = el.tagName.toLowerCase();
            if (el.className && typeof el.className === 'string') selector += '.' + el.className.split(' ')[0];
            if (el.dataset.webmcpAction) selector += '[data-webmcp-action="' + el.dataset.webmcpAction + '"]';
            return selector;
        },
        
        // ==================== ADVANCED HELPERS ====================
        getFormFields: function(selector) {
            const form = document.querySelector(selector);
            if (!form) return { success: false, error: 'Form not found' };
            const fields = this.extractFormFields(form);
            return { success: true, fields: fields };
        },
        
        getSearchResults: function() {
            const results = document.querySelectorAll('.search-results .result, .search-result, [data-search-result]');
            if (results.length === 0) {
                return { success: false, error: 'No search results found' };
            }
            return { 
                success: true, 
                count: results.length,
                results: Array.from(results).map(r => ({
                    title: r.querySelector('h2, h3, .title')?.textContent?.trim(),
                    url: r.querySelector('a')?.href,
                    snippet: r.querySelector('p, .description')?.textContent?.trim()
                }))
            };
        },
        
        updateCartQuantity: function(itemSelector, quantity) {
            const item = document.querySelector(itemSelector);
            if (!item) return { success: false, error: 'Cart item not found' };
            const qtyInput = item.querySelector('input[type="number"], .quantity input');
            if (qtyInput) {
                qtyInput.value = quantity;
                qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
                return { success: true, quantity: quantity };
            }
            return { success: false, error: 'Quantity input not found' };
        },

        /**
         * Speak text using Web Speech API
         */
        speakText: function(text) {
            if (!text) return;
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        },
        
        getElementInfo: function(selector) {
            const el = document.querySelector(selector);
            if (!el) return { success: false, error: 'Element not found' };
            return {
                success: true,
                tag: el.tagName.toLowerCase(),
                id: el.id || null,
                classes: el.className?.split(' ').filter(c => c) || [],
                attributes: Array.from(el.attributes).map(a => ({ name: a.name, value: a.value })),
                text: el.textContent?.trim().substring(0, 200),
                webmcp: {
                    action: el.dataset.webmcpAction,
                    category: el.dataset.webmcpCategory,
                    description: el.dataset.webmcpDescription,
                    interactions: el.dataset.webmcpInteractions
                }
            };
        },
        
        waitForElement: function(selector, timeout) {
            return new Promise((resolve) => {
                const startTime = Date.now();
                const check = () => {
                    const el = document.querySelector(selector);
                    if (el) {
                        resolve({ success: true, element: this.getSelector(el) });
                        return;
                    }
                    if (Date.now() - startTime > timeout) {
                        resolve({ success: false, error: 'Timeout waiting for element' });
                        return;
                    }
                    setTimeout(check, 100);
                };
                check();
            });
        },
        
        getPageScreenshot: function() {
            return new Promise((resolve) => {
                if (window.html2canvas) {
                    this._takeScreenshot(resolve);
                    return;
                }
                
                // Load html2canvas dynamically
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = () => this._takeScreenshot(resolve);
                script.onerror = () => resolve({ success: false, error: 'Failed to load html2canvas library' });
                document.head.appendChild(script);
            });
        },

        _takeScreenshot: function(resolve) {
            window.html2canvas(document.body, {
                ignoreElements: (element) => element.id === 'webmcp-debug-panel',
                logging: false,
                useCORS: true
            }).then(canvas => {
                resolve({ 
                    success: true, 
                    data: canvas.toDataURL('image/jpeg', 0.6) // Compress to save bandwidth/tokens
                });
            }).catch(e => {
                resolve({ success: false, error: 'Screenshot failed: ' + e.message });
            });
        },
        
        getAccessibilityTree: function() {
            const getAriaLabel = (el) => {
                return el.getAttribute('aria-label') || 
                       el.getAttribute('aria-labelledby') ||
                       el.getAttribute('aria-describedby') ||
                       el.textContent?.trim().substring(0, 50);
            };
            
            const getRole = (el) => el.getAttribute('role') || el.tagName.toLowerCase();
            
            const walk = (el, depth = 0) => {
                if (depth > 3) return null;
                const nodes = [];
                Array.from(el.children).forEach(child => {
                    const node = {
                        role: getRole(child),
                        label: getAriaLabel(child),
                        disabled: child.hasAttribute('aria-disabled'),
                        expanded: child.getAttribute('aria-expanded'),
                        selected: child.getAttribute('aria-selected'),
                        children: walk(child, depth + 1)
                    };
                    if (node.role || node.label) nodes.push(node);
                });
                return nodes.length > 0 ? nodes : null;
            };
            
            return {
                pageTitle: document.title,
                landmarks: {
                    banner: document.querySelector('[role="banner"]')?.tagName,
                    main: document.querySelector('[role="main"], main')?.tagName,
                    navigation: document.querySelectorAll('[role="navigation"], nav').length,
                    contentinfo: document.querySelector('[role="contentinfo"], footer')?.tagName
                },
                tree: walk(document.body)
            };
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AEMWebMCPAutomator.init());
    } else {
        AEMWebMCPAutomator.init();
    }
    
    window.AEMWebMCPAutomator = AEMWebMCPAutomator;
    
})(document, window);
