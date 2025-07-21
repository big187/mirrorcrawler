import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { SocksProxyAgent } from 'socks-proxy-agent';
import axios from 'axios';
import { Dashboard } from './dashboard';

export class TorProxyServer {
    private app: express.Express;
    private dashboard: Dashboard;
    private proxyPort: number;

    constructor(dashboard: Dashboard, proxyPort: number = 8080) {
        this.app = express();
        this.dashboard = dashboard;
        this.proxyPort = proxyPort;
        this.setupProxy();
    }

    private setupProxy(): void {
        this.dashboard.log('info', 'Setting up Tor proxy server...');

        // Create SOCKS proxy agent for Tor
        const agent = new SocksProxyAgent('socks5://127.0.0.1:9050');

        // Custom proxy middleware for onion sites
        this.app.use('/onion/*', async (req, res) => {
            try {
                const onionUrl = req.url.replace('/onion/', '');
                const targetUrl = `http://${onionUrl}`;
                
                this.dashboard.log('info', `Proxying request to: ${targetUrl}`);

                const response = await axios.get(targetUrl, {
                    httpAgent: agent,
                    httpsAgent: agent,
                    timeout: 60000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0'
                    }
                });

                res.set(response.headers);
                res.send(response.data);
                
                this.dashboard.log('success', `Successfully proxied request to ${targetUrl}`);
            } catch (error) {
                this.dashboard.log('error', 'Proxy request failed', { 
                    error: (error as Error).message,
                    url: req.url 
                });
                res.status(500).send('Proxy request failed');
            }
        });

        // Regular proxy for other requests
        const proxyOptions = {
            target: 'http://localhost',
            changeOrigin: true,
            agent: agent,
            onError: (err: Error, req: any, res: any) => {
                this.dashboard.log('error', 'Proxy error', { error: err.message });
                res.status(500).send('Proxy error');
            },
            onProxyReq: (proxyReq: any, req: any, res: any) => {
                this.dashboard.log('info', `Proxying: ${req.method} ${req.url}`);
            }
        };

        this.app.use('/', createProxyMiddleware(proxyOptions));
    }

    public start(): Promise<void> {
        return new Promise((resolve) => {
            this.app.listen(this.proxyPort, '127.0.0.1', () => {
                this.dashboard.log('success', `Tor proxy server started on port ${this.proxyPort}`);
                resolve();
            });
        });
    }
}