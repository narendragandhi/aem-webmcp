/**
 * Sample AI Agent - WebMCP Demonstration Script
 * 
 * This script demonstrates how an AI agent would interact with
 * an AEM website enhanced with WebMCP.
 * 
 * Usage: Run in browser console on a WebMCP-enabled AEM page
 * 
 * @version 1.0.0
 */

class AEMWebMCPAgent {
    constructor() {
        this.components = [];
        this.pageInfo = null;
    }

    /**
     * Initialize and discover all components on the page
     */
    async discover() {
        console.log('[Agent] 🔍 Discovering page components...');
        
        this.pageInfo = window.AEMWebMCP.getPageInfo();
        console.log(`[Agent] 📄 Page: ${this.pageInfo.title}`);
        console.log(`[Agent] 🔗 URL: ${this.pageInfo.url}`);
        
        this.components = window.AEMWebMCP.getComponents();
        console.log(`[Agent] ✅ Found ${this.components.length} WebMCP components`);
        
        this.categorizeComponents();
        return this;
    }

    /**
     * Categorize components by type
     */
    categorizeComponents() {
        const categories = {};
        this.components.forEach(comp => {
            const cat = comp.category || 'unknown';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(comp);
        });
        
        console.log('[Agent] 📊 Components by category:');
        Object.entries(categories).forEach(([cat, comps]) => {
            console.log(`   ${cat}: ${comps.length} components`);
        });
        
        return categories;
    }

    /**
     * Find a component by action type
     */
    findComponent(action, index = 0) {
        const selector = window.AEMWebMCP.getComponent(action, index);
        if (!selector) {
            console.error(`[Agent] ❌ Component '${action}' not found at index ${index}`);
            return null;
        }
        console.log(`[Agent] 🎯 Found ${action} at: ${selector}`);
        return selector;
    }

    /**
     * Search the site
     */
    async search(query) {
        console.log(`[Agent] 🔎 Searching for: "${query}"`);
        return window.AEMWebMCP.search(query);
    }

    /**
     * Fill a form field
     */
    async fillForm(selector, value) {
        console.log(`[Agent] 📝 Filling "${selector}" with: "${value}"`);
        return window.AEMWebMCP.fillForm(selector, value);
    }

    /**
     * Submit a form
     */
    async submitForm(selector) {
        console.log(`[Agent] 📤 Submitting form: ${selector}`);
        return window.AEMWebMCP.submitForm(selector);
    }

    /**
     * Interact with a component
     */
    async interact(selector, action, options = {}) {
        console.log(`[Agent] 🔧 Interacting with ${selector} - action: ${action}`);
        return window.AEMWebMCP.interact(selector, action, options);
    }

    /**
     * Add product to cart
     */
    async addToCart(selector, quantity = 1) {
        console.log(`[Agent] 🛒 Adding to cart: ${selector} (qty: ${quantity})`);
        return window.AEMWebMCP.addToCart(selector, quantity);
    }

    /**
     * Navigate to a page
     */
    navigate(url) {
        console.log(`[Agent] 🧭 Navigating to: ${url}`);
        window.AEMWebMCP.navigate(url);
    }

    /**
     * Demo: Complete user journey
     */
    async demoJourney() {
        console.log('\n=== 🚀 Starting WebMCP Demo Journey ===\n');
        
        // Step 1: Discover page
        await this.discover();
        console.log('');
        
        // Step 2: Find and use search
        const searchComp = this.findComponent('search');
        if (searchComp) {
            await this.search('products');
            console.log('');
        }
        
        // Step 3: Find and fill a form
        const formComp = this.findComponent('form');
        if (formComp) {
            await this.fillForm('input[name="name"]', 'John Doe');
            await this.fillForm('input[name="email"]', 'john@example.com');
            console.log('');
        }
        
        // Step 4: Interact with accordion
        const accordionComp = this.findComponent('accordion');
        if (accordionComp) {
            await this.interact(accordionComp, 'expand');
            console.log('');
        }
        
        // Step 5: Navigate using breadcrumb
        const breadcrumbComp = this.findComponent('breadcrumb');
        if (breadcrumbComp) {
            console.log('[Agent] 📍 Breadcrumb navigation available');
            console.log('');
        }

        console.log('=== ✅ Demo Journey Complete ===\n');
    }

    /**
     * Generate natural language summary for AI
     */
    getSummary() {
        const summary = {
            page: this.pageInfo,
            components: this.components.map(c => ({
                type: c.action,
                category: c.category,
                description: c.description,
                interactions: c.interactions,
                selector: c.selector
            })),
            capabilities: []
        };

        // Extract available actions
        const actions = new Set(this.components.map(c => c.action));
        summary.capabilities = Array.from(actions);

        return summary;
    }
}

// Make globally available
window.AEMWebMCPAgent = AEMWebMCPAgent;

// Auto-run demo if URL contains WebMCP demo
if (window.location.href.includes('webmcp') || window.location.href.includes('demo')) {
    console.log('[Agent] 🎬 WebMCP Demo Mode Active');
    console.log('[Agent] Run: new AEMWebMCPAgent().demoJourney()\n');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AEMWebMCPAgent;
}
