import { TorBrowser } from './tor-browser';
import { ScreenshotCapture } from './screenshot';
import { WebhookSender } from './webhook';
import { config } from './config';
import { Dashboard } from './dashboard';

export class TorAutomationScript {
    private torBrowser: TorBrowser;
    private screenshotCapture: ScreenshotCapture;
    private webhookSender: WebhookSender;
    private dashboard: Dashboard;

    constructor(dashboard: Dashboard) {
        this.torBrowser = new TorBrowser(dashboard);
        this.screenshotCapture = new ScreenshotCapture(dashboard);
        this.webhookSender = new WebhookSender(dashboard);
        this.dashboard = dashboard;
    }

    async run(): Promise<void> {
        let browser;
        try {
            this.dashboard.log('info', 'Starting Tor automation script...');
            
            // Launch browser with Tor proxy
            this.dashboard.log('info', 'Launching browser with Tor proxy...');
            browser = await this.torBrowser.launch();
            this.dashboard.log('success', 'Browser launched successfully');

            const page = await browser.newPage();
            
            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0');
            
            // Disable JavaScript (often helps with onion sites)
            await page.setJavaScriptEnabled(false);
            
            // Navigate to onion site with retry logic
            this.dashboard.log('info', 'Navigating to onion site...');
            let retryCount = 0;
            const maxRetries = 5;
            
            while (retryCount < maxRetries) {
                try {
                    // Clear any existing navigation
                    await page.goto('about:blank');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Navigate to the onion site
                    this.dashboard.log('info', `Attempting to connect to ${config.TARGET_URL} (attempt ${retryCount + 1})`);
                    
                    await page.goto(config.TARGET_URL, { 
                        waitUntil: 'domcontentloaded',
                        timeout: 90000 
                    });
                    
                    this.dashboard.log('success', 'Successfully loaded onion site');
                    break; // Success, exit retry loop
                } catch (error) {
                    retryCount++;
                    this.dashboard.log('warning', `Attempt ${retryCount} failed: ${(error as Error).message}`);
                    
                    if (retryCount >= maxRetries) {
                        // Try with JavaScript enabled as last resort
                        this.dashboard.log('info', 'Trying with JavaScript enabled...');
                        await page.setJavaScriptEnabled(true);
                        
                        try {
                            await page.goto(config.TARGET_URL, { 
                                waitUntil: 'domcontentloaded',
                                timeout: 90000 
                            });
                            this.dashboard.log('success', 'Connected with JavaScript enabled');
                            break;
                        } catch (finalError) {
                            throw new Error(`Failed to connect after ${maxRetries} attempts: ${(finalError as Error).message}`);
                        }
                    }
                    
                    this.dashboard.log('info', `Retrying in 10 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            }
            
            // Wait for page to fully load
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Re-enable JavaScript for interaction
            await page.setJavaScriptEnabled(true);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Find and click the first <a> tag containing "expires in"
            this.dashboard.log('info', 'Looking for link containing "expires in"...');
            
            const linkFound = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const targetLink = links.find(link => 
                    link.textContent && link.textContent.toLowerCase().includes('expires in')
                );
                
                if (targetLink) {
                    console.log('Found link:', targetLink.textContent);
                    (targetLink as HTMLElement).click();
                    return true;
                }
                return false;
            });
            
            if (!linkFound) {
                // Try to get page content for debugging
                const pageContent = await page.content();
                this.dashboard.log('warning', 'Could not find link containing "expires in"', {
                    contentLength: pageContent.length,
                    title: await page.title(),
                    url: page.url()
                });
                
                // Take a screenshot anyway for debugging
                const debugScreenshot = await page.screenshot({ 
                    type: 'png',
                    fullPage: true 
                });
                
                await this.dashboard.saveScreenshot(debugScreenshot as Buffer, 'failed', 'Link not found - debug screenshot');
                
                throw new Error('Could not find link containing "expires in"');
            }
            
            this.dashboard.log('success', 'Successfully clicked link containing "expires in"');
            
            // Wait for any potential page changes after click
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Find the target div for screenshot
            this.dashboard.log('info', 'Capturing screenshot of target div...');
            const targetDiv = await page.$('.link-listonline');
            
            if (!targetDiv) {
                // Take full page screenshot if target div not found
                this.dashboard.log('warning', 'Target div "link-listonline" not found, taking full page screenshot');
                const fullPageScreenshot = await page.screenshot({ 
                    type: 'png',
                    fullPage: true 
                });
                
                await this.dashboard.saveScreenshot(fullPageScreenshot as Buffer, 'failed', 'Target div not found');
                throw new Error('Could not find div with class "link-listonline"');
            }
            
            // Get element bounds for cropping
            const boundingBox = await targetDiv.boundingBox();
            
            if (!boundingBox) {
                throw new Error('Could not get bounding box of target element');
            }
            
            // Take full page screenshot
            const fullScreenshot = await page.screenshot({ 
                type: 'png',
                fullPage: true 
            });
            
            // Crop screenshot to target div
            const croppedImage = await this.screenshotCapture.cropImage(
                fullScreenshot as Buffer,
                boundingBox
            );
            
            this.dashboard.log('success', 'Successfully captured and cropped screenshot');
            
            // Save screenshot locally first
            const filename = await this.dashboard.saveScreenshot(croppedImage, 'success');
            
            // Send to webhook
            this.dashboard.log('info', 'Sending image to webhook...');
            await this.webhookSender.sendImage(croppedImage);
            
            this.dashboard.log('success', 'Successfully sent image to webhook');
            this.dashboard.log('success', 'Automation script completed successfully!');
            
        } catch (error) {
            this.dashboard.log('error', 'Error during automation', { 
                error: (error as Error).message,
                stack: (error as Error).stack 
            });
            throw error;
        } finally {
            if (browser) {
                await browser.close();
                this.dashboard.log('info', 'Browser closed');
            }
        }
    }
}