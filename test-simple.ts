#!/usr/bin/env node
import puppeteer from 'puppeteer';

async function testTorConnection() {
    let browser;
    try {
        console.log('🔧 Testing simple Tor connection...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--proxy-server=socks5://127.0.0.1:9050'
            ]
        });
        
        const page = await browser.newPage();
        
        // Test with a simple HTTP site first
        console.log('🌐 Testing HTTP connection through Tor...');
        try {
            await page.goto('http://httpbin.org/ip', { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
            console.log('✅ HTTP connection through Tor successful');
            
            const content = await page.content();
            console.log('📄 Response preview:', content.substring(0, 200) + '...');
        } catch (error) {
            console.error('❌ HTTP test failed:', (error as Error).message);
        }
        
        // Test with the onion site
        console.log('🧅 Testing onion site connection...');
        try {
            await page.goto('http://h3h66vqwmmxxheeuwi4hhk52ic5svhnb73xdnxnzaj6vrnk742ntnhyd.onion/', { 
                waitUntil: 'domcontentloaded',
                timeout: 45000 
            });
            console.log('✅ Onion site connection successful');
            
            // Look for links containing "expires in"
            const expiresLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                return links.filter(link => 
                    link.textContent && link.textContent.toLowerCase().includes('expires in')
                ).map(link => ({
                    text: link.textContent,
                    href: link.href
                }));
            });
            
            console.log('🔗 Found "expires in" links:', expiresLinks.length);
            
            // Look for the target div
            const targetDiv = await page.$('.link-listonline');
            if (targetDiv) {
                console.log('✅ Found target div with class "link-listonline"');
            } else {
                console.log('⚠️  Target div "link-listonline" not found');
            }
            
        } catch (error) {
            console.error('❌ Onion site test failed:', (error as Error).message);
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔧 Browser closed');
        }
    }
}

testTorConnection().catch(console.error);