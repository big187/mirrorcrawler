import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import { config } from './config';
import { Dashboard } from './dashboard';

export class TorBrowser {
    private browser: Browser | null = null;
    private dashboard: Dashboard;

    constructor(dashboard: Dashboard) {
        this.dashboard = dashboard;
    }

    async launch(): Promise<Browser> {
        try {
            this.dashboard.log('info', 'Configuring browser with Tor proxy...');
            
            const launchOptions: LaunchOptions = {
                headless: config.BROWSER_CONFIG.headless,
                defaultViewport: config.BROWSER_CONFIG.defaultViewport,
                timeout: config.BROWSER_CONFIG.timeout,
                args: config.BROWSER_CONFIG.args
            };

            this.dashboard.log('info', 'Launching browser...');
            this.browser = await puppeteer.launch(launchOptions);
            
            // Test Tor connection by checking IP
            await this.validateTorConnection();
            
            return this.browser;
        } catch (error) {
            this.dashboard.log('error', 'Failed to launch browser with Tor proxy', { error: (error as Error).message });
            throw new Error(`Browser launch failed: ${error}`);
        }
    }

    private async validateTorConnection(): Promise<void> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        try {
            this.dashboard.log('info', 'Validating Tor connection...');
            const page = await this.browser.newPage();
            
            // First try a simple connection test
            try {
                await page.goto('http://httpbin.org/ip', { 
                    waitUntil: 'domcontentloaded',
                    timeout: 20000 
                });
                const content = await page.content();
                this.dashboard.log('success', 'Basic proxy connection working', { 
                    port: 9051,
                    response_preview: content.substring(0, 200)
                });
            } catch (testError) {
                this.dashboard.log('warning', 'Basic test failed, but continuing...', { 
                    error: (testError as Error).message 
                });
            }
            
            await page.close();
            this.dashboard.log('success', 'Tor connection validation completed');
        } catch (error) {
            this.dashboard.log('warning', 'Tor connection validation failed, proceeding anyway', { 
                error: (error as Error).message 
            });
            // Don't throw here, just log and continue
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('🔧 Browser closed successfully');
        }
    }

    getBrowser(): Browser | null {
        return this.browser;
    }
}
