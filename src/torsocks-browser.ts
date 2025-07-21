import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import { spawn } from 'child_process';
import { Dashboard } from './dashboard';
import { config } from './config';

export class TorsocksBrowser {
    private browser: Browser | null = null;
    private dashboard: Dashboard;

    constructor(dashboard: Dashboard) {
        this.dashboard = dashboard;
    }

    async launch(): Promise<Browser> {
        try {
            this.dashboard.log('info', 'Launching browser with torsocks...');

            // Use torsocks to wrap the browser execution
            const launchOptions: LaunchOptions = {
                headless: config.BROWSER_CONFIG.headless,
                defaultViewport: config.BROWSER_CONFIG.defaultViewport,
                timeout: config.BROWSER_CONFIG.timeout,
                executablePath: '/usr/bin/google-chrome-stable', // Use system Chrome
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-renderer-backgrounding',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--ignore-certificate-errors',
                    '--ignore-ssl-errors',
                    '--disable-site-isolation-trials',
                    '--user-data-dir=/tmp/chrome-tor-profile',
                    // Remove proxy settings since torsocks handles it
                ]
            };

            // Start browser through torsocks
            this.dashboard.log('info', 'Starting Chrome through torsocks...');
            
            this.browser = await this.launchWithTorsocks(launchOptions);
            
            // Validate connection
            await this.validateConnection();
            
            return this.browser;
        } catch (error) {
            this.dashboard.log('error', 'Failed to launch browser with torsocks', { 
                error: (error as Error).message 
            });
            throw error;
        }
    }

    private async launchWithTorsocks(options: LaunchOptions): Promise<Browser> {
        // Set environment variables for torsocks
        const env = {
            ...process.env,
            TORSOCKS_ALLOW_INBOUND: '1',
            TORSOCKS_DISABLE_CHECK_DNS: '1'
        };

        // Launch puppeteer with torsocks
        return new Promise((resolve, reject) => {
            const torsocksProcess = spawn('torsocks', ['node', '-e', `
                const puppeteer = require('puppeteer');
                (async () => {
                    const browser = await puppeteer.launch(${JSON.stringify(options)});
                    const wsEndpoint = browser.wsEndpoint();
                    console.log('WS_ENDPOINT:' + wsEndpoint);
                    // Keep process alive
                    setInterval(() => {}, 1000);
                })();
            `], { env, stdio: 'pipe' });

            let wsEndpoint = '';
            
            torsocksProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('WS_ENDPOINT:')) {
                    wsEndpoint = output.split('WS_ENDPOINT:')[1].trim();
                    this.dashboard.log('success', 'Browser launched through torsocks');
                    
                    // Connect to the browser
                    puppeteer.connect({ browserWSEndpoint: wsEndpoint })
                        .then(resolve)
                        .catch(reject);
                }
            });

            torsocksProcess.stderr.on('data', (data) => {
                this.dashboard.log('warning', 'Torsocks stderr', { data: data.toString() });
            });

            torsocksProcess.on('error', reject);
            
            // Timeout after 30 seconds
            setTimeout(() => {
                reject(new Error('Torsocks browser launch timeout'));
            }, 30000);
        });
    }

    private async validateConnection(): Promise<void> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        try {
            this.dashboard.log('info', 'Validating torsocks connection...');
            const page = await this.browser.newPage();
            
            // Test external IP
            await page.goto('http://httpbin.org/ip', { 
                waitUntil: 'domcontentloaded',
                timeout: 20000 
            });
            
            const content = await page.content();
            this.dashboard.log('success', 'Torsocks connection validated', {
                response_preview: content.substring(0, 200)
            });
            
            await page.close();
        } catch (error) {
            this.dashboard.log('warning', 'Torsocks validation failed, but continuing', { 
                error: (error as Error).message 
            });
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.dashboard.log('info', 'Torsocks browser closed');
        }
    }

    getBrowser(): Browser | null {
        return this.browser;
    }
}