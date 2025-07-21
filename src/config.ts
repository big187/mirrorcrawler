import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
    // Target onion site URL
    TARGET_URL: 'http://h3h66vqwmmxxheeuwi4hhk52ic5svhnb73xdnxnzaj6vrnk742ntnhyd.onion/',
    
    // Tor proxy configuration
    TOR_PROXY: {
        host: '127.0.0.1',
        port: 9051,
        type: 'socks5' as const
    },
    
    // Webhook URL for sending screenshots
    WEBHOOK_URL: process.env.WEBHOOK_URL || 'https://your-webhook-url-here.com/webhook',
    
    // Browser configuration
    BROWSER_CONFIG: {
        headless: true,
        timeout: 60000,
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-site-isolation-trials',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor,VizService',
            '--disable-ipc-flooding-protection',
            '--proxy-server=socks5://127.0.0.1:9051',
            '--proxy-bypass-list=<-loopback>',
            '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'
        ]
    },
    
    // Screenshot configuration
    SCREENSHOT_CONFIG: {
        quality: 90,
        type: 'png' as const,
        fullPage: true
    }
};

// Validate required environment variables
export function validateConfig(): void {
    if (!process.env.WEBHOOK_URL) {
        console.warn('⚠️  WEBHOOK_URL environment variable not set. Using default placeholder.');
    }
}

// Initialize config validation
validateConfig();
