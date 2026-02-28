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

describe('AEM WebMCP', () => {

    beforeEach(() => {
        cy.AEMForceLogout()
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.AEMLogin(Cypress.env('AEM_AUTHOR_USERNAME'), Cypress.env('AEM_AUTHOR_PASSWORD'))
    })

    it('should expose WebMCP global object when script is loaded', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.window().then((win) => {
            expect(win.AEMWebMCP).to.exist
            expect(win.AEMWebMCP.version).to.exist
            expect(win.AEMWebMCP.getComponents).to.be.a('function')
            expect(win.AEMWebMCP.getPageInfo).to.be.a('function')
        })
    })

    it('should add data-webmcp-action attributes to components', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL') + '/editor.html/content/we-retail/us/en.html')
        cy.get('[data-webmcp-action]').should('exist')
    })

    it('should get page info via WebMCP API', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.window().then((win) => {
            const pageInfo = win.AEMWebMCP.getPageInfo()
            expect(pageInfo).to.have.property('title')
            expect(pageInfo).to.have.property('url')
            expect(pageInfo).to.have.property('path')
            expect(pageInfo).to.have.property('components')
        })
    })

    it('should get components by category', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.window().then((win) => {
            const components = win.AEMWebMCP.getComponents('navigation')
            expect(components).to.be.an('array')
        })
    })

    it('should support findComponent API', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.window().then((win) => {
            const searchComponent = win.AEMWebMCP.getComponent('search', 0)
            expect(searchComponent).to.be.a('string')
        })
    })

    it('should handle fillForm with valid selector', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.window().then((win) => {
            const result = win.AEMWebMCP.fillForm('input[name="username"]', 'testuser')
            expect(result).to.have.property('success')
        })
    })

    it('should handle submitForm with valid selector', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.window().then((win) => {
            const result = win.AEMWebMCP.submitForm('form')
            expect(result).to.have.property('success')
        })
    })

    it('should handle addToCart gracefully when no product found', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.window().then((win) => {
            const result = win.AEMWebMCP.addToCart('.nonexistent-product', 1)
            expect(result.success).to.be.false
            expect(result).to.have.property('error')
        })
    })

    it('should handle interactComponent with invalid selector', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.window().then((win) => {
            const result = win.AEMWebMCP.interact('.nonexistent', 'click')
            expect(result.success).to.be.false
            expect(result).to.have.property('error')
        })
    })

    it('should support debug mode when window.WEBMCP_DEBUG is enabled', () => {
        cy.visit(Cypress.env('AEM_AUTHOR_URL'))
        cy.window().then((win) => {
            win.WEBMCP_DEBUG = true
            cy.wrap(win.AEMWebMCPAutomator).invoke('init').then(() => {
                expect(win.AEMWebMCPAutomator.debug).to.be.true
            })
        })
    })
})
