# Tor Automation Script

## Overview

This is a Node.js/TypeScript automation script that uses Tor proxy to access onion sites, interact with page elements, capture screenshots, and send them to webhooks. The application is designed for automated browsing of Tor hidden services with screenshot capabilities.

**Current Status (July 21, 2025):**
- ✅ Tor proxy connection fully operational (validated with IP check)
- ✅ Browser automation working with Puppeteer
- ✅ All dependencies installed and configured
- ✅ TypeScript compilation successful
- ⚠️ Specific onion site access blocked by ERR_BLOCKED_BY_CLIENT error
- 🎯 Core infrastructure complete and ready for deployment

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Architecture
The application follows a modular, class-based architecture with clear separation of concerns:

- **TorBrowser**: Handles browser launching and Tor proxy configuration
- **ScreenshotCapture**: Manages image processing and cropping operations
- **WebhookSender**: Handles HTTP communication for sending screenshots
- **Main**: Orchestrates the entire automation workflow

### Technology Stack
- **Runtime**: Node.js with TypeScript for type safety
- **Browser Automation**: Puppeteer for headless browser control
- **Image Processing**: Sharp for screenshot cropping and optimization
- **HTTP Client**: Axios for webhook communication
- **Proxy**: Tor SOCKS5 proxy for anonymous browsing
- **Configuration**: dotenv for environment variable management

## Key Components

### TorBrowser (`src/tor-browser.ts`)
- **Purpose**: Manages browser lifecycle with Tor proxy integration
- **Key Features**:
  - Launches Puppeteer with SOCKS5 proxy configuration
  - Validates Tor connectivity by accessing onion sites
  - Configures browser security settings for anonymous browsing

### ScreenshotCapture (`src/screenshot.ts`)
- **Purpose**: Handles image processing operations
- **Key Features**:
  - Crops screenshots to specific DOM element bounds
  - Optimizes images for webhook transmission
  - Uses Sharp library for high-performance image processing

### WebhookSender (`src/webhook.ts`)
- **Purpose**: Manages HTTP communication with external webhooks
- **Key Features**:
  - Sends images as multipart form data
  - Includes metadata (timestamp, source, site URL)
  - Handles error responses and timeout configurations

### Configuration (`src/config.ts`)
- **Purpose**: Centralized configuration management
- **Key Settings**:
  - Target onion site URL
  - Tor proxy configuration (127.0.0.1:9050)
  - Browser launch options
  - Screenshot quality settings

## Data Flow

1. **Initialization**: Main script creates instances of all service classes
2. **Browser Launch**: TorBrowser launches Puppeteer with Tor proxy settings
3. **Site Navigation**: Browser navigates to configured onion site
4. **Element Interaction**: Script searches for and clicks elements containing "expires in"
5. **Page Navigation**: Handles redirects after element interaction
6. **Screenshot Capture**: Takes full page screenshot and crops to specific elements
7. **Image Processing**: ScreenshotCapture optimizes the image for transmission
8. **Webhook Delivery**: WebhookSender uploads the processed image with metadata

## External Dependencies

### Core Dependencies
- **puppeteer**: Browser automation and control
- **sharp**: High-performance image processing
- **axios**: HTTP client for webhook communication
- **form-data**: Multipart form data handling
- **dotenv**: Environment variable management

### System Requirements
- **Tor Service**: Must be running on 127.0.0.1:9050
- **Node.js**: Version 16 or higher required
- **System Dependencies**: Chrome/Chromium for Puppeteer

### Network Dependencies
- **Tor Network**: Required for accessing onion sites
- **External Webhooks**: Configured endpoint for image delivery

## Deployment Strategy

### Local Development
- Environment variables configured via `.env` file
- Tor service must be manually started
- Dependencies installed via npm

### Configuration Requirements
- **WEBHOOK_URL**: Environment variable for image delivery endpoint
- **Tor Service**: System service running on default port 9050
- **Browser Dependencies**: Puppeteer manages Chromium installation

### Security Considerations
- All traffic routed through Tor for anonymity
- Browser configured with security-focused arguments
- No persistent data storage or logging of sensitive information
- Webhook URLs should use HTTPS for secure image transmission

### Error Handling
- Connection validation before site access
- Timeout configurations for all network operations
- Graceful degradation when elements are not found
- Comprehensive error logging for debugging

### Performance Optimizations
- Headless browser operation for resource efficiency
- Image compression and optimization before transmission
- Connection pooling for webhook delivery
- Configurable timeouts to prevent hanging operations