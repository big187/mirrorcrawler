import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';

export interface LogEntry {
    timestamp: string;
    level: 'info' | 'error' | 'warning' | 'success';
    message: string;
    details?: any;
}

export interface ScreenshotEntry {
    timestamp: string;
    filename: string;
    status: 'success' | 'failed';
    webhook_response?: any;
    error?: string;
}

export class Dashboard {
    private logs: LogEntry[] = [];
    private screenshots: ScreenshotEntry[] = [];
    private app: express.Express;
    private logFile: string;
    private screenshotDir: string;

    constructor() {
        this.app = express();
        this.logFile = path.join(process.cwd(), 'automation.log');
        this.screenshotDir = path.join(process.cwd(), 'screenshots');
        this.setupServer();
        this.ensureDirectories();
    }

    private async ensureDirectories(): Promise<void> {
        try {
            await fs.mkdir(this.screenshotDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create screenshot directory:', error);
        }
    }

    private setupServer(): void {
        this.app.use(express.static('public'));
        this.app.use(express.json());

        // Dashboard HTML
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });

        // API endpoints
        this.app.get('/api/logs', (req, res) => {
            res.json(this.logs.slice(-50)); // Last 50 logs
        });

        this.app.get('/api/screenshots', (req, res) => {
            res.json(this.screenshots.slice(-20)); // Last 20 screenshots
        });

        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'running',
                last_execution: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
                total_executions: this.screenshots.length,
                success_rate: this.calculateSuccessRate(),
                tor_ports: [9050, 9051],
                target_url: 'http://h3h66vqwmmxxheeuwi4hhk52ic5svhnb73xdnxnzaj6vrnk742ntnhyd.onion/'
            });
        });

        // Manual trigger endpoint
        this.app.post('/api/trigger', (req, res) => {
            this.log('info', 'Manual automation trigger requested via dashboard');
            // Trigger will be handled by the app logic
            res.json({ message: 'Automation trigger requested' });
        });

        // Screenshot viewing
        this.app.get('/screenshots/:filename', async (req, res) => {
            try {
                const filename = req.params.filename;
                const filepath = path.join(this.screenshotDir, filename);
                await fs.access(filepath);
                res.sendFile(filepath);
            } catch (error) {
                res.status(404).send('Screenshot not found');
            }
        });
    }

    private calculateSuccessRate(): number {
        if (this.screenshots.length === 0) return 0;
        const successful = this.screenshots.filter(s => s.status === 'success').length;
        return Math.round((successful / this.screenshots.length) * 100);
    }

    private generateDashboardHTML(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tor Automation Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a1a; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #4CAF50; margin-bottom: 10px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .status-card { background: #2d2d2d; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; }
        .status-card h3 { color: #4CAF50; margin-bottom: 10px; }
        .status-card .value { font-size: 2em; font-weight: bold; }
        .logs-section, .screenshots-section { background: #2d2d2d; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .logs-section h2, .screenshots-section h2 { color: #4CAF50; margin-bottom: 15px; }
        .log-entry { padding: 10px; margin: 5px 0; border-left: 3px solid #666; background: #1a1a1a; border-radius: 4px; }
        .log-entry.info { border-left-color: #2196F3; }
        .log-entry.success { border-left-color: #4CAF50; }
        .log-entry.warning { border-left-color: #FF9800; }
        .log-entry.error { border-left-color: #f44336; }
        .log-timestamp { color: #888; font-size: 0.8em; }
        .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .screenshot-item { background: #1a1a1a; padding: 15px; border-radius: 8px; text-align: center; }
        .screenshot-item img { max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 10px; }
        .screenshot-item.success { border: 2px solid #4CAF50; }
        .screenshot-item.failed { border: 2px solid #f44336; }
        .refresh-btn { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 10px 0; }
        .refresh-btn:hover { background: #45a049; }
        .auto-refresh { color: #888; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Tor Automation Dashboard</h1>
            <p>Real-time monitoring of onion site automation</p>
            <button class="refresh-btn" onclick="refreshData()">Refresh Data</button>
            <div class="auto-refresh">Auto-refresh every 30 seconds</div>
        </div>

        <div class="status-grid" id="statusGrid">
            <!-- Status cards will be populated by JavaScript -->
        </div>

        <div class="logs-section">
            <h2>📋 Recent Logs</h2>
            <div id="logsContainer">
                <!-- Logs will be populated by JavaScript -->
            </div>
        </div>

        <div class="screenshots-section">
            <h2>📸 Recent Screenshots</h2>
            <div class="screenshot-grid" id="screenshotsContainer">
                <!-- Screenshots will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <script>
        async function fetchData() {
            try {
                const [status, logs, screenshots] = await Promise.all([
                    fetch('/api/status').then(r => r.json()),
                    fetch('/api/logs').then(r => r.json()),
                    fetch('/api/screenshots').then(r => r.json())
                ]);

                updateStatus(status);
                updateLogs(logs);
                updateScreenshots(screenshots);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        }

        function updateStatus(status) {
            const statusGrid = document.getElementById('statusGrid');
            statusGrid.innerHTML = \`
                <div class="status-card">
                    <h3>Status</h3>
                    <div class="value">\${status.status}</div>
                </div>
                <div class="status-card">
                    <h3>Total Executions</h3>
                    <div class="value">\${status.total_executions}</div>
                </div>
                <div class="status-card">
                    <h3>Success Rate</h3>
                    <div class="value">\${status.success_rate}%</div>
                </div>
                <div class="status-card">
                    <h3>Last Execution</h3>
                    <div class="value" style="font-size: 1em;">\${status.last_execution ? new Date(status.last_execution).toLocaleString() : 'Never'}</div>
                </div>
            \`;
        }

        function updateLogs(logs) {
            const logsContainer = document.getElementById('logsContainer');
            logsContainer.innerHTML = logs.map(log => \`
                <div class="log-entry \${log.level}">
                    <div class="log-timestamp">\${new Date(log.timestamp).toLocaleString()}</div>
                    <div>\${log.message}</div>
                    \${log.details ? \`<pre>\${JSON.stringify(log.details, null, 2)}</pre>\` : ''}
                </div>
            \`).join('');
        }

        function updateScreenshots(screenshots) {
            const screenshotsContainer = document.getElementById('screenshotsContainer');
            screenshotsContainer.innerHTML = screenshots.map(screenshot => \`
                <div class="screenshot-item \${screenshot.status}">
                    \${screenshot.status === 'success' ? 
                        \`<img src="/screenshots/\${screenshot.filename}" alt="Screenshot" />\` : 
                        \`<div style="color: #f44336;">❌ Failed</div>\`
                    }
                    <div>\${new Date(screenshot.timestamp).toLocaleString()}</div>
                    <div style="color: #888; font-size: 0.8em;">\${screenshot.status}</div>
                </div>
            \`).join('');
        }

        function refreshData() {
            fetchData();
        }

        // Initial load
        fetchData();

        // Auto-refresh every 30 seconds
        setInterval(fetchData, 30000);
    </script>
</body>
</html>
        `;
    }

    public log(level: LogEntry['level'], message: string, details?: any): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details
        };

        this.logs.push(entry);
        console.log(`[${level.toUpperCase()}] ${message}`, details || '');

        // Keep only last 100 logs in memory
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(-100);
        }

        // Write to log file
        this.writeToLogFile(entry);
    }

    private async writeToLogFile(entry: LogEntry): Promise<void> {
        try {
            const logLine = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}${entry.details ? ' ' + JSON.stringify(entry.details) : ''}\n`;
            await fs.appendFile(this.logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    public async saveScreenshot(imageBuffer: Buffer, status: 'success' | 'failed', error?: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshot_${timestamp}.png`;
        const filepath = path.join(this.screenshotDir, filename);

        try {
            if (status === 'success') {
                await fs.writeFile(filepath, imageBuffer);
            }

            const entry: ScreenshotEntry = {
                timestamp: new Date().toISOString(),
                filename: status === 'success' ? filename : '',
                status,
                error
            };

            this.screenshots.push(entry);

            // Keep only last 50 screenshots in memory
            if (this.screenshots.length > 50) {
                this.screenshots = this.screenshots.slice(-50);
            }

            this.log(status === 'success' ? 'success' : 'error', 
                     `Screenshot ${status}`, 
                     status === 'failed' ? { error } : { filename });

            return filename;
        } catch (error) {
            this.log('error', 'Failed to save screenshot', { error: (error as Error).message });
            throw error;
        }
    }

    public start(port: number = 5000): void {
        this.app.listen(port, '0.0.0.0', () => {
            this.log('info', `Dashboard started on port ${port}`);
            console.log(`🚀 Dashboard available at http://localhost:${port}`);
        });
    }
}