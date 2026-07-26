/**
 * AEM WebMCP Config — static component mappings and tool classifications.
 *
 * Loaded BEFORE webmcp.js.  The Automator reads these at init time so
 * the core module stays free of data-heavy declarations.
 *
 * Version: 2.1.0
 */

/* global window */
(function (window) {
    'use strict';

    var A = window.AEMWebMCPAutomator || {};

    // ==================== COMPONENT MAPPINGS ====================
    // Complete AEM Core Components → WebMCP action map.
    A.componentMappings = {
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
            getData: function(el) { return { languages: Array.from(el.querySelectorAll('a')).map(function(a) { return { label: a.textContent.trim(), href: a.href }; }) }; }
        },
        'core/wcm/components/languagenavigation': { category: 'navigation', action: 'language-navigation', description: 'Language selector', interactions: ['select-language'] },

        'core/wcm/components/breadcrumb/v1/breadcrumb': { category: 'navigation', action: 'breadcrumb', description: 'Breadcrumb', interactions: ['navigate'],
            getData: function(el) { return { items: Array.from(el.querySelectorAll('nav ol li')).map(function(li) { return { label: li.textContent.trim(), href: li.querySelector('a') ? li.querySelector('a').href : undefined }; }) }; }
        },
        'core/wcm/components/breadcrumb/v2/breadcrumb': { category: 'navigation', action: 'breadcrumb', description: 'Breadcrumb', interactions: ['navigate'],
            getData: function(el) { return { items: Array.from(el.querySelectorAll('li')).map(function(li) { return { label: li.textContent.trim(), href: li.querySelector('a') ? li.querySelector('a').href : undefined }; }) }; }
        },
        'core/wcm/components/breadcrumb/v3/breadcrumb': { category: 'navigation', action: 'breadcrumb', description: 'Breadcrumb', interactions: ['navigate'] },
        'core/wcm/components/breadcrumb': { category: 'navigation', action: 'breadcrumb', description: 'Breadcrumb', interactions: ['navigate'] },

        // ==================== CONTENT COMPONENTS ====================
        'core/wcm/components/text/v1/text': { category: 'content', action: 'text', description: 'Rich text content' },
        'core/wcm/components/text/v2/text': { category: 'content', action: 'text', description: 'Rich text content' },
        'core/wcm/components/text': { category: 'content', action: 'text', description: 'Rich text content',
            getData: function(el) { return { content: el.textContent ? el.textContent.trim().substring(0, 500) : '' }; }
        },

        'core/wcm/components/title/v1/title': { category: 'content', action: 'title', description: 'Title/heading' },
        'core/wcm/components/title/v2/title': { category: 'content', action: 'title', description: 'Title/heading' },
        'core/wcm/components/title/v3/title': { category: 'content', action: 'title', description: 'Title/heading',
            getData: function(el) { return { text: el.textContent ? el.textContent.trim() : '', level: el.tagName }; }
        },
        'core/wcm/components/title': { category: 'content', action: 'title', description: 'Title/heading' },

        'core/wcm/components/image/v1/image': { category: 'content', action: 'image', description: 'Image' },
        'core/wcm/components/image/v2/image': { category: 'content', action: 'image', description: 'Image' },
        'core/wcm/components/image/v3/image': { category: 'content', action: 'image', description: 'Image',
            getData: function(el) { var img = el.querySelector('img'); return { src: img ? img.src : undefined, alt: img ? img.alt : undefined }; }
        },
        'core/wcm/components/image': { category: 'content', action: 'image', description: 'Image' },

        'core/wcm/components/teaser/v1/teaser': { category: 'content', action: 'teaser', description: 'Teaser/promotional content', interactions: ['click'] },
        'core/wcm/components/teaser/v2/teaser': { category: 'content', action: 'teaser', description: 'Teaser/promotional content', interactions: ['click'] },
        'core/wcm/components/teaser': { category: 'content', action: 'teaser', description: 'Teaser content',
            getData: function(el) { return { title: this.getText(el, 'h3'), link: el.querySelector('a') ? el.querySelector('a').href : undefined }; }
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
            getData: function(el) { return { items: Array.from(el.querySelectorAll('.accordion__item')).map(function(i) { return { title: i.querySelector('.accordion__title') ? i.querySelector('.accordion__title').textContent.trim() : '', expanded: i.classList.contains('expanded') }; }) }; }
        },
        'core/wcm/components/accordion': { category: 'layout', action: 'accordion', description: 'Accordion' },

        'core/wcm/components/tabs/v1/tabs': { category: 'layout', action: 'tabs', description: 'Tabs', interactions: ['select-tab', 'next', 'prev'],
            getData: function(el) { return { tabs: Array.from(el.querySelectorAll('[role="tab"]')).map(function(t) { return { label: t.textContent ? t.textContent.trim() : '', selected: t.getAttribute('aria-selected') === 'true' }; }) }; }
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
            getData: function(el) { var i = el.querySelector('input'); return { name: i ? i.name : undefined, type: i ? i.type : undefined, required: i ? i.required : undefined }; }
        },
        'core/wcm/components/form/text/v2/text': { category: 'form', action: 'form-field', fieldType: 'text' },
        'core/wcm/components/form/text': { category: 'form', action: 'form-field', fieldType: 'text' },

        'core/wcm/components/form/textarea/v1/textarea': { category: 'form', action: 'form-field', fieldType: 'textarea',
            getData: function(el) { var t = el.querySelector('textarea'); return { name: t ? t.name : undefined, required: t ? t.required : undefined }; }
        },
        'core/wcm/components/form/textarea': { category: 'form', action: 'form-field', fieldType: 'textarea' },

        'core/wcm/components/form/date/v1/date': { category: 'form', action: 'form-field', fieldType: 'date',
            getData: function(el) { var i = el.querySelector('input'); return { name: i ? i.name : undefined, required: i ? i.required : undefined }; }
        },
        'core/wcm/components/form/date': { category: 'form', action: 'form-field', fieldType: 'date' },

        'core/wcm/components/form/dropdown/v1/dropdown': { category: 'form', action: 'form-dropdown', fieldType: 'select',
            getData: function(el) { var s = el.querySelector('select'); return { name: s ? s.name : undefined, options: Array.from(s ? s.querySelectorAll('option') : []).map(function(o) { return o.value; }) }; }
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
            getData: function(el) { return { platforms: Array.from(el.querySelectorAll('a')).map(function(a) { return { label: a.getAttribute('aria-label') || a.href, href: a.href }; }) }; }
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
            getData: function(el) { return { languages: Array.from(el.querySelectorAll('a')).map(function(a) { return { label: a.textContent.trim(), href: a.href, active: a.classList.contains('active') }; }) }; }
        }
    };

    // ==================== TOOL CLASSIFICATIONS ====================

    /** Tools that only read page state; registered with readOnlyHint. */
    A.READ_ONLY_TOOLS = ['getPageInfo', 'getComponents', 'findComponent', 'findComponentsByCategory',
        'getFormFields', 'getSearchResults', 'getElementInfo', 'waitForElement',
        'getPageScreenshot', 'getAccessibilityTree'];

    /** Tools whose output may contain untrusted / external content (spec §6.4.3). */
    A.UNTRUSTED_TOOLS = ['getPageScreenshot', 'getAccessibilityTree', 'getSearchResults'];

    window.AEMWebMCPAutomator = A;

})(window);
