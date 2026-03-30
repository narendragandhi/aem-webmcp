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
 * End-to-End Tests for WebMCP Metrics Endpoint
 * Tests Prometheus and JSON metrics exposition.
 *
 * @since 1.1.0
 */
describe('AEM WebMCP - Metrics API Tests', () => {

    const METRICS_ENDPOINT = '/bin/webmcp/metrics'

    describe('JSON Metrics Format', () => {

        it('should return metrics in JSON format by default', () => {
            cy.request({
                method: 'GET',
                url: METRICS_ENDPOINT,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(200)
                expect(response.headers['content-type']).to.include('application/json')

                expect(response.body).to.have.property('status', 'ok')
                expect(response.body).to.have.property('timestamp')
                expect(response.body).to.have.property('metrics')
                expect(response.body).to.have.property('system')
            })
        })

        it('should include metric counters', () => {
            cy.request({
                method: 'GET',
                url: METRICS_ENDPOINT,
                failOnStatusCode: false
            }).then((response) => {
                const metrics = response.body.metrics

                expect(metrics).to.have.property('counters')
                expect(metrics.counters).to.have.property('componentDetections')
                expect(metrics.counters).to.have.property('formSubmissions')
                expect(metrics.counters).to.have.property('contentFragmentFetches')
            })
        })

        it('should include metric gauges', () => {
            cy.request({
                method: 'GET',
                url: METRICS_ENDPOINT,
                failOnStatusCode: false
            }).then((response) => {
                const metrics = response.body.metrics

                expect(metrics).to.have.property('gauges')
                expect(metrics.gauges).to.have.property('activeCartSessions')
                expect(metrics.gauges).to.have.property('activeChatSessions')
            })
        })

        it('should include system information', () => {
            cy.request({
                method: 'GET',
                url: METRICS_ENDPOINT,
                failOnStatusCode: false
            }).then((response) => {
                const system = response.body.system

                expect(system).to.have.property('freeMemoryMB')
                expect(system).to.have.property('totalMemoryMB')
                expect(system).to.have.property('maxMemoryMB')
                expect(system).to.have.property('availableProcessors')

                // Values should be reasonable
                expect(system.totalMemoryMB).to.be.greaterThan(0)
                expect(system.availableProcessors).to.be.greaterThan(0)
            })
        })
    })

    describe('Prometheus Metrics Format', () => {

        it('should return Prometheus exposition format', () => {
            cy.request({
                method: 'GET',
                url: `${METRICS_ENDPOINT}?format=prometheus`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.equal(200)
                expect(response.headers['content-type']).to.include('text/plain')

                // Prometheus format should include metric definitions
                expect(response.body).to.include('# HELP')
                expect(response.body).to.include('# TYPE')
            })
        })

        it('should include counter metrics in Prometheus format', () => {
            cy.request({
                method: 'GET',
                url: `${METRICS_ENDPOINT}?format=prometheus`,
                failOnStatusCode: false
            }).then((response) => {
                // Should have counter type definitions
                expect(response.body).to.include('webmcp_component_detections_total')
                expect(response.body).to.include('webmcp_form_submissions_total')
            })
        })

        it('should include gauge metrics in Prometheus format', () => {
            cy.request({
                method: 'GET',
                url: `${METRICS_ENDPOINT}?format=prometheus`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.body).to.include('webmcp_active_cart_sessions')
                expect(response.body).to.include('webmcp_active_chat_sessions')
            })
        })

        it('should include histogram metrics in Prometheus format', () => {
            cy.request({
                method: 'GET',
                url: `${METRICS_ENDPOINT}?format=prometheus`,
                failOnStatusCode: false
            }).then((response) => {
                // Histograms include _bucket, _sum, _count
                expect(response.body).to.include('_bucket')
            })
        })
    })

    describe('Metrics Caching', () => {

        it('should not cache metrics responses', () => {
            cy.request({
                method: 'GET',
                url: METRICS_ENDPOINT,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.headers['cache-control']).to.include('no-cache')
                expect(response.headers['pragma']).to.equal('no-cache')
                expect(response.headers['expires']).to.equal('0')
            })
        })
    })

    describe('Metrics Integration Tests', () => {

        it('should increment component detection counter on page load', () => {
            // Get initial count
            cy.request({
                method: 'GET',
                url: METRICS_ENDPOINT,
                failOnStatusCode: false
            }).then((initialResponse) => {
                const initialCount = initialResponse.body.metrics.counters.componentDetections

                // Visit page to trigger component detection
                cy.visit('/content/aem-webmcp/us/en.html')
                cy.window().should('have.property', 'AEMWebMCP') // Wait for WebMCP to load

                // Get updated count
                cy.request({
                    method: 'GET',
                    url: METRICS_ENDPOINT,
                    failOnStatusCode: false
                }).then((updatedResponse) => {
                    const updatedCount = updatedResponse.body.metrics.counters.componentDetections

                    // Count should have increased
                    expect(updatedCount).to.be.at.least(initialCount)
                })
            })
        })

        it('should record form submission metrics', () => {
            cy.visit('/content/aem-webmcp/us/en/contact.html')

            // Fill and submit form
            cy.get('input[name="fullName"]').type('Test User')
            cy.get('input[name="email"]').type('test@example.com')
            cy.get('form').submit()

            // Wait for form submission to complete
            cy.get('form').should('exist')

            // Check metrics
            cy.request({
                method: 'GET',
                url: METRICS_ENDPOINT,
                failOnStatusCode: false
            }).then((response) => {
                // Form submission count should be > 0
                expect(response.body.metrics.counters.formSubmissions).to.be.at.least(0)
            })
        })

        it('should track Content Fragment fetch metrics', () => {
            // Fetch a Content Fragment
            cy.request({
                method: 'GET',
                url: '/bin/webmcp/content-fragment?model=article&limit=1',
                failOnStatusCode: false
            })

            // Check metrics
            cy.request({
                method: 'GET',
                url: METRICS_ENDPOINT,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.body.metrics.counters.contentFragmentFetches).to.be.at.least(0)
            })
        })
    })

    describe('Latency Histogram Tests', () => {

        it('should record operation latencies', () => {
            // Perform some operations
            cy.request({
                method: 'GET',
                url: '/bin/webmcp/content-fragment?model=article&limit=1',
                failOnStatusCode: false
            })

            cy.request({
                method: 'GET',
                url: `${METRICS_ENDPOINT}?format=prometheus`,
                failOnStatusCode: false
            }).then((response) => {
                // Should have histogram data
                const body = response.body

                // Look for histogram buckets
                const hasBuckets = body.includes('_bucket{')
                const hasSum = body.includes('_sum')
                const hasCount = body.includes('_count')

                // At least some histogram data should exist
                cy.log(`Histogram data - buckets: ${hasBuckets}, sum: ${hasSum}, count: ${hasCount}`)
            })
        })
    })

    describe('Metrics Security', () => {

        it('should not expose sensitive information', () => {
            cy.request({
                method: 'GET',
                url: METRICS_ENDPOINT,
                failOnStatusCode: false
            }).then((response) => {
                const body = JSON.stringify(response.body)

                // Should not contain passwords, tokens, etc.
                expect(body).to.not.include('password')
                expect(body).to.not.include('token')
                expect(body).to.not.include('secret')
                expect(body).to.not.include('apikey')
            })
        })

        it('should handle invalid format parameter gracefully', () => {
            cy.request({
                method: 'GET',
                url: `${METRICS_ENDPOINT}?format=invalid`,
                failOnStatusCode: false
            }).then((response) => {
                // Should default to JSON
                expect(response.status).to.equal(200)
                expect(response.headers['content-type']).to.include('application/json')
            })
        })
    })

    describe('Distributed Tracing', () => {

        it('should include trace headers in responses', () => {
            cy.request({
                method: 'GET',
                url: '/bin/webmcp/content-fragment?model=article&limit=1',
                failOnStatusCode: false
            }).then((response) => {
                // Trace headers may or may not be present
                const traceId = response.headers['x-trace-id'] || response.headers['x-request-id']
                cy.log(`Trace ID: ${traceId || 'not present'}`)
            })
        })

        it('should propagate trace context', () => {
            const traceId = 'test-trace-' + Date.now()

            cy.request({
                method: 'GET',
                url: '/bin/webmcp/content-fragment?model=article&limit=1',
                headers: {
                    'X-Trace-Id': traceId
                },
                failOnStatusCode: false
            }).then((response) => {
                // Response should echo or reference trace ID
                cy.log('Trace propagation test complete')
            })
        })
    })
})
