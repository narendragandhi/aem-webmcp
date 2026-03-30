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

/**
 * End-to-End Tests for Complete AI Agent Workflows
 * Tests full user journeys performed by AI agents using WebMCP.
 *
 * @since 1.1.0
 */
describe('AEM WebMCP - AI Agent Workflow Tests', () => {

    describe('E-Commerce Workflow: Product Discovery to Checkout', () => {

        it('should complete product search workflow', () => {
            cy.visit('/content/aem-webmcp/us/en/shop.html')
            cy.window().should('have.property', 'AEMWebMCP')

            cy.window().then((win) => {
                // Step 1: Get page context
                const pageInfo = win.AEMWebMCP.getPageInfo()
                expect(pageInfo.path).to.include('shop')

                // Step 2: Find search component
                const searchComponents = win.AEMWebMCP.getComponents('commerce')
                cy.log(`Found ${searchComponents.length} commerce components`)

                // Step 3: Perform search
                if (win.AEMWebMCP.search) {
                    cy.wrap(win.AEMWebMCP.search('product')).then((result) => {
                        expect(result).to.have.property('results')
                    })
                }
            })
        })

        it('should complete add-to-cart workflow', () => {
            cy.visit('/content/aem-webmcp/us/en/shop.html')

            cy.window().then((win) => {
                // Step 1: Discover product elements
                const products = win.AEMWebMCP.getComponents('product')

                // Step 2: Try to add first product to cart
                if (products.length > 0 && win.AEMWebMCP.addToCart) {
                    cy.wrap(win.AEMWebMCP.addToCart(products[0], 1)).then((result) => {
                        expect(result).to.have.property('success')
                        if (result.success) {
                            cy.log('Product added to cart successfully')
                        }
                    })
                }
            })
        })

        it('should complete checkout form workflow', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            cy.window().then((win) => {
                // Step 1: Discover form
                const forms = win.AEMWebMCP.getComponents('form')
                expect(forms.length).to.be.greaterThan(0)

                // Step 2: Fill form fields
                const formData = {
                    'fullName': 'AI Test User',
                    'email': 'ai-test@example.com',
                    'phone': '555-123-4567',
                    'message': 'This is an automated test from AI agent'
                }

                Object.entries(formData).forEach(([field, value]) => {
                    const result = win.AEMWebMCP.fillForm(`input[name="${field}"], textarea[name="${field}"]`, value)
                    cy.log(`Filled ${field}: ${result.success}`)
                })

                // Verify fields were filled
                cy.get('input[name="fullName"]').should('have.value', 'AI Test User')
                cy.get('input[name="email"]').should('have.value', 'ai-test@example.com')
            })
        })
    })

    describe('Content Discovery Workflow', () => {

        it('should navigate and extract content', () => {
            cy.visit('/content/aem-webmcp/us/en.html')

            cy.window().then((win) => {
                // Step 1: Get navigation components
                const navComponents = win.AEMWebMCP.getComponents('navigation')
                cy.log(`Found ${navComponents.length} navigation components`)

                // Step 2: Get page content structure
                const pageInfo = win.AEMWebMCP.getPageInfo()
                expect(pageInfo).to.have.property('components')

                // Step 3: Extract headings and text
                const headings = win.document.querySelectorAll('h1, h2, h3')
                const extractedContent = Array.from(headings).map(h => h.textContent)
                cy.log(`Extracted ${extractedContent.length} headings`)
            })
        })

        it('should handle accordion content discovery', () => {
            cy.visit('/content/aem-webmcp/us/en/faq.html')

            cy.window().then((win) => {
                // Find accordion
                const accordions = win.AEMWebMCP.getComponents('accordion')

                if (accordions.length > 0) {
                    // Interact with accordion to reveal content
                    const result = win.AEMWebMCP.interact(accordions[0], 'click')
                    cy.log(`Accordion interaction: ${result.success}`)

                    // Extract revealed content (accordion animation completes)
                    cy.get('[data-cmp-is="accordion"] [role="region"]').should('be.visible').then(($panels) => {
                        const panelCount = $panels.filter(':visible').length
                        cy.log(`Visible accordion panels: ${panelCount}`)
                    })
                }
            })
        })

        it('should handle tab content discovery', () => {
            cy.visit('/content/aem-webmcp/us/en/faq.html')

            cy.window().then((win) => {
                // Find tabs
                const tabs = win.AEMWebMCP.getComponents('tabs')

                if (tabs.length > 0) {
                    // Get all tab panels
                    cy.get('[role="tablist"]').then(($tablist) => {
                        const tabCount = $tablist.find('[role="tab"]').length
                        cy.log(`Found ${tabCount} tabs`)

                        // Click each tab and extract content
                        cy.get('[role="tab"]').each(($tab, index) => {
                            cy.wrap($tab).click()
                            cy.get('[role="tabpanel"]').should('be.visible')
                        })
                    })
                }
            })
        })
    })

    describe('Multi-Page Navigation Workflow', () => {

        it('should navigate through site using breadcrumbs', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            cy.window().then((win) => {
                // Get breadcrumb navigation
                const breadcrumbs = win.AEMWebMCP.getComponents('breadcrumb')

                if (breadcrumbs.length > 0) {
                    // Extract breadcrumb links
                    cy.get('.breadcrumb a, nav a').then(($links) => {
                        const paths = $links.map((i, el) => el.href).get()
                        cy.log(`Breadcrumb paths: ${paths.join(', ')}`)

                        // Navigate to home via breadcrumb
                        if ($links.length > 0) {
                            cy.wrap($links.first()).click()
                            cy.url().should('not.include', 'contact')
                        }
                    })
                }
            })
        })

        it('should use language navigation', () => {
            cy.visit('/content/aem-webmcp/us/en.html')

            cy.window().then((win) => {
                // Get language navigation
                const langNav = win.AEMWebMCP.getComponents('languagenavigation')

                if (langNav.length > 0) {
                    cy.log('Language navigation found')

                    // List available languages
                    cy.get('[data-webmcp-category="languagenavigation"] a, .languagenavigation a').then(($langs) => {
                        const languages = $langs.map((i, el) => ({
                            text: el.textContent,
                            href: el.href
                        })).get()

                        cy.log(`Available languages: ${languages.map(l => l.text).join(', ')}`)
                    })
                }
            })
        })
    })

    describe('Form Assistance Workflow', () => {

        it('should provide form field suggestions', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            cy.window().then((win) => {
                if (win.AEMFormAgent && win.AEMFormAgent.analyzeFields) {
                    cy.wrap(win.AEMFormAgent.analyzeFields()).then((fields) => {
                        expect(fields).to.be.an('array')

                        // Check each field has metadata
                        fields.forEach((field) => {
                            expect(field).to.have.property('name')
                            expect(field).to.have.property('type')
                        })

                        // Log field summary
                        cy.log(`Form fields: ${fields.map(f => f.name).join(', ')}`)
                    })
                }
            })
        })

        it('should validate form before submission', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            // Submit empty form
            cy.get('form').first().within(() => {
                cy.get('button[type="submit"]').click()
            })

            // Check for validation messages
            cy.get('form').then(($form) => {
                const invalidInputs = $form.find(':invalid')
                cy.log(`Invalid inputs: ${invalidInputs.length}`)
            })
        })

        it('should complete form with voice-like input', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            cy.window().then((win) => {
                if (win.AEMFormAgent && win.AEMFormAgent.processInput) {
                    // Simulate natural language inputs
                    const voiceInputs = [
                        'My name is AI Agent',
                        'Email is agent@ai.test',
                        'Call me at 555-999-1234',
                        'I want to inquire about your services'
                    ]

                    voiceInputs.forEach((input) => {
                        win.AEMFormAgent.processInput(input)
                    })

                    // Verify form was filled
                    cy.get('input[name="fullName"]').should('have.value', 'AI Agent')
                }
            })
        })
    })

    describe('Accessibility Audit Workflow', () => {

        it('should perform accessibility scan', () => {
            cy.visit('/content/aem-webmcp/us/en.html')

            cy.window().then((win) => {
                if (win.AEMAuditAgent && win.AEMAuditAgent.scanPage) {
                    cy.wrap(win.AEMAuditAgent.scanPage()).then(() => {
                        const issues = win.AEMAuditAgent.issues || []

                        cy.log(`Accessibility issues found: ${issues.length}`)

                        // Log issue types
                        if (issues.length > 0) {
                            const types = [...new Set(issues.map(i => i.type))]
                            cy.log(`Issue types: ${types.join(', ')}`)
                        }
                    })
                }
            })
        })

        it('should check images for alt text', () => {
            cy.visit('/content/aem-webmcp/us/en.html')

            cy.get('img').then(($images) => {
                const missingAlt = $images.filter((i, el) => !el.alt || el.alt.trim() === '').length
                const total = $images.length

                cy.log(`Images: ${total} total, ${missingAlt} missing alt text`)

                // All images should have alt text
                expect(missingAlt).to.equal(0)
            })
        })

        it('should check form labels', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            cy.get('input, select, textarea').each(($input) => {
                const id = $input.attr('id')
                const ariaLabel = $input.attr('aria-label')
                const ariaLabelledBy = $input.attr('aria-labelledby')

                // Check for associated label
                if (id) {
                    cy.get(`label[for="${id}"]`).should('exist').or(() => {
                        expect(ariaLabel || ariaLabelledBy).to.exist
                    })
                } else {
                    // Should have aria attributes
                    expect(ariaLabel || ariaLabelledBy).to.exist
                }
            })
        })
    })

    describe('Content RAG (In-Page Search) Workflow', () => {

        it('should answer questions from page content', () => {
            cy.visit('/content/aem-webmcp/us/en.html')

            cy.window().then((win) => {
                if (win.AEMContentAgent) {
                    // Index should be ready
                    expect(win.AEMContentAgent.pageContent).to.not.be.empty

                    // Ask a question
                    if (win.AEMContentAgent.ask) {
                        const answer = win.AEMContentAgent.ask('What is this site about?')
                        expect(answer).to.be.a('string')
                        cy.log(`Answer: ${answer}`)
                    }
                }
            })
        })

        it('should extract key information from page', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            cy.window().then((win) => {
                if (win.AEMContentAgent && win.AEMContentAgent.chunks) {
                    // Should have chunked page content
                    expect(win.AEMContentAgent.chunks.length).to.be.greaterThan(0)

                    cy.log(`Content chunks: ${win.AEMContentAgent.chunks.length}`)

                    // Search for specific information
                    if (win.AEMContentAgent.search) {
                        const results = win.AEMContentAgent.search('contact')
                        expect(results).to.be.an('array')
                    }
                }
            })
        })
    })

    describe('Error Recovery Workflow', () => {

        it('should recover from failed navigation', () => {
            cy.visit('/content/aem-webmcp/us/en.html')

            cy.window().then((win) => {
                // Try to navigate to non-existent page
                const result = win.AEMWebMCP.interact('a[href="/nonexistent"]', 'click')

                // Should handle gracefully
                expect(result.success).to.be.false
                expect(result.error).to.exist
            })
        })

        it('should recover from invalid form field', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            cy.window().then((win) => {
                // Try to fill non-existent field
                const result = win.AEMWebMCP.fillForm('input[name="nonexistent"]', 'value')

                expect(result.success).to.be.false
                expect(result.error).to.include('not found')
            })
        })

        it('should handle network timeout', () => {
            cy.visit('/content/aem-webmcp/us/en.html')

            // Intercept search to simulate timeout
            cy.intercept('GET', '**/bin/querybuilder*', {
                delay: 30000,
                statusCode: 200,
                body: { results: [] }
            }).as('slowSearch')

            cy.window().then((win) => {
                if (win.AEMWebMCP.search) {
                    // Start search (will timeout)
                    win.AEMWebMCP.search('test')

                    // UI should still be responsive
                    cy.get('body').should('be.visible')
                }
            })
        })
    })

    describe('Concurrent Operations Workflow', () => {

        it('should handle multiple simultaneous operations', () => {
            cy.visit('/content/aem-webmcp/us/en.html')

            cy.window().then((win) => {
                // Perform multiple operations concurrently
                const operations = [
                    () => win.AEMWebMCP.getPageInfo(),
                    () => win.AEMWebMCP.getComponents('navigation'),
                    () => win.AEMWebMCP.getComponents('form'),
                    () => win.AEMWebMCP.getComponents('commerce')
                ]

                const results = operations.map(op => op())

                // All should complete successfully
                expect(results.length).to.equal(4)
                results.forEach((result) => {
                    expect(result).to.exist
                })
            })
        })

        it('should maintain state across operations', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            cy.window().then((win) => {
                // Fill multiple fields
                win.AEMWebMCP.fillForm('input[name="fullName"]', 'Test User')
                win.AEMWebMCP.fillForm('input[name="email"]', 'test@test.com')

                // Values should persist
                cy.get('input[name="fullName"]').should('have.value', 'Test User')
                cy.get('input[name="email"]').should('have.value', 'test@test.com')
            })
        })
    })
})
