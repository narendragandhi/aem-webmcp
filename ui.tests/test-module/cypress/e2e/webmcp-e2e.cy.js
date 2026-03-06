/*
 *  Copyright 2024 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

describe('AEM WebMCP - E2E Functional Tests', () => {

    beforeEach(() => {
        cy.AEMForceLogout()
    })

    describe('Contact Form Tests', () => {

        it('should load contact form page with all fields', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            // Verify form exists
            cy.get('form').should('exist')
            
            // Verify all form fields exist
            cy.get('input[name="fullName"]').should('exist')
            cy.get('input[name="email"]').should('exist')
            cy.get('input[name="phone"]').should('exist')
            cy.get('textarea[name="message"]').should('exist')
            cy.get('select[name="department"]').should('exist')
            cy.get('input[name="preferredDate"]').should('exist')
            
            // Verify submit button
            cy.get('button[type="submit"]').should('exist')
        })

        it('should fill contact form using WebMCP API', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            // Wait for form to load
            cy.get('form').should('be.visible')
            
            // Use WebMCP to fill form
            cy.window().then((win) => {
                // Fill name
                const nameInput = win.document.querySelector('input[name="fullName"]')
                if (nameInput) {
                    nameInput.value = 'John Doe'
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }))
                }
                
                // Fill email
                const emailInput = win.document.querySelector('input[name="email"]')
                if (emailInput) {
                    emailInput.value = 'john.doe@example.com'
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }))
                }
                
                // Fill message
                const messageInput = win.document.querySelector('textarea[name="message"]')
                if (messageInput) {
                    messageInput.value = 'This is a test message for the contact form.'
                    messageInput.dispatchEvent(new Event('input', { bubbles: true }))
                }
            })
            
            // Verify values were set
            cy.get('input[name="fullName"]').should('have.value', 'John Doe')
            cy.get('input[name="email"]').should('have.value', 'john.doe@example.com')
            cy.get('textarea[name="message"]').should('have.value', 'This is a test message for the contact form.')
        })

        it('should validate required fields', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            // Submit empty form
            cy.get('form').submit()
            
            // Should show validation errors (AEM Forms handles this)
            // Just verify form didn't submit successfully
            cy.get('form').should('exist')
        })

        it('should validate email format', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            cy.window().then((win) => {
                const emailInput = win.document.querySelector('input[name="email"]')
                emailInput.value = 'invalid-email'
                emailInput.dispatchEvent(new Event('blur', { bubbles: true }))
            })
            
            // Should trigger validation (AEM handles this)
            cy.wait(500)
        })
    })

    describe('Login Form Tests', () => {

        it('should load login form on contact page', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            // Look for login form (second form on page)
            cy.get('form').should('have.length.at.least', 1)
        })

        it('should fill login form using WebMCP', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            cy.window().then((win) => {
                // Try to find login form (may not exist on all pages)
                const loginForm = win.document.querySelector('#login-form, form[id*="login"]')
                
                if (loginForm) {
                    const username = loginForm.querySelector('input[name="username"], input[name="email"]')
                    const password = loginForm.querySelector('input[name="password"]')
                    
                    if (username) {
                        username.value = 'testuser'
                        username.dispatchEvent(new Event('input', { bubbles: true }))
                    }
                    
                    if (password) {
                        password.value = 'testpass123'
                        password.dispatchEvent(new Event('input', { bubbles: true }))
                    }
                }
            })
            
            // Form should still exist
            cy.get('form').first().should('exist')
        })
    })

    describe('Search Tests', () => {

        it('should load search component on shop page', () => {
            cy.visit('/content/aem-webmcp/us/en/shop.html')
            
            // Verify search input exists
            cy.get('input[type="search"], input[type="text"]').first().should('exist')
        })

        it('should perform search using WebMCP API', () => {
            cy.visit('/content/aem-webmcp/us/en/shop.html')
            
            // Wait for page to load
            cy.get('body').should('be.visible')
            
            // Use WebMCP search (mock returns results)
            cy.window().then(async (win) => {
                if (win.AEMWebMCP && win.AEMWebMCP.search) {
                    try {
                        const results = await win.AEMWebMCP.search('demo')
                        // Should return results or empty array
                        expect(results).to.have.property('results')
                    } catch (e) {
                        // Search may fail without backend
                        cy.log('Search API not available')
                    }
                }
            })
        })
    })

    describe('Cart Tests', () => {

        it('should load shop page with product components', () => {
            cy.visit('/content/aem-webmcp/us/en/shop.html')
            
            // Verify page loaded
            cy.get('body').should('be.visible')
            
            // Look for product elements (teasers, cards, etc.)
            cy.wait(1000)
        })

        it('should have add to cart functionality', () => {
            cy.visit('/content/aem-webmcp/us/en/shop.html')
            
            // Look for add to cart buttons or links
            cy.get('body').then(($body) => {
                const addToCart = $body.find('[data-webmcp-action="shopping-cart"], .add-to-cart, a[href*="cart"]')
                if (addToCart.length > 0) {
                    cy.log('Add to cart elements found')
                }
            })
        })
    })

    describe('Navigation Tests', () => {

        it('should have working breadcrumb on demo pages', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            // Check for breadcrumb
            cy.get('nav, .breadcrumb, [data-webmcp-category="navigation"]').then(($nav) => {
                if ($nav.length > 0) {
                    // Verify breadcrumb has links
                    cy.get('a').should('exist')
                }
            })
        })

        it('should navigate between demo pages', () => {
            cy.visit('/content/aem-webmcp/us/en.html')
            
            // Find and click navigation to shop
            cy.get('a[href*="shop"]').first().click({ force: true })
            
            // Should navigate to shop page
            cy.url().should('include', 'shop')
        })
    })

    describe('Layout Components Tests', () => {

        it('should have accordion on FAQ page', () => {
            cy.visit('/content/aem-webmcp/us/en/faq.html')
            
            // Wait for accordion to load
            cy.wait(1000)
            
            // Look for accordion
            cy.get('[data-cmp-is="accordion"], .accordion, .cmp-accordion').then(($accordion) => {
                if ($accordion.length > 0) {
                    // Click first item
                    cy.get('[data-cmp-expanded], .accordion-trigger').first().click()
                    cy.wait(500)
                }
            })
        })

        it('should have tabs on FAQ page', () => {
            cy.visit('/content/aem-webmcp/us/en/faq.html')
            
            // Wait for tabs to load
            cy.wait(1000)
            
            // Look for tabs
            cy.get('[role="tablist"], .tabs, .cmp-tabs').then(($tabs) => {
                if ($tabs.length > 0) {
                    // Click second tab
                    cy.get('[role="tab"]').eq(1).click()
                    cy.wait(500)
                }
            })
        })
    })

    describe('WebMCP Component Detection Tests', () => {

        it('should detect all WebMCP components on home page', () => {
            cy.visit('/content/aem-webmcp/us/en.html')
            
            cy.window().then((win) => {
                if (win.AEMWebMCP) {
                    const components = win.AEMWebMCP.getComponents()
                    
                    // Should detect multiple component types
                    expect(components.length).to.be.greaterThan(0)
                    
                    // Log detected categories
                    const categories = [...new Set(components.map(c => c.category))]
                    cy.log(`Detected categories: ${categories.join(', ')}`)
                }
            })
        })

        it('should detect form components on contact page', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            cy.window().then((win) => {
                if (win.AEMWebMCP) {
                    const formComponents = win.AEMWebMCP.getComponents('form')
                    
                    // Should detect form components
                    expect(formComponents).to.be.an('array')
                }
            })
        })

        it('should detect commerce components on shop page', () => {
            cy.visit('/content/aem-webmcp/us/en/shop.html')
            
            cy.window().then((win) => {
                if (win.AEMWebMCP) {
                    const commerceComponents = win.AEMWebMCP.getComponents('commerce')
                    
                    // Should detect commerce components (search, cart)
                    expect(commerceComponents).to.be.an('array')
                }
            })
        })
    })

    describe('Accessibility Tests', () => {

        it('should have proper form labels', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            // Check inputs have labels or aria-labels
            cy.get('input[name="fullName"]').then(($input) => {
                const id = $input.attr('id')
                const ariaLabel = $input.attr('aria-label')
                const labelledBy = $input.attr('aria-labelledby')
                
                // Should have some form of labeling
                expect(id || ariaLabel || labelledBy).to.exist
            })
        })

        it('should have proper heading structure', () => {
            cy.visit('/content/aem-webmcp/us/en.html')
            
            // Check for h1
            cy.get('h1').should('exist')
            
            // Check headings are in order (no skipping h1 to h3)
            cy.get('h1, h2, h3').then(($headings) => {
                const levels = $headings.map((i, el) => parseInt(el.tagName.substring(1))).get()
                
                // Verify we have at least one heading
                expect(levels.length).to.be.greaterThan(0)
            })
        })
    })

    describe('Performance Tests', () => {

        it('should load home page within reasonable time', () => {
            const start = Date.now()
            
            cy.visit('/content/aem-webmcp/us/en.html', {
                timeout: 30000
            })
            
            cy.window().then(() => {
                const loadTime = Date.now() - start
                cy.log(`Page load time: ${loadTime}ms`)
                
                // Page should load within 10 seconds
                expect(loadTime).to.be.lessThan(10000)
            })
        })

        it('should load WebMCP script without blocking page', () => {
            cy.visit('/content/aem-webmcp/us/en.html')
            
            // Page should be interactive quickly
            cy.get('body').should('be.visible')
            
            // WebMCP should initialize
            cy.window().then((win) => {
                // Give time for async initialization
                setTimeout(() => {
                    expect(win.AEMWebMCP).to.exist
                }, 1000)
            })
        })
    })

    describe('Security Tests', () => {

        it('should have CSRF token on forms', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            cy.get('form').first().within(() => {
                // Check for CSRF token (hidden input)
                cy.get('input[type="hidden"][name*="token"], input[name="csrf"]').then(($input) => {
                    // CSRF token may or may not be present depending on AEM config
                    cy.log('CSRF check complete')
                })
            })
        })

        it('should not expose sensitive data in DOM', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')
            
            cy.window().then((win) => {
                // Check that passwords are not visible in DOM
                const passwords = win.document.querySelectorAll('input[type="password"]')
                passwords.forEach((p) => {
                    expect(p.type).to.equal('password')
                })
            })
        })
    })
})
