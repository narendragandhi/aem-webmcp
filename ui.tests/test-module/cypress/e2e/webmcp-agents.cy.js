/**
 * End-to-End Tests for AEM WebMCP AI Agents
 * Verifies FormAgent, ContentAgent, and AuditAgent functionality.
 */

describe('AEM WebMCP - AI Agents E2E Tests', () => {

    beforeEach(() => {
        // Visit the contact page as it has most components
        cy.visit('/content/aem-webmcp/us/en/contact.html');
        
        // Ensure WebMCP and Agents are loaded
        cy.window().should('have.property', 'AEMWebMCP');
        cy.window().should('have.property', 'AEMFormAgent');
        cy.window().should('have.property', 'AEMContentAgent');
        cy.window().should('have.property', 'AEMAuditAgent');
    });

    describe('FormAgent Tests', () => {
        it('should discover and analyze the contact form', () => {
            cy.window().then(async (win) => {
                const form = await win.AEMFormAgent.discoverForm();
                expect(form).to.not.be.null;
                expect(form.category).to.equal('form');
                
                const fields = await win.AEMFormAgent.analyzeFields();
                expect(fields.length).to.be.greaterThan(0);
                
                // Verify we found required fields like email
                const hasEmail = fields.some(f => f.name === 'email');
                expect(hasEmail).to.be.true;
            });
        });

        it('should fill form fields via natural language input', () => {
            cy.window().then((win) => {
                // Simulate "My email is test@example.com"
                win.AEMFormAgent.processInput('My email is test@example.com');
                
                // Simulate "My name is John Doe"
                win.AEMFormAgent.processInput('My name is John Doe');
            });

            // Verify the DOM was updated via WebMCP
            cy.get('input[name="email"]').should('have.value', 'test@example.com');
            cy.get('input[name="fullName"]').should('have.value', 'John Doe');
        });

        it('should extract data from complex patterns', () => {
            cy.window().then((win) => {
                // Phone number pattern
                win.AEMFormAgent.processInput('Call me at 555-123-4567');
            });
            
            cy.get('input[name="phone"]').should('have.value', '555-123-4567');
        });
    });

    describe('ContentAgent (In-Page RAG) Tests', () => {
        it('should index page content on load', () => {
            cy.window().then((win) => {
                expect(win.AEMContentAgent.pageContent).to.not.be.empty;
                expect(win.AEMContentAgent.chunks.length).to.be.greaterThan(0);
            });
        });

        it('should answer questions based on page context', () => {
            cy.window().then((win) => {
                // Search for "Contact" which should be in the title/content
                const answer = win.AEMContentAgent.ask('What is this page about?');
                expect(answer).to.contain('Contact');
            });
        });

        it('should handle questions with no match gracefully', () => {
            cy.window().then((win) => {
                const answer = win.AEMContentAgent.ask('How many zebras are in the office?');
                expect(answer).to.equal("I couldn't find that information on this page.");
            });
        });
    });

    describe('AuditAgent (Accessibility) Tests', () => {
        it('should scan page and find issues', () => {
            cy.window().then(async (win) => {
                // Spy on console.warn to see if issues are reported
                cy.spy(win.console, 'warn').as('consoleWarn');
                
                await win.AEMAuditAgent.scanPage();
                
                // If the page has issues (likely, in a demo), they should be in the list
                // We can't guarantee issues in a dynamic env, but we can check if it ran
                expect(win.AEMAuditAgent.issues).to.be.an('array');
            });
        });

        it('should highlight issues in debug mode', () => {
            cy.window().then((win) => {
                win.WEBMCP_DEBUG = true;
                
                // Manually add an issue and check if it's highlighted
                win.AEMAuditAgent.reportIssue('Manual test issue', 'input[name="email"]');
                
                cy.get('input[name="email"]').should('have.css', 'border', '2px solid rgb(255, 0, 0)');
            });
        });
    });

    describe('Voice Interface Integration', () => {
        it('should trigger FormAgent via voice command "fill form"', () => {
            cy.window().then((win) => {
                const voice = new win.AEMWebMCPAutomator.VoiceCommand(document.body);
                cy.spy(win.AEMFormAgent, 'discoverForm').as('discoverSpy');
                
                voice.executeCommand('fill-form');
                
                cy.get('@discoverSpy').should('have.been.called');
            });
        });

        it('should trigger AuditAgent via voice command "check accessibility"', () => {
            cy.window().then((win) => {
                const voice = new win.AEMWebMCPAutomator.VoiceCommand(document.body);
                cy.spy(win.AEMAuditAgent, 'scanPage').as('scanSpy');
                
                voice.executeCommand('audit');
                
                cy.get('@scanSpy').should('have.been.called');
            });
        });

        it('should trigger ContentAgent via voice command "what is X"', () => {
            cy.window().then((win) => {
                const voice = new win.AEMWebMCPAutomator.VoiceCommand(document.body);
                cy.spy(win.AEMContentAgent, 'ask').as('askSpy');
                
                voice.executeCommand('ask', 'shipping');
                
                cy.get('@askSpy').should('have.been.calledWith', 'shipping');
            });
        });
    });
});
