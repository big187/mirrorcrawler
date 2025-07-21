# Tor Automation Script

A Node.js/TypeScript automation script that uses Tor proxy to access onion sites, interact with elements, and send screenshots to webhooks.

## Features

- 🌐 Access onion sites through Tor proxy (127.0.0.1:9050)
- 🔍 Find and click specific elements containing text
- 📸 Capture cropped screenshots of specific DOM elements
- 📤 Send images to webhook endpoints
- 🛡️ Error handling and connection validation with retry logic
- 🚀 TypeScript for type safety

## Status

✅ **Working Components:**
- Tor proxy connection (validated with external IP check)
- Browser automation with Puppeteer
- Screenshot capture and cropping with Sharp
- Webhook integration for image delivery
- TypeScript compilation and execution

⚠️ **Current Issue:**
- Specific onion site access blocked by `ERR_BLOCKED_BY_CLIENT` error
- This may be due to network policies or site availability

## Prerequisites

1. **Tor Service**: The script includes automated Tor startup
2. **Node.js**: Version 16 or higher
3. **Dependencies**: Auto-installed via workflows

## Installation & Usage

The project is pre-configured with all dependencies. Simply set your webhook URL and run:

1. Set the `WEBHOOK_URL` environment variable
2. Run the automation: `npm run start` or `npx ts-node src/main.ts`

## Testing

Test the Tor connection independently:
```bash
npx ts-node test-simple.ts
```

## Configuration

The webhook URL is required and should be set as an environment variable:

```env
WEBHOOK_URL=https://your-webhook-endpoint.com/webhook
