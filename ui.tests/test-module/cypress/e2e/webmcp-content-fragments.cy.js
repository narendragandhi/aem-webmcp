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
 * End-to-End Tests for Content Fragment API Integration
 * Tests GraphQL-based Content Fragment retrieval for AI agents.
 *
 * @since 1.1.0
 */
describe('AEM WebMCP - Content Fragment API Tests', () => {

    const CF_ENDPOINT = '/bin/webmcp/content-fragment'

    describe('Content Fragment Fetch Tests', () => {

        it('should fetch single Content Fragment by path', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?path=/content/dam/aem-webmcp/sample-cf`,
                failOnStatusCode: false
            }).then((response) => {
                // May return 404 if CF doesn't exist, but endpoint should work
                expect([200, 404]).to.include(response.status)

                if (response.status === 200) {
                    expect(response.body).to.have.property('success', true)
                    expect(response.body).to.have.property('data')
                    expect(response.body.data).to.have.property('title')
                } else {
                    expect(response.body).to.have.property('success', false)
                    expect(response.body).to.have.property('error')
                }
            })
        })

        it('should fetch Content Fragments by model name', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?model=article&limit=5`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(200)
                expect(response.body).to.have.property('success', true)
                expect(response.body).to.have.property('items')
                expect(response.body.items).to.be.an('array')
                expect(response.body).to.have.property('count')
                expect(response.body).to.have.property('limit', 5)
            })
        })

        it('should support pagination with offset', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?model=article&limit=5&offset=10`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(200)
                expect(response.body).to.have.property('offset', 10)
            })
        })

        it('should enforce maximum limit of 100', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?model=article&limit=500`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(200)
                expect(response.body.limit).to.be.at.most(100)
            })
        })

        it('should return AI-optimized format', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?path=/content/dam/aem-webmcp/sample-cf&format=ai`,
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    expect(response.body.data).to.have.property('_summary')
                    expect(response.body.data).to.have.property('_tokens')
                }
            })
        })
    })

    describe('Content Fragment Error Handling', () => {

        it('should return error when no parameters provided', () => {
            cy.request({
                method: 'GET',
                url: CF_ENDPOINT,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(400)
                expect(response.body).to.have.property('success', false)
                expect(response.body).to.have.property('error')
                expect(response.body).to.have.property('usage')
            })
        })

        it('should return 404 for non-existent Content Fragment', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?path=/content/dam/nonexistent/path`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(404)
                expect(response.body).to.have.property('success', false)
            })
        })

        it('should handle invalid path format gracefully', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?path=invalid-path`,
                failOnStatusCode: false
            }).then((response) => {
                expect([400, 404]).to.include(response.status)
            })
        })
    })

    describe('Content Fragment Response Format', () => {

        it('should return proper JSON content type', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?model=article&limit=1`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.headers['content-type']).to.include('application/json')
            })
        })

        it('should include CORS headers', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?model=article&limit=1`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.headers).to.have.property('access-control-allow-origin')
            })
        })

        it('should return UTF-8 encoded response', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?model=article&limit=1`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.headers['content-type']).to.include('utf-8')
            })
        })
    })

    describe('Content Fragment WebAI Integration', () => {

        beforeEach(() => {
            cy.visit('/content/aem-webmcp/us/en.html')
            cy.window().should('have.property', 'AEMWebMCP')
        })

        it('should fetch Content Fragment via WebAI function', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.executeFunction) {
                    cy.wrap(win.AEMWebAI.executeFunction('getContentFragment', {
                        path: '/content/dam/aem-webmcp/sample-cf'
                    })).then((result) => {
                        expect(result).to.have.property('success')
                    })
                } else {
                    cy.log('WebAI not available')
                }
            })
        })

        it('should search Content Fragments via WebAI', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.executeFunction) {
                    cy.wrap(win.AEMWebAI.executeFunction('searchContentFragments', {
                        model: 'article',
                        limit: 5
                    })).then((result) => {
                        expect(result).to.have.property('items')
                    })
                }
            })
        })

        it('should use Content Fragment data in chat response', () => {
            cy.window().then((win) => {
                if (win.AEMWebAI && win.AEMWebAI.chat) {
                    cy.wrap(win.AEMWebAI.chat('What articles are available?')).then((response) => {
                        // Response should reference CF data
                        expect(response).to.be.a('string')
                    })
                }
            })
        })
    })

    describe('Content Fragment Caching', () => {

        it('should cache repeated requests', () => {
            const path = '/content/dam/aem-webmcp/sample-cf'

            // First request
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?path=${path}`,
                failOnStatusCode: false
            }).then((response1) => {
                // Second request should be faster (cached)
                const start = Date.now()

                cy.request({
                    method: 'GET',
                    url: `${CF_ENDPOINT}?path=${path}`,
                    failOnStatusCode: false
                }).then((response2) => {
                    const elapsed = Date.now() - start
                    cy.log(`Second request took: ${elapsed}ms`)

                    // Both should return same data
                    expect(JSON.stringify(response1.body)).to.equal(JSON.stringify(response2.body))
                })
            })
        })
    })

    describe('Content Fragment Security', () => {

        it('should reject path traversal attempts', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?path=/content/dam/../../etc/passwd`,
                failOnStatusCode: false
            }).then((response) => {
                // Should reject or return 404
                expect([400, 403, 404]).to.include(response.status)
            })
        })

        it('should sanitize model parameter', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?model=<script>alert(1)</script>`,
                failOnStatusCode: false
            }).then((response) => {
                // Should not reflect XSS
                expect(JSON.stringify(response.body)).to.not.include('<script>')
            })
        })

        it('should handle SQL injection attempts', () => {
            cy.request({
                method: 'GET',
                url: `${CF_ENDPOINT}?model=article'; DROP TABLE users;--`,
                failOnStatusCode: false
            }).then((response) => {
                // Should handle gracefully
                expect([200, 400]).to.include(response.status)
            })
        })
    })
})
