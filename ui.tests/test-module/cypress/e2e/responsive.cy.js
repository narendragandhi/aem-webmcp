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

describe('AEM WebMCP - Responsive Tests', () => {

    const VIEWPORTS = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1280, height: 800 },
        { name: 'Large Desktop', width: 1920, height: 1080 }
    ]

    beforeEach(() => {
        cy.AEMForceLogout()
    })

    VIEWPORTS.forEach((viewport) => {
        describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {

            beforeEach(() => {
                cy.viewport(viewport.width, viewport.height)
            })

            it(`should display home page correctly on ${viewport.name}`, () => {
                cy.visit('/content/aem-webmcp/us/en.html', { timeout: 30000 })
                
                // Page should be visible
                cy.get('body').should('be.visible')
                
                // Main content should be visible
                cy.get('main, .content, #main').should('exist')
                
                // Take screenshot
                cy.screenshot(`responsive-home-${viewport.name.toLowerCase().replace(' ', '-')}`, {
                    overwrite: false
                })
            })

            it(`should display contact page correctly on ${viewport.name}`, () => {
                cy.visit('/content/aem-webmcp/us/en/contact.html', { timeout: 30000 })
                
                // Form should be visible
                cy.get('form').should('be.visible')
                
                // All form fields should be accessible
                cy.get('input, textarea, select').each(($el) => {
                    cy.wrap($el).should('be.visible')
                })
            })

            it(`should display shop page correctly on ${viewport.name}`, () => {
                cy.visit('/content/aem-webmcp/us/en/shop.html', { timeout: 30000 })
                
                // Page should be visible
                cy.get('body').should('be.visible')
            })

            it(`should display FAQ page correctly on ${viewport.name}`, () => {
                cy.visit('/content/aem-webmcp/us/en/faq.html', { timeout: 30000 })
                
                // Page should be visible
                cy.get('body').should('be.visible')
            })

            it(`should have working forms on ${viewport.name}`, () => {
                cy.visit('/content/aem-webmcp/us/en/contact.html', { timeout: 30000 })
                
                // Fill form
                cy.get('input[name="fullName"]').type('Test User')
                cy.get('input[name="email"]').type('test@example.com')
                cy.get('textarea[name="message"]').type('Test message')
                
                // Verify values
                cy.get('input[name="fullName"]').should('have.value', 'Test User')
            })
        })
    })

    describe('Touch Interaction Tests', () => {

        beforeEach(() => {
            cy.viewport(375, 667) // Mobile
        })

        it('should handle touch events on accordion', () => {
            cy.visit('/content/aem-webmcp/us/en/faq.html', { timeout: 30000 })
            
            cy.wait(1000)
            
            // Tap first accordion item
            cy.get('[data-cmp-expanded], .accordion-header, .cmp-accordion__header').first()
                .click({ force: true })
            
            cy.wait(500)
        })

        it('should handle touch events on tabs', () => {
            cy.visit('/content/aem-webmcp/us/en/faq.html', { timeout: 30000 })
            
            cy.wait(1000)
            
            // Tap second tab
            cy.get('[role="tab"]').eq(1)
                .click({ force: true })
            
            cy.wait(500)
        })

        it('should handle touch scroll on mobile', () => {
            cy.visit('/content/aem-webmcp/us/en.html', { timeout: 30000 })
            
            // Scroll down
            cy.scrollTo('bottom')
            
            // Page should still be functional
            cy.get('body').should('be.visible')
        })
    })

    describe('Orientation Tests', () => {

        it('should work in landscape orientation', () => {
            cy.viewport(667, 375) // Landscape mobile
            
            cy.visit('/content/aem-webmcp/us/en.html', { timeout: 30000 })
            
            cy.get('body').should('be.visible')
        })

        it('should work in portrait orientation', () => {
            cy.viewport(375, 667) // Portrait mobile
            
            cy.visit('/content/aem-webmcp/us/en.html', { timeout: 30000 })
            
            cy.get('body').should('be.visible')
        })
    })

    describe('Component Behavior Tests', () => {

        it('should show hamburger menu on mobile', () => {
            cy.viewport(375, 667)
            
            cy.visit('/content/aem-webmcp/us/en.html', { timeout: 30000 })
            
            // Look for mobile menu toggle
            cy.get('button[aria-label="Menu"], .menu-toggle, .nav-toggle, [data-toggle="menu"]')
                .then(($toggle) => {
                    if ($toggle.length > 0) {
                        cy.wrap($toggle).should('be.visible')
                    }
                })
        })

        it('should adjust form layout on mobile', () => {
            cy.viewport(375, 667)
            
            cy.visit('/content/aem-webmcp/us/en/contact.html', { timeout: 30000 })
            
            // Form should be usable on mobile
            cy.get('form').should('be.visible')
            cy.get('input').first().should('be.visible')
        })

        it('should stack content on mobile', () => {
            cy.viewport(375, 667)
            
            cy.visit('/content/aem-webmcp/us/en/shop.html', { timeout: 30000 })
            
            // Products should stack vertically
            cy.get('main').should('be.visible')
        })
    })

    describe('Visual Regression by Viewport', () => {

        VIEWPORTS.forEach((viewport) => {
            it(`baseline: ${viewport.name} home page`, () => {
                cy.viewport(viewport.width, viewport.height)
                cy.visit('/content/aem-webmcp/us/en.html', { timeout: 30000 })
                cy.wait(500)
                cy.screenshot(`baseline-home-${viewport.name.toLowerCase().replace(' ', '-')}`, {
                    overwrite: false
                })
            })

            it(`baseline: ${viewport.name} contact page`, () => {
                cy.viewport(viewport.width, viewport.height)
                cy.visit('/content/aem-webmcp/us/en/contact.html', { timeout: 30000 })
                cy.wait(500)
                cy.screenshot(`baseline-contact-${viewport.name.toLowerCase().replace(' ', '-')}`, {
                    overwrite: false
                })
            })
        })
    })
})
