import { TorAutomationScript } from './automation';
import { TorsocksAutomationScript } from './automation-torsocks';
import { Dashboard } from './dashboard';

export class AutomationScheduler {
    private dashboard: Dashboard;
    private automation: TorAutomationScript;
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;

    private torsocksScript: TorsocksAutomationScript;

    constructor(dashboard: Dashboard) {
        this.dashboard = dashboard;
        this.automation = new TorAutomationScript(dashboard);
        this.torsocksScript = new TorsocksAutomationScript(dashboard);
    }

    public start(intervalMinutes: number = 40): void {
        this.dashboard.log('info', `Starting automation scheduler with ${intervalMinutes} minute intervals`);
        
        // Run immediately on start
        this.runAutomation();
        
        // Set up recurring execution
        this.intervalId = setInterval(() => {
            this.runAutomation();
        }, intervalMinutes * 60 * 1000);

        this.dashboard.log('success', 'Scheduler started successfully');
    }

    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.dashboard.log('info', 'Automation scheduler stopped');
        }
    }

    private async runAutomation(): Promise<void> {
        if (this.isRunning) {
            this.dashboard.log('warning', 'Automation already running, skipping this execution');
            return;
        }

        this.isRunning = true;
        this.dashboard.log('info', 'Starting automated execution...');

        try {
            // Try multiple methods for maximum compatibility
            this.dashboard.log('info', 'Attempting standard Tor browser automation...');
            
            try {
                await this.automation.run();
                this.dashboard.log('success', 'Standard automation completed successfully');
            } catch (standardError) {
                this.dashboard.log('warning', 'Standard automation failed, trying torsocks approach...', {
                    error: (standardError as Error).message
                });
                
                // Fallback to torsocks method
                await this.torsocksScript.run();
                this.dashboard.log('success', 'Torsocks automation completed successfully');
            }
            
        } catch (error) {
            this.dashboard.log('error', 'All automation methods failed', { 
                error: (error as Error).message,
                stack: (error as Error).stack 
            });
        } finally {
            this.isRunning = false;
        }
    }

    public async runOnce(): Promise<void> {
        await this.runAutomation();
    }

    public isSchedulerRunning(): boolean {
        return this.intervalId !== null;
    }

    public isAutomationRunning(): boolean {
        return this.isRunning;
    }
}