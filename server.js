const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ad blocking patterns - common ad-related domains and patterns
const AD_PATTERNS = [
  // Common ad networks
  'googleads.g.doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'amazon-adsystem.com',
  'facebook.com/tr',
  'outbrain.com',
  'taboola.com',
  'adsystem.com',
  'ads.yahoo.com',
  'advertising.com',
  'adsnative.com',
  
  // Video ad patterns
  'ima3.googlesyndication.com',
  'imasdk.googleapis.com',
  'securepubads.g.doubleclick.net',
  'video-ad-stats.googlesyndication.com',
  
  // Vidsrc specific ad patterns
  'vidsrc',
  'ads.js',
  'advertising',
  'popunder',
  'popup',
  'adnxs.com',
  'adskeeper.co.uk'
];

// Script patterns to remove
const AD_SCRIPT_PATTERNS = [
  /ads?[_\-.].*\.js/i,
  /advertisement/i,
  /google.*ads/i,
  /doubleclick/i,
  /adsystem/i,
  /popunder/i,
  /popup.*ad/i
];

// CSS selectors for ad elements to remove
const AD_SELECTORS = [
  '[class*="ad"]',
  '[id*="ad"]',
  '[class*="advertisement"]',
  '[id*="advertisement"]',
  '.ads',
  '#ads',
  '.adblock',
  '.ad-container',
  '.ad-banner',
  '.popup',
  '.popunder',
  'iframe[src*="ads"]',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]'
];

// Custom ad content
const CUSTOM_AD_HTML = `
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 20px; 
            margin: 10px 0; 
            border-radius: 8px; 
            text-align: center; 
            font-family: Arial, sans-serif;">
  <h3 style="margin: 0 0 10px 0;">Custom Ad Space</h3>
  <p style="margin: 0; opacity: 0.9;">Your advertisement could be here!</p>
  <small style="opacity: 0.7;">Powered by Ad-Blocking Proxy</small>
</div>
`;

// Function to check if URL contains ad patterns
function containsAdPattern(url) {
  return AD_PATTERNS.some(pattern => url.toLowerCase().includes(pattern.toLowerCase()));
}

// Function to remove ads from HTML content
function removeAds(html) {
  const $ = cheerio.load(html);
  
  // Remove ad-related scripts
  $('script').each((i, elem) => {
    const src = $(elem).attr('src');
    const content = $(elem).html();
    
    if (src && containsAdPattern(src)) {
      $(elem).remove();
      return;
    }
    
    if (content) {
      const hasAdPattern = AD_SCRIPT_PATTERNS.some(pattern => pattern.test(content));
      if (hasAdPattern) {
        $(elem).remove();
      }
    }
  });
  
  // Remove ad-related elements
  AD_SELECTORS.forEach(selector => {
    try {
      $(selector).remove();
    } catch (e) {
      // Continue if selector is invalid
    }
  });
  
  // Remove iframes with ad-related sources
  $('iframe').each((i, elem) => {
    const src = $(elem).attr('src');
    if (src && containsAdPattern(src)) {
      $(elem).remove();
    }
  });
  
  return $.html();
}

// Function to inject custom ads
function injectCustomAds(html) {
  const $ = cheerio.load(html);
  
  // Find a good place to inject the ad (after body tag or first div)
  const bodyTag = $('body');
  const firstDiv = $('div').first();
  
  if (bodyTag.length > 0) {
    bodyTag.prepend(CUSTOM_AD_HTML);
  } else if (firstDiv.length > 0) {
    firstDiv.before(CUSTOM_AD_HTML);
  } else {
    // If no good place found, wrap content with ad
    const content = $.html();
    return CUSTOM_AD_HTML + content;
  }
  
  return $.html();
}

// Main proxy endpoint
app.get('/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Validate URL
    try {
      new URL(targetUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }
    
    console.log(`Proxying request to: ${targetUrl}`);
    
    // Fetch the content
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });
    
    let content = response.data;
    const contentType = response.headers['content-type'] || '';
    
    // Only process HTML content
    if (contentType.includes('text/html')) {
      console.log('Processing HTML content for ad removal...');
      
      // Remove ads
      content = removeAds(content);
      
      // Inject custom ads
      content = injectCustomAds(content);
      
      console.log('Ad processing completed');
    }
    
    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(content);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(404).json({ error: 'Target URL not reachable' });
    }
    
    if (error.code === 'ETIMEDOUT') {
      return res.status(408).json({ error: 'Request timeout' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ad-blocking proxy is running' });
});

// Root endpoint with usage instructions
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ad-Blocking Proxy</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .code { background: #f4f4f4; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .example { background: #e8f5e8; padding: 15px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <h1>🚫 Ad-Blocking Proxy Server</h1>
      <p>This proxy blocks embedded URL ads and allows custom ad insertion.</p>
      
      <h2>Usage</h2>
      <p>To proxy a URL and remove ads, use the following endpoint:</p>
      <div class="code">
        GET /proxy?url=&lt;target_url&gt;
      </div>
      
      <h2>Example</h2>
      <div class="example">
        <strong>Original URL:</strong><br>
        https://vidsrc.example.com/embed/movie123
        <br><br>
        <strong>Proxied URL (with ads blocked):</strong><br>
        http://localhost:${PORT}/proxy?url=https://vidsrc.example.com/embed/movie123
      </div>
      
      <h2>Features</h2>
      <ul>
        <li>✅ Blocks common ad networks and patterns</li>
        <li>✅ Removes ad-related scripts and elements</li>
        <li>✅ Injects custom advertisement content</li>
        <li>✅ Works with embed URLs and iframes</li>
        <li>✅ Handles Vidsrc and similar platforms</li>
      </ul>
      
      <h2>Iframe Usage</h2>
      <p>You can use the proxied URL directly in an iframe:</p>
      <div class="code">
        &lt;iframe src="http://localhost:${PORT}/proxy?url=https://vidsrc.example.com/embed/movie123"&gt;&lt;/iframe&gt;
      </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚫 Ad-Blocking Proxy Server running on port ${PORT}`);
  console.log(`📝 Usage: http://localhost:${PORT}/proxy?url=<target_url>`);
  console.log(`🏠 Documentation: http://localhost:${PORT}/`);
});

module.exports = app;