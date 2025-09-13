# Ad-Blocking Proxy Server 🚫📺

A powerful HTTP proxy server that blocks embedded URL ads and allows custom ad insertion. Perfect for removing ads from embed platforms like Vidsrc while inserting your own custom advertisements.

## Features

- ✅ **Ad Blocking**: Removes common ad networks, scripts, and elements
- ✅ **Custom Ad Injection**: Insert your own advertisements in place of blocked ads
- ✅ **Embed Support**: Works seamlessly with iframe embeds
- ✅ **Vidsrc Compatible**: Specifically designed to handle Vidsrc and similar platforms
- ✅ **Configurable**: Easy configuration of ad patterns and custom ads
- ✅ **Fast & Lightweight**: Built with Node.js and Express for optimal performance

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Use the proxy:**
   ```
   http://localhost:3000/proxy?url=<target_url>
   ```

## Usage Examples

### Basic Usage
```html
<!-- Original embed with ads -->
<iframe src="https://vidsrc.example.com/embed/movie123"></iframe>

<!-- Proxied embed without ads -->
<iframe src="http://localhost:3000/proxy?url=https://vidsrc.example.com/embed/movie123"></iframe>
```

### API Usage
```javascript
// Fetch content through the proxy
const response = await fetch('http://localhost:3000/proxy?url=https://example.com/embed');
const cleanContent = await response.text();
```

## Configuration

The proxy can be configured via `config.json`:

```json
{
  "adPatterns": ["googleads.g.doubleclick.net", "adsystem.com"],
  "customAd": {
    "enabled": true,
    "html": "<div>Your Custom Ad</div>",
    "position": "top"
  },
  "server": {
    "port": 3000,
    "timeout": 10000
  }
}
```

### Ad Patterns
Add domains and patterns to block:
- `googleads.g.doubleclick.net` - Google Ads
- `adsystem.com` - Various ad networks
- `vidsrc` - Vidsrc-specific patterns

### Custom Ads
Configure your own advertisement content:
- `enabled`: Enable/disable custom ad injection
- `html`: Your custom ad HTML content
- `position`: Where to inject the ad (top/bottom)

## API Endpoints

### `GET /proxy?url=<target_url>`
Proxy a URL and remove ads from the content.

**Parameters:**
- `url` (required): The target URL to proxy

**Response:** The proxied content with ads removed and custom ads injected.

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Ad-blocking proxy is running"
}
```

### `GET /`
Documentation and usage instructions.

## How It Works

1. **Request Interception**: The proxy intercepts HTTP requests to embed URLs
2. **Content Fetching**: Fetches the original content from the target server
3. **Ad Detection**: Identifies ad-related scripts, elements, and iframes using patterns
4. **Ad Removal**: Removes detected advertisements from the HTML content
5. **Custom Ad Injection**: Injects your custom advertisement content
6. **Clean Response**: Returns the modified content to the client

## Blocked Ad Types

- **Script-based ads**: Google Ads, DoubleClick, Amazon Ads
- **Element-based ads**: Ad banners, containers, and divs
- **Iframe ads**: Embedded advertisement frames
- **Video ads**: Pre-roll, mid-roll, and overlay video advertisements
- **Popup/Popunder ads**: Intrusive popup advertisements

## Testing

Run the test suite to validate functionality:

```bash
npm test
```

The tests verify:
- Server health and availability
- Ad pattern detection and removal
- Proxy endpoint validation
- Error handling

## Development

### Running in Development Mode
```bash
npm run dev
```

### Adding New Ad Patterns
Edit `config.json` to add new patterns:
```json
{
  "adPatterns": [
    "your-new-ad-domain.com",
    "another-ad-pattern"
  ]
}
```

### Customizing Ad Removal
The ad removal logic is in `server.js`:
- `AD_PATTERNS`: Domain-based blocking
- `AD_SCRIPT_PATTERNS`: Script content patterns
- `AD_SELECTORS`: CSS selectors for ad elements

## Production Deployment

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Use Cases

- **Content Publishers**: Remove competitor ads from embedded content
- **Educational Platforms**: Create ad-free learning environments
- **Entertainment Sites**: Replace external ads with your own promotions
- **Development/Testing**: Test content without ad interference

## Legal Considerations

- Ensure compliance with terms of service of proxied sites
- Respect copyright and intellectual property rights
- Use responsibly and ethically
- Consider the impact on content creators who rely on ad revenue

## Troubleshooting

### Common Issues

1. **CORS Errors**: The proxy includes CORS headers to prevent cross-origin issues
2. **Timeout Errors**: Increase timeout in config.json for slow-loading content
3. **Content Not Loading**: Check if the target URL is accessible and returns HTML content

### Debug Mode
Enable verbose logging by setting environment variable:
```bash
DEBUG=true npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.