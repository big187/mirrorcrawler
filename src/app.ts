#!/usr/bin/env node
import { Dashboard } from './dashboard';
import { AutomationScheduler } from './scheduler';

async function main() {
    try {
        console.log('🚀 Starting Tor Automation Dashboard...');
        
        // Create dashboard instance
        const dashboard = new Dashboard();
        
        // Start the dashboard web server
        dashboard.start(5000);
        
        // Create and start the automation scheduler
        const scheduler = new AutomationScheduler(dashboard);
        
        // Start automation with 40-minute intervals
        scheduler.start(40);
        
        dashboard.log('success', 'Application started successfully');
        dashboard.log('info', 'Dashboard available at http://localhost:5000');
        dashboard.log('info', 'Automation will run every 40 minutes');
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            dashboard.log('info', 'Received SIGINT, shutting down gracefully...');
            scheduler.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            dashboard.log('info', 'Received SIGTERM, shutting down gracefully...');
            scheduler.stop();
            process.exit(0);
        });
        
        // Keep the process running
        process.on('unhandledRejection', (reason, promise) => {
            dashboard.log('error', 'Unhandled Rejection', { reason, promise });
        });
        
        process.on('uncaughtException', (error) => {
            dashboard.log('error', 'Uncaught Exception', { error: error.message, stack: error.stack });
        });
        
    } catch (error) {
        console.error('💥 Failed to start application:', error);
        process.exit(1);
    }
}

// Start the application
if (require.main === module) {
    main();
}

export { main };