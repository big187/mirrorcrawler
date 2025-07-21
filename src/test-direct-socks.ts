import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { config } from './config';

async function testDirectSocksConnection() {
    console.log('Testing direct SOCKS5 connection to onion site...');
    
    try {
        // Create SOCKS proxy agent for port 9050 (data transfer)
        const agent = new SocksProxyAgent('socks5://127.0.0.1:9050');
        
        console.log(`Attempting to connect to: ${config.TARGET_URL}`);
        console.log('Using Tor SOCKS proxy on port 9050...');
        
        const response = await axios.get(config.TARGET_URL, {
            httpAgent: agent,
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0'
            }
        });

        console.log('SUCCESS: Connected to onion site!');
        console.log('Status:', response.status);
        console.log('Content length:', response.data.length);
        console.log('Content preview:', response.data.substring(0, 500));
        
        // Look for "expires in" content
        const expiresMatches = response.data.match(/expires in/gi);
        if (expiresMatches) {
            console.log(`Found ${expiresMatches.length} "expires in" occurrences`);
        }
        
        // Look for target div
        const divMatches = response.data.match(/class="?link-listonline"?/gi);
        if (divMatches) {
            console.log(`Found target div: ${divMatches.length} matches`);
        }

        return response.data;
        
    } catch (error) {
        console.error('FAILED: Direct SOCKS connection failed');
        console.error('Error:', (error as Error).message);
        
        if (axios.isAxiosError(error)) {
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
        }
        
        throw error;
    }
}

// Test the connection
testDirectSocksConnection()
    .then((html) => {
        console.log('Direct SOCKS test completed successfully');
        console.log('Total HTML length:', html.length);
        process.exit(0);
    })
    .catch((error) => {
        console.error('Direct SOCKS test failed:', error.message);
        process.exit(1);
    });