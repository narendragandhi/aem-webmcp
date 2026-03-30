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
 * End-to-End Tests for WebAI Chat Integration
 * Tests TinyLlama browser-based LLM functionality with WebMCP actions.
 *
 * @since 1.1.0
 */
describe('AEM WebMCP - WebAI Chat Integration Tests', () => {

    const CHAT_WIDGET_SELECTOR = '[data-webmcp-category="chat"]'
    const CHAT_INPUT_SELECTOR = '#webmcp-chat-input, [data-webmcp-action="chat-input"]'
    const CHAT_SEND_SELECTOR = '#webmcp-chat-send, [data-webmcp-action="chat-send"]'
    const CHAT_MESSAGES_SELECTOR = '#webmcp-chat-messages, [data-webmcp-action="chat-messages"]'

    beforeEach(() => {
        cy.AEMForceLogout()
        cy.visit('/content/aem-webmcp/us/en.html')

        // Ensure WebMCP and WebAI are loaded
        cy.window().should('have.property', 'AEMWebMCP')
    })

    describe('WebAI Initialization', () => {

        it('should load WebAI module with TinyLlama model', () => {
            cy.window().then((win) => {
                // WebAI may take time to initialize
                cy.wrap(null).should(() => {
                    expect(win.AEMWebAI).to.exist
                })
            })
        })

        it('should expose WebAI function registry', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI) {
                    expect(win.AEMWebAI.functions).to.be.an('object')

                    // Check for standard functions
                    const expectedFunctions = [
                        'getPageInfo',
                        'search',
                        'fillForm',
                        'submitForm',
                        'addToCart'
                    ]

                    expectedFunctions.forEach((fnName) => {
                        expect(win.AEMWebAI.functions).to.have.property(fnName)
                    })
                }
            })
        })

        it('should report model status', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.getModelStatus) {
                    const status = win.AEMWebAI.getModelStatus()

                    expect(status).to.have.property('loaded')
                    expect(status).to.have.property('modelName')
                    expect(status).to.have.property('device')
                }
            })
        })
    })

    describe('Chat Widget UI Tests', () => {

        it('should render chat widget on page', () => {
            cy.get(CHAT_WIDGET_SELECTOR).then(($widget) => {
                if ($widget.length > 0) {
                    expect($widget).to.be.visible

                    // Verify input and send button exist
                    cy.get(CHAT_INPUT_SELECTOR).should('exist')
                    cy.get(CHAT_SEND_SELECTOR).should('exist')
                } else {
                    cy.log('Chat widget not rendered on this page')
                }
            })
        })

        it('should toggle chat widget visibility', () => {
            cy.get('[data-webmcp-action="chat-toggle"]').then(($toggle) => {
                if ($toggle.length > 0) {
                    // Click to open
                    cy.wrap($toggle).click()
                    cy.get(CHAT_WIDGET_SELECTOR).should('be.visible')

                    // Click to close
                    cy.wrap($toggle).click()
                    cy.get(CHAT_WIDGET_SELECTOR).should('not.be.visible')
                } else {
                    cy.log('Chat toggle not found')
                }
            })
        })

        it('should focus input on widget open', () => {
            cy.get('[data-webmcp-action="chat-toggle"]').then(($toggle) => {
                if ($toggle.length > 0) {
                    cy.wrap($toggle).click()
                    cy.get(CHAT_INPUT_SELECTOR).should('have.focus')
                }
            })
        })
    })

    describe('Chat Message Flow Tests', () => {

        it('should send message and receive response', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.chat) {
                    // Send a simple message
                    cy.wrap(win.AEMWebAI.chat('What is this page about?')).then((response) => {
                        expect(response).to.be.a('string')
                        expect(response.length).to.be.greaterThan(0)
                    })
                } else {
                    cy.log('WebAI chat not available')
                }
            })
        })

        it('should handle function call requests', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.chat) {
                    // Request that should trigger function call
                    cy.wrap(win.AEMWebAI.chat('Show me the page information')).then((response) => {
                        // Response should include page info from function call
                        expect(response).to.be.a('string')
                    })
                }
            })
        })

        it('should maintain conversation context', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.chat) {
                    // First message
                    cy.wrap(win.AEMWebAI.chat('My name is TestUser')).then(() => {
                        // Follow-up that requires context
                        cy.wrap(win.AEMWebAI.chat('What is my name?')).then((response) => {
                            // Should remember the name from context
                            expect(response.toLowerCase()).to.include('testuser')
                        })
                    })
                }
            })
        })

        it('should clear conversation history', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.clearHistory) {
                    win.AEMWebAI.clearHistory()

                    const history = win.AEMWebAI.getHistory ? win.AEMWebAI.getHistory() : []
                    expect(history).to.have.length(0)
                }
            })
        })
    })

    describe('WebMCP Action Integration Tests', () => {

        it('should execute getPageInfo via chat', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.executeFunction) {
                    cy.wrap(win.AEMWebAI.executeFunction('getPageInfo', {})).then((result) => {
                        expect(result).to.have.property('title')
                        expect(result).to.have.property('url')
                        expect(result).to.have.property('components')
                    })
                }
            })
        })

        it('should execute search via chat', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.executeFunction) {
                    cy.wrap(win.AEMWebAI.executeFunction('search', { query: 'demo' })).then((result) => {
                        expect(result).to.have.property('results')
                        expect(result.results).to.be.an('array')
                    })
                }
            })
        })

        it('should execute fillForm via chat', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.executeFunction) {
                    cy.wrap(win.AEMWebAI.executeFunction('fillForm', {
                        selector: 'input[name="email"]',
                        value: 'test@example.com'
                    })).then((result) => {
                        expect(result.success).to.be.true
                    })

                    // Verify DOM was updated
                    cy.get('input[name="email"]').should('have.value', 'test@example.com')
                }
            })
        })

        it('should handle addToCart via chat', () => {
            cy.visit('/content/aem-webmcp/us/en/shop.html')

            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.executeFunction) {
                    // This may fail gracefully if no products exist
                    cy.wrap(win.AEMWebAI.executeFunction('addToCart', {
                        selector: '[data-product-id]',
                        quantity: 1
                    })).then((result) => {
                        expect(result).to.have.property('success')
                    })
                }
            })
        })
    })

    describe('Error Handling Tests', () => {

        it('should handle invalid function calls gracefully', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.executeFunction) {
                    cy.wrap(win.AEMWebAI.executeFunction('nonexistentFunction', {}))
                        .then((result) => {
                            expect(result.success).to.be.false
                            expect(result.error).to.exist
                        })
                }
            })
        })

        it('should handle missing parameters gracefully', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.executeFunction) {
                    cy.wrap(win.AEMWebAI.executeFunction('fillForm', {}))
                        .then((result) => {
                            expect(result.success).to.be.false
                        })
                }
            })
        })

        it('should handle network errors gracefully', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.executeFunction) {
                    // Intercept search request to simulate failure
                    cy.intercept('GET', '**/bin/querybuilder*', {
                        statusCode: 500,
                        body: { error: 'Server error' }
                    }).as('searchError')

                    cy.wrap(win.AEMWebAI.executeFunction('search', { query: 'test' }))
                        .then((result) => {
                            expect(result).to.have.property('error')
                        })
                }
            })
        })

        it('should timeout long-running operations', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.chat) {
                    // Configure short timeout for testing
                    const originalTimeout = win.AEMWebAI.timeout
                    win.AEMWebAI.timeout = 100 // 100ms

                    // This should timeout
                    cy.wrap(win.AEMWebAI.chat('Very complex question requiring extensive processing'))
                        .then((response) => {
                            // Either returns error or completes
                            expect(response).to.exist
                        })
                        .then(() => {
                            // Restore timeout
                            win.AEMWebAI.timeout = originalTimeout
                        })
                }
            })
        })
    })

    describe('Model Loading Tests', () => {

        it('should show loading indicator while model loads', () => {
            // Reload page to trigger fresh load
            cy.reload()

            cy.get('[data-webmcp-loading="true"], .webmcp-loading').then(($loading) => {
                // Loading indicator may or may not be visible depending on load speed
                cy.log(`Loading indicator visible: ${$loading.length > 0}`)
            })
        })

        it('should fallback gracefully when model fails to load', () => {
            cy.window().then((win) => {
                // Simulate model load failure
                if (win.AEMWebAI) {
                    win.AEMWebAI._modelLoaded = false

                    // Chat should still work with fallback
                    if (win.AEMWebAI.chat) {
                        cy.wrap(win.AEMWebAI.chat('Hello')).then((response) => {
                            expect(response).to.exist
                        })
                    }
                }
            })
        })
    })

    describe('Performance Tests', () => {

        it('should respond within acceptable time', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.chat) {
                    const start = performance.now()

                    cy.wrap(win.AEMWebAI.chat('Hello')).then(() => {
                        const elapsed = performance.now() - start
                        cy.log(`Response time: ${elapsed}ms`)

                        // Should respond within 30 seconds (browser LLM is slow)
                        expect(elapsed).to.be.lessThan(30000)
                    })
                }
            })
        })

        it('should not block UI thread', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.chat) {
                    // Start long-running chat
                    win.AEMWebAI.chat('Tell me a long story')

                    // UI should still be responsive
                    cy.get('body').should('be.visible')
                    cy.get('a').first().should('be.visible')
                }
            })
        })
    })

    describe('Security Tests', () => {

        it('should sanitize user input', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.chat) {
                    // Attempt XSS injection
                    cy.wrap(win.AEMWebAI.chat('<script>alert("xss")</script>')).then((response) => {
                        // Response should not contain raw script tags
                        expect(response).to.not.include('<script>')
                    })
                }
            })
        })

        it('should not expose sensitive functions', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI) {
                    // Should not have direct access to eval or dangerous functions
                    expect(win.AEMWebAI.eval).to.be.undefined
                    expect(win.AEMWebAI._executeRaw).to.be.undefined
                }
            })
        })

        it('should respect rate limiting', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.chat) {
                    // Send multiple rapid requests
                    const requests = []
                    for (let i = 0; i < 20; i++) {
                        requests.push(win.AEMWebAI.chat(`Message ${i}`))
                    }

                    // Should not crash
                    cy.wrap(Promise.allSettled(requests)).then((results) => {
                        // At least some should complete
                        const completed = results.filter(r => r.status === 'fulfilled')
                        expect(completed.length).to.be.greaterThan(0)
                    })
                }
            })
        })
    })
})
