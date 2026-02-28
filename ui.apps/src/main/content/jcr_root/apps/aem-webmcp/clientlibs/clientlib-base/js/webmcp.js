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

            // ==================== EXPERIENCE FRAGMENTS ====================
            'core/wcm/components/experiencefragment/v1/experiencefragment': { category: 'experience', action: 'experience-fragment', description: 'Experience fragment' },
            'core/wcm/components/experiencefragment/v2/experiencefragment': { category: 'experience', action: 'experience-fragment', description: 'Experience fragment' },
            'core/wcm/components/experiencefragment': { category: 'experience', action: 'experience-fragment', description: 'Experience fragment' }
        },
        
        /**
         * Initialize the automator
         */
        init: function() {
            this.debug && console.log('[WebMCP] Initializing AEM WebMCP Automator v' + this.version);
            
            if (this.isWebMCPSupported()) {
                this.exposeWebMCPAPI();
                this.enhanceAllComponents();
            }
            
            if (this.debug || window.WEBMCP_SHOW_PANEL) {
                this.createDebugPanel();
            }
            
            this.debug && console.log('[WebMCP] Ready - enhanced', 
                document.querySelectorAll('[data-webmcp-action]').length, 'components');
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
            if (!window.navigator.modelContext?.declareAction) return;
            
            const mc = window.navigator.modelContext;
            
            mc.declareAction({ id: 'getPageInfo', name: 'Get Page Info', description: 'Get current page information', parameters: {} });
            mc.declareAction({ id: 'getComponents', name: 'Get Components', description: 'Get all interactive components', parameters: { category: { type: 'string' } } });
            mc.declareAction({ id: 'interactComponent', name: 'Interact with Component', description: 'Interact with a component', parameters: { selector: { type: 'string' }, action: { type: 'string' } } });
            mc.declareAction({ id: 'findComponent', name: 'Find Component', description: 'Find component by type', parameters: { type: { type: 'string' }, index: { type: 'integer' } } });
            mc.declareAction({ id: 'fillForm', name: 'Fill Form Field', description: 'Fill a form field', parameters: { selector: { type: 'string' }, value: { type: 'string' } } });
            mc.declareAction({ id: 'submitForm', name: 'Submit Form', description: 'Submit a form', parameters: { selector: { type: 'string' } } });
            mc.declareAction({ id: 'navigate', name: 'Navigate', description: 'Navigate to a URL', parameters: { url: { type: 'string' } } });
            mc.declareAction({ id: 'search', name: 'Search', description: 'Perform site search', parameters: { query: { type: 'string' } } });
            mc.declareAction({ id: 'addToCart', name: 'Add to Cart', description: 'Add product to cart', parameters: { productSelector: { type: 'string' }, quantity: { type: 'integer' } } });
            
            window.AEMWebMCP = {
                version: this.version,
                getComponents: (c) => this.getAllComponents(c),
                getComponent: (t, i) => this.findComponent(t, i),
                interact: (s, a) => this.interactComponent(s, a),
                fillForm: (s, v) => this.fillFormField(s, v),
                submitForm: (s) => this.submitForm(s),
                navigate: (u) => window.location.href = u,
                search: (q) => this.performSearch(q),
                addToCart: (s, q) => this.addToCart(s, q),
                getPageInfo: () => this.getPageInfo()
            };
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
            return type.replace(/\/v\d+/g, '').replace(/\/core\/wcm\/components\//, '/core/wcm/components/');
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
            const patterns = { 'search': 'search', 'cart': 'shopping-cart', 'form': 'form', 'navigation': 'navigation', 'breadcrumb': 'breadcrumb', 'accordion': 'accordion', 'tabs': 'tabs', 'carousel': 'carousel' };
            Object.entries(patterns).forEach(([pattern, action]) => {
                document.querySelectorAll(`.${pattern}:not([data-webmcp-action])`).forEach(el => {
                    el.setAttribute('data-webmcp-action', action);
                    el.setAttribute('data-webmcp-category', 'auto-detected');
                });
            });
        },
        
        /**
         * Get all components
         */
        getAllComponents: function(category) {
            const components = [];
            document.querySelectorAll('[data-webmcp-action]').forEach(el => {
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
            const input = document.querySelector(selector);
            if (!input) return { success: false, error: 'Input not found' };
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true };
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
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AEMWebMCPAutomator.init());
    } else {
        AEMWebMCPAutomator.init();
    }
    
    window.AEMWebMCPAutomator = AEMWebMCPAutomator;
    
})(document, window);
