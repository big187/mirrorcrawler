#!/usr/bin/env node
import { Dashboard } from './dashboard';
import { AutomationScheduler } from './scheduler';

// Legacy single-run script for testing
async function main() {
    try {
        console.log('Running single automation execution...');
        const dashboard = new Dashboard();
        const scheduler = new AutomationScheduler(dashboard);
        
        await scheduler.runOnce();
        console.log('Single execution completed');
        process.exit(0);
    } catch (error) {
        console.error('Execution failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

export { main };