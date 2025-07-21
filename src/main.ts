#!/usr/bin/env node
import { TorBrowser } from './tor-browser';
import { ScreenshotCapture } from './screenshot';
import { WebhookSender } from './webhook';
import { config } from './config';

class TorAutomationScript {
    private torBrowser: TorBrowser;
    private screenshotCapture: ScreenshotCapture;
    private webhookSender: WebhookSender;

    constructor() {
        this.torBrowser = new TorBrowser();
        this.screenshotCapture = new ScreenshotCapture();
        this.webhookSender = new WebhookSender();
    }

    async run(): Promise<void> {
        let browser;
        try {
            console.log('🚀 Starting Tor automation script...');
            
            // Launch browser with Tor proxy
            console.log('🔧 Launching browser with Tor proxy...');
            browser = await this.torBrowser.launch();
            console.log('✅ Browser launched successfully');
            
            const page = await browser.newPage();
            
            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0');
            
            // Navigate to onion site with retry logic
            console.log('🌐 Navigating to onion site...');
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    await page.goto(config.TARGET_URL, { 
                        waitUntil: 'networkidle2',
                        timeout: 60000 
                    });
                    break; // Success, exit retry loop
                } catch (error) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        throw error; // Re-throw after max retries
                    }
                    console.log(`⚠️  Attempt ${retryCount} failed, retrying in 5 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
            
            console.log('✅ Successfully loaded onion site');
            
            // Find and click the first <a> tag containing "expires in"
            console.log('🔍 Looking for link containing "expires in"...');
            const linkFound = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const targetLink = links.find(link => 
                    link.textContent && link.textContent.toLowerCase().includes('expires in')
                );
                
                if (targetLink) {
                    (targetLink as HTMLElement).click();
                    return true;
                }
                return false;
            });
            
            if (!linkFound) {
                throw new Error('Could not find link containing "expires in"');
            }
            
            console.log('✅ Successfully clicked link containing "expires in"');
            
            // Wait for any potential page changes after click
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Find the target div for screenshot
            console.log('📸 Capturing screenshot of target div...');
            const targetDiv = await page.$('.link-listonline');
            
            if (!targetDiv) {
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
            
            console.log('✅ Successfully captured and cropped screenshot');
            
            // Send to webhook
            console.log('📤 Sending image to webhook...');
            await this.webhookSender.sendImage(croppedImage);
            
            console.log('✅ Successfully sent image to webhook');
            console.log('🎉 Automation script completed successfully!');
            
        } catch (error) {
            console.error('❌ Error during automation:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
                console.log('🔧 Browser closed');
            }
        }
    }
}

// Main execution
async function main(): Promise<void> {
    const script = new TorAutomationScript();
    
    try {
        await script.run();
        process.exit(0);
    } catch (error) {
        console.error('💥 Script failed:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the script
if (require.main === module) {
    main();
}
