import { spawn } from 'child_process';
import { config } from './config';

console.log('Testing simple torsocks connection...');

async function testTorsocks(): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log('Attempting to fetch onion site with torsocks...');
        
        const curlProcess = spawn('torsocks', [
            'curl', 
            '-s', 
            '--connect-timeout', '30',
            '--max-time', '60',
            '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0',
            config.TARGET_URL
        ]);

        let htmlContent = '';
        let errorOutput = '';
        let hasData = false;

        curlProcess.stdout.on('data', (data: Buffer) => {
            htmlContent += data.toString();
            hasData = true;
            console.log(`Received data chunk: ${data.length} bytes`);
        });

        curlProcess.stderr.on('data', (data: Buffer) => {
            errorOutput += data.toString();
            console.log('STDERR:', data.toString());
        });

        curlProcess.on('close', (code: number) => {
            console.log(`Process completed with code: ${code}`);
            console.log(`Total content length: ${htmlContent.length}`);
            
            if (code === 0 && htmlContent.length > 0) {
                console.log('SUCCESS: Retrieved onion site content!');
                console.log('Preview:', htmlContent.substring(0, 500));
                
                // Look for "expires in" text
                const expiresMatches = htmlContent.match(/expires in/gi);
                if (expiresMatches) {
                    console.log(`Found ${expiresMatches.length} "expires in" occurrences`);
                }
                
                resolve();
            } else {
                console.log('FAILED:', { code, errorOutput, hasData, contentLength: htmlContent.length });
                reject(new Error(`Failed with code ${code}: ${errorOutput}`));
            }
        });

        curlProcess.on('error', (error: Error) => {
            console.log('Process error:', error.message);
            reject(error);
        });

        // Timeout after 90 seconds
        setTimeout(() => {
            curlProcess.kill('SIGTERM');
            if (hasData) {
                console.log('Timeout but received data, processing...');
                resolve();
            } else {
                reject(new Error('Timeout - no data received'));
            }
        }, 90000);
    });
}

testTorsocks()
    .then(() => {
        console.log('Test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed:', error.message);
        process.exit(1);
    });