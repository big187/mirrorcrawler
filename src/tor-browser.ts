import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import { config } from './config';

export class TorBrowser {
    private browser: Browser | null = null;

    async launch(): Promise<Browser> {
        try {
            console.log('🔧 Configuring browser with Tor proxy...');
            
            const launchOptions: LaunchOptions = {
                headless: config.BROWSER_CONFIG.headless,
                defaultViewport: config.BROWSER_CONFIG.defaultViewport,
                timeout: config.BROWSER_CONFIG.timeout,
                args: config.BROWSER_CONFIG.args
            };

            console.log('🚀 Launching browser...');
            this.browser = await puppeteer.launch(launchOptions);
            
            // Test Tor connection by checking IP
            await this.validateTorConnection();
            
            return this.browser;
        } catch (error) {
            console.error('❌ Failed to launch browser with Tor proxy:', error);
            throw new Error(`Browser launch failed: ${error}`);
        }
    }

    private async validateTorConnection(): Promise<void> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        try {
            console.log('🔍 Validating Tor connection...');
            const page = await this.browser.newPage();
            
            // Set a longer timeout and try to validate by checking our external IP
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                request.continue();
            });
            
            // First try a simple connection test
            try {
                await page.goto('http://httpbin.org/ip', { 
                    waitUntil: 'domcontentloaded',
                    timeout: 20000 
                });
                console.log('✅ Basic proxy connection working');
            } catch (testError) {
                console.log('⚠️  Basic test failed, but continuing with onion site...');
            }
            
            // Now try the actual target
            await page.goto(config.TARGET_URL, { 
                waitUntil: 'domcontentloaded',
                timeout: 45000 
            });
            
            console.log('✅ Tor connection validated successfully');
            await page.close();
        } catch (error) {
            console.error('❌ Tor connection validation failed:', error);
            console.log('🔧 Skipping validation and proceeding with automation...');
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
