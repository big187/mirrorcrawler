import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import { config } from './config';

export class WebhookSender {
    async sendImage(imageBuffer: Buffer): Promise<void> {
        try {
            console.log('📤 Preparing image for webhook delivery...');
            
            // Create form data with the image
            const formData = new FormData();
            formData.append('image', imageBuffer, {
                filename: `screenshot_${Date.now()}.png`,
                contentType: 'image/png'
            });
            
            // Add metadata
            formData.append('timestamp', new Date().toISOString());
            formData.append('source', 'tor-automation-script');
            formData.append('site', config.TARGET_URL);
            
            console.log(`📡 Sending to webhook: ${config.WEBHOOK_URL}`);
            
            const response: AxiosResponse = await axios.post(config.WEBHOOK_URL, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Tor-Automation-Script/1.0'
                },
                timeout: 30000,
                maxContentLength: 50 * 1024 * 1024, // 50MB max
                maxBodyLength: 50 * 1024 * 1024
            });
            
            if (response.status >= 200 && response.status < 300) {
                console.log('✅ Image sent to webhook successfully');
                console.log(`📊 Response status: ${response.status}`);
                console.log(`📊 Response data:`, response.data);
            } else {
                throw new Error(`Webhook returned status ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ Error sending image to webhook:', error);
            
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    console.error(`📊 Response status: ${error.response.status}`);
                    console.error(`📊 Response data:`, error.response.data);
                } else if (error.request) {
                    console.error('📊 No response received from webhook');
                } else {
                    console.error('📊 Request setup error:', error.message);
                }
            }
            
            throw new Error(`Webhook delivery failed: ${error}`);
        }
    }

    async testWebhook(): Promise<boolean> {
        try {
            console.log('🧪 Testing webhook connectivity...');
            
            const testPayload = {
                test: true,
                timestamp: new Date().toISOString(),
                message: 'Webhook connectivity test'
            };
            
            const response = await axios.post(config.WEBHOOK_URL, testPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Tor-Automation-Script/1.0'
                },
                timeout: 10000
            });
            
            console.log('✅ Webhook test successful');
            return response.status >= 200 && response.status < 300;
        } catch (error) {
            console.error('❌ Webhook test failed:', error);
            return false;
        }
    }
}
