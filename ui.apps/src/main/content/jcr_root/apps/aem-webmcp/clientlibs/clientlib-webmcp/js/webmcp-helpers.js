/**
 * AEM WebMCP Helpers — DOM manipulation and page-interaction utilities.
 *
 * Loaded AFTER webmcp-config.js and BEFORE webmcp.js.
 * Attaches methods to window.AEMWebMCPAutomator so the core module
 * can reference them via `this`.
 *
 * Version: 2.1.0
 */

(function (document, window) {
    'use strict';

    var A = window.AEMWebMCPAutomator || {};
    var _selectorCounter = 0;

    // ==================== BASIC HELPERS ====================

    A.getText = function (el, selector) {
        var node = el.querySelector(selector);
        return node ? node.textContent.trim() : undefined;
    };

    A.parseNavigation = function (el) {
        var items = [];
        el.querySelectorAll(':scope > ul > li').forEach(function (item) {
            var link = item.querySelector('a');
            if (link) {
                var node = { label: link.textContent.trim(), href: link.href };
                var sub = item.querySelector('ul');
                if (sub) {
                    node.children = Array.from(sub.querySelectorAll('li a')).map(function (a) {
                        return { label: a.textContent.trim(), href: a.href };
                    });
                }
                items.push(node);
            }
        });
        return { items: items };
    };

    A.getCartItems = function (el) {
        return Array.from(el.querySelectorAll('.cart-item')).map(function (item) {
            return {
                name: item.querySelector('.item-name') ? item.querySelector('.item-name').textContent.trim() : undefined,
                price: item.querySelector('.price') ? item.querySelector('.price').textContent.trim() : undefined
            };
        });
    };

    A.extractFormFields = function (el) {
        var fields = [];
        el.querySelectorAll('input, select, textarea').forEach(function (input) {
            if (input.name && input.type !== 'hidden') {
                fields.push({ name: input.name, type: input.type || input.tagName.toLowerCase(), required: input.required });
            }
        });
        return fields;
    };

    A.getSelector = function (el) {
        if (el.id) return '#' + CSS.escape(el.id);
        if (!el.dataset.webmcpId) {
            el.dataset.webmcpId = 'wm-' + (++_selectorCounter);
        }
        return '[data-webmcp-id="' + el.dataset.webmcpId + '"]';
    };

    // ==================== COMPONENT DISCOVERY ====================

    A.getAllComponents = function (category) {
        var components = [];
        var allElements = document.querySelectorAll('[data-webmcp-action]');
        A.debug && console.log('[WebMCP] Found ' + allElements.length + ' elements with data-webmcp-action attribute');

        allElements.forEach(function (el) {
            if (category && el.dataset.webmcpCategory !== category) return;
            var data = {
                action: el.dataset.webmcpAction,
                category: el.dataset.webmcpCategory,
                description: el.dataset.webmcpDescription,
                selector: A.getSelector(el),
                interactions: (el.dataset.webmcpInteractions || '').split(',')
            };
            try { if (el.dataset.webmcpData) data.data = JSON.parse(el.dataset.webmcpData); } catch (e) { /* ignore */ }
            components.push(data);
        });
        return components;
    };

    A.findComponent = function (type, index) {
        index = index || 0;
        var components = document.querySelectorAll('[data-webmcp-action="' + type + '"]');
        return components[index] ? A.getSelector(components[index]) : null;
    };

    A.getPageInfo = function () {
        return { title: document.title, url: window.location.href, path: window.location.pathname, components: A.getAllComponents().length };
    };

    // ==================== COMPONENT INTERACTION ====================

    A.interactComponent = function (selector, action, options) {
        var el = document.querySelector(selector);
        if (!el) return { success: false, error: 'Element not found' };

        switch (action) {
            case 'click': case 'submit':
                var clickable = el.querySelector('button, a, [role="button"]') || el;
                clickable.click();
                return { success: true, element: A.getSelector(clickable) };

            case 'expand': case 'collapse':
                var expandable = el.querySelector('[aria-expanded], [data-toggle], .accordion__header, .cmp-accordion__header, [data-cmp-accordion-heading]');
                if (expandable) {
                    expandable.click();
                    return { success: true, expanded: expandable.getAttribute('aria-expanded') === 'true' };
                }
                return { success: false, error: 'No expandable element found' };

            case 'select-tab':
                var tabIndex = (options && options.index) || 0;
                var tab = el.querySelectorAll('[role="tab"], .cmp-tabs__tab').item(tabIndex);
                if (tab) { tab.click(); return { success: true, tabIndex: tabIndex }; }
                return { success: false, error: 'Tab not found at index ' + tabIndex };

            case 'next': case 'next-slide':
                var nextBtn = el.querySelector('[data-cmp-valuename="next"], .carousel__control--next, .slick-next, [aria-label="next"]');
                if (nextBtn) { nextBtn.click(); return { success: true }; }
                return { success: false, error: 'Next button not found' };

            case 'prev': case 'previous':
                var prevBtn = el.querySelector('[data-cmp-valuename="prev"], .carousel__control--prev, .slick-prev, [aria-label="previous"]');
                if (prevBtn) { prevBtn.click(); return { success: true }; }
                return { success: false, error: 'Previous button not found' };

            case 'go-to-slide':
                var slideIndex = (options && options.index) || 0;
                var slide = el.querySelectorAll('.carousel__item, .slick-slide').item(slideIndex);
                if (slide) { slide.click(); return { success: true, slideIndex: slideIndex }; }
                return { success: false, error: 'Slide not found at index ' + slideIndex };

            case 'select-option':
                var optionValue = options && options.value;
                var option = el.querySelector('option[value="' + optionValue + '"], input[value="' + optionValue + '"], radio[value="' + optionValue + '"]');
                if (option) { option.click(); return { success: true, value: optionValue }; }
                return { success: false, error: 'Option not found: ' + optionValue };

            case 'download':
                var downloadLink = el.querySelector('a[href*=".pdf"], a[download], [data-download-url]');
                if (downloadLink) { downloadLink.click(); return { success: true }; }
                return { success: false, error: 'Download link not found' };

            case 'navigate':
                var navLink = el.querySelector('a');
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
    };

    // ==================== FORM HELPERS ====================

    A.fillFormField = function (selector, value) {
        return new Promise(function (resolve) {
            var input = document.querySelector(selector);
            if (!input) {
                resolve({ success: false, error: 'Input not found: ' + selector });
                return;
            }
            input.classList.add('webmcp-ai-active');
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            setTimeout(function () {
                input.classList.remove('webmcp-ai-active');
                resolve({ success: true });
            }, 400);
        });
    };

    A.submitForm = function (selector) {
        var form = document.querySelector(selector);
        if (!form) return { success: false, error: 'Form not found' };
        form.submit();
        return { success: true };
    };

    A.getFormFields = function (selector) {
        var form = document.querySelector(selector);
        if (!form) return { success: false, error: 'Form not found' };
        var fields = A.extractFormFields(form);
        return { success: true, fields: fields };
    };

    // ==================== SEARCH ====================

    A.performSearch = function (query) {
        var searchInput = document.querySelector('input[type="search"], input[name="q"], input[name="search"]');
        if (searchInput) {
            searchInput.value = query;
            var form = searchInput.closest('form');
            if (form) { form.submit(); return { success: true }; }
        }
        window.location.href = '/search?q=' + encodeURIComponent(query);
        return { success: true };
    };

    A.getSearchResults = function () {
        var results = document.querySelectorAll('.search-results .result, .search-result, [data-search-result]');
        if (results.length === 0) {
            return { success: false, error: 'No search results found' };
        }
        return {
            success: true,
            count: results.length,
            results: Array.from(results).map(function (r) {
                return {
                    title: r.querySelector('h2, h3, .title') ? r.querySelector('h2, h3, .title').textContent.trim() : undefined,
                    url: r.querySelector('a') ? r.querySelector('a').href : undefined,
                    snippet: r.querySelector('p, .description') ? r.querySelector('p, .description').textContent.trim() : undefined
                };
            })
        };
    };

    // ==================== E-COMMERCE ====================

    A.addToCart = function (selector, quantity) {
        var product = document.querySelector(selector);
        if (!product) return { success: false, error: 'Product not found' };
        var addButton = product.querySelector('button') || product.querySelector('[data-add-to-cart], .add-to-cart, [aria-label*="cart"], [title*="Cart"]');
        if (addButton) { addButton.click(); return { success: true }; }
        return { success: false, error: 'Add to cart button not found' };
    };

    A.updateCartQuantity = function (itemSelector, quantity) {
        var item = document.querySelector(itemSelector);
        if (!item) return { success: false, error: 'Cart item not found' };
        var qtyInput = item.querySelector('input[type="number"], .quantity input');
        if (qtyInput) {
            qtyInput.value = quantity;
            qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, quantity: quantity };
        }
        return { success: false, error: 'Quantity input not found' };
    };

    // ==================== UTILITY HELPERS ====================

    A.speakText = function (text) {
        if (!text) return;
        if (typeof window.SpeechSynthesisUtterance === 'undefined') return;
        var utterance = new window.SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    A.getElementInfo = function (selector) {
        var el = document.querySelector(selector);
        if (!el) return { success: false, error: 'Element not found' };
        return {
            success: true,
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            classes: el.className ? el.className.split(' ').filter(function (c) { return c; }) : [],
            attributes: Array.from(el.attributes).map(function (a) { return { name: a.name, value: a.value }; }),
            text: el.textContent ? el.textContent.trim().substring(0, 200) : '',
            webmcp: {
                action: el.dataset.webmcpAction,
                category: el.dataset.webmcpCategory,
                description: el.dataset.webmcpDescription,
                interactions: el.dataset.webmcpInteractions
            }
        };
    };

    A.waitForElement = function (selector, timeout) {
        return new Promise(function (resolve) {
            var startTime = Date.now();
            var check = function () {
                var el = document.querySelector(selector);
                if (el) {
                    resolve({ success: true, element: A.getSelector(el) });
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
    };

    // ==================== SCREENSHOT & ACCESSIBILITY ====================

    A.getPageScreenshot = function () {
        return new Promise(function (resolve) {
            if (window.html2canvas) {
                A._takeScreenshot(resolve);
                return;
            }
            resolve({ success: false, error: 'html2canvas not available - bundle it in a clientlib to enable screenshots' });
        });
    };

    A._takeScreenshot = function (resolve) {
        window.html2canvas(document.body, {
            ignoreElements: function (element) { return element.id === 'webmcp-debug-panel'; },
            logging: false,
            useCORS: true
        }).then(function (canvas) {
            resolve({ success: true, data: canvas.toDataURL('image/jpeg', 0.6) });
        }).catch(function (e) {
            resolve({ success: false, error: 'Screenshot failed: ' + e.message });
        });
    };

    A.getAccessibilityTree = function () {
        var getAriaLabel = function (el) {
            return el.getAttribute('aria-label') ||
                   el.getAttribute('aria-labelledby') ||
                   el.getAttribute('aria-describedby') ||
                   (el.textContent ? el.textContent.trim().substring(0, 50) : '');
        };

        var getRole = function (el) { return el.getAttribute('role') || el.tagName.toLowerCase(); };

        var walk = function (el, depth) {
            depth = depth || 0;
            if (depth > 3) return null;
            var nodes = [];
            Array.from(el.children).forEach(function (child) {
                var node = {
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
                banner: document.querySelector('[role="banner"]') ? document.querySelector('[role="banner"]').tagName : undefined,
                main: document.querySelector('[role="main"], main') ? document.querySelector('[role="main"], main').tagName : undefined,
                navigation: document.querySelectorAll('[role="navigation"], nav').length,
                contentinfo: document.querySelector('[role="contentinfo"], footer') ? document.querySelector('[role="contentinfo"], footer').tagName : undefined
            },
            tree: walk(document.body)
        };
    };

    // ==================== COMPONENT ENRICHMENT ====================

    A.getResourceTypeFromClass = function (el) {
        var classList = el.className.split(' ');
        for (var i = 0; i < classList.length; i++) {
            var cls = classList[i];
            if (cls.startsWith('core-wcm-components-')) {
                return 'core/wcm/components/' + cls.replace('core-wcm-components-', '').replace(/-/g, '/');
            }
        }
        return null;
    };

    A.normalizeResourceType = function (type) {
        if (!type) return '';
        return type.replace(/\/v\d+/g, '');
    };

    A.enhanceComponent = function (el) {
        var resourceType = el.dataset.resourceType || el.dataset.cqResourcePath || A.getResourceTypeFromClass(el);
        if (!resourceType) return false;

        var normalizedType = A.normalizeResourceType(resourceType);
        var mapping = A.componentMappings[normalizedType] || A.componentMappings[resourceType];

        if (mapping) {
            el.setAttribute('data-webmcp-action', mapping.action);
            el.setAttribute('data-webmcp-description', mapping.description || '');
            el.setAttribute('data-webmcp-category', mapping.category || 'general');

            if (mapping.interactions) {
                el.setAttribute('data-webmcp-interactions', mapping.interactions.join(','));
            }

            if (mapping.getData) {
                try {
                    var data = mapping.getData.call(A, el);
                    if (data) el.setAttribute('data-webmcp-data', JSON.stringify(data).substring(0, 1000));
                } catch (e) { /* ignore */ }
            }
            return true;
        }
        return false;
    };

    A.enhanceByPatterns = function () {
        var patterns = {
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
        Object.keys(patterns).forEach(function (pattern) {
            var action = patterns[pattern];
            document.querySelectorAll('.' + pattern + ':not([data-webmcp-action])').forEach(function (el) {
                el.setAttribute('data-webmcp-action', action);
                el.setAttribute('data-webmcp-category', action === 'shopping-cart' ? 'commerce' : (action === 'form' ? 'form' : pattern));
            });
        });

        document.querySelectorAll('form:not([data-webmcp-action])').forEach(function (el) {
            el.setAttribute('data-webmcp-action', 'form');
            el.setAttribute('data-webmcp-category', 'form');
        });
    };

    A.enhanceAllComponents = function () {
        var selectors = ['[data-cq-resource-path]', '[data-resource-type]', '.aem-GridComponent'];
        var enhanced = 0;

        selectors.forEach(function (selector) {
            try {
                document.querySelectorAll(selector).forEach(function (el) { if (A.enhanceComponent(el)) enhanced++; });
            } catch (e) { /* ignore */ }
        });

        A.enhanceByPatterns();
        A.debug && console.log('[WebMCP] Enhanced ' + enhanced + ' components');
    };

    window.AEMWebMCPAutomator = A;

})(document, window);
